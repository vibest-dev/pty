use crate::protocol::{Snapshot, TerminalModes};
use alacritty_terminal::event::{Event, EventListener};
use alacritty_terminal::grid::Dimensions;
use alacritty_terminal::index::{Column, Line};
use alacritty_terminal::term::cell::Flags;
use alacritty_terminal::term::{Config, Term, TermMode};
use alacritty_terminal::vte::ansi::{Color, NamedColor, Processor};
use std::sync::mpsc;

/// Captures PtyWrite events from the terminal emulator.
///
/// When the terminal processes certain escape sequences (e.g. device attribute
/// queries, cursor position reports), it generates response strings that must
/// be written back to the PTY. This listener forwards them via a channel.
#[derive(Clone)]
struct DaemonListener {
    pty_write_tx: mpsc::Sender<String>,
}

impl EventListener for DaemonListener {
    fn send_event(&self, event: Event) {
        if let Event::PtyWrite(data) = event {
            let _ = self.pty_write_tx.send(data);
        }
    }
}

struct TermSize {
    cols: usize,
    rows: usize,
}

impl Dimensions for TermSize {
    fn total_lines(&self) -> usize {
        self.rows
    }

    fn screen_lines(&self) -> usize {
        self.rows
    }

    fn columns(&self) -> usize {
        self.cols
    }
}

/// Terminal emulator backed by `alacritty_terminal`.
pub struct Emulator {
    term: Term<DaemonListener>,
    processor: Processor,
    pty_write_rx: mpsc::Receiver<String>,
}

impl Emulator {
    pub fn new(cols: u16, rows: u16, max_scrollback: usize) -> Self {
        let config = Config {
            scrolling_history: max_scrollback,
            ..Default::default()
        };
        let (tx, rx) = mpsc::channel();
        let listener = DaemonListener { pty_write_tx: tx };
        let size = TermSize {
            cols: cols as usize,
            rows: rows as usize,
        };
        let term = Term::new(config, &size, listener);
        Self {
            term,
            processor: Processor::new(),
            pty_write_rx: rx,
        }
    }

    /// Feed raw PTY output bytes into the terminal emulator.
    pub fn process_bytes(&mut self, bytes: &[u8]) {
        self.processor.advance(&mut self.term, bytes);
    }

    /// Drain any write-back responses that the terminal generated.
    ///
    /// These must be written to the PTY fd so the child process receives
    /// the expected responses (e.g. cursor position reports).
    pub fn drain_pty_writes(&mut self) -> Vec<String> {
        let mut writes = Vec::new();
        while let Ok(data) = self.pty_write_rx.try_recv() {
            writes.push(data);
        }
        writes
    }

    pub fn resize(&mut self, cols: u16, rows: u16) {
        let size = TermSize {
            cols: cols as usize,
            rows: rows as usize,
        };
        self.term.resize(size);
    }

    pub fn clear_scrollback(&mut self) {
        self.term.grid_mut().clear_history();
    }

    pub fn snapshot(&self) -> Snapshot {
        let content = self.build_ansi_content();
        let mode = self.term.mode();

        let modes = TerminalModes {
            application_cursor: mode.contains(TermMode::APP_CURSOR),
            bracketed_paste: mode.contains(TermMode::BRACKETED_PASTE),
            mouse_tracking: mode.contains(TermMode::MOUSE_REPORT_CLICK)
                || mode.contains(TermMode::MOUSE_DRAG)
                || mode.contains(TermMode::MOUSE_MOTION),
            mouse_sgr: mode.contains(TermMode::SGR_MOUSE),
            focus_reporting: mode.contains(TermMode::FOCUS_IN_OUT),
            alternate_screen: mode.contains(TermMode::ALT_SCREEN),
            cursor_visible: mode.contains(TermMode::SHOW_CURSOR),
            auto_wrap: mode.contains(TermMode::LINE_WRAP),
        };

        let grid = self.term.grid();
        let renderable = self.term.renderable_content();
        let cursor = renderable.cursor;

        Snapshot {
            content,
            rehydrate: modes.to_rehydrate_sequence(),
            cols: grid.columns() as u16,
            rows: grid.screen_lines() as u16,
            cursor_x: cursor.point.column.0,
            cursor_y: cursor.point.line.0 as usize,
            modes,
            cwd: None, // CWD tracked via OSC 7 in protocol layer if needed
        }
    }

    /// Build an ANSI escape sequence string that reproduces the visible screen.
    ///
    /// Iterates all visible cells, emitting SGR sequences for color/style
    /// changes and newlines between rows.
    fn build_ansi_content(&self) -> String {
        let grid = self.term.grid();
        let cols = grid.columns();
        let screen_lines = grid.screen_lines();
        let history_lines = grid.history_size();
        let history_to_render = history_lines.min(500);
        let total_lines = history_to_render + screen_lines;

        // Pre-allocate generously
        let mut out = String::with_capacity(cols * total_lines * 4);

        // Reset terminal state and position cursor at top-left
        out.push_str("\x1b[0m\x1b[H\x1b[2J");

        let start_line = Line(-(history_to_render as i32));
        let end_line = Line(screen_lines as i32 - 1);

        let mut first_line = true;
        for line_index in start_line.0..=end_line.0 {
            if first_line {
                first_line = false;
            } else {
                out.push_str("\r\n");
            }
            // Reset SGR at each line start for robustness
            out.push_str("\x1b[0m");
            let mut prev_fg = Color::Named(NamedColor::Foreground);
            let mut prev_bg = Color::Named(NamedColor::Background);
            let mut prev_flags = Flags::empty();

            // Find last non-empty column to avoid trailing spaces
            let line = Line(line_index);
            let mut last_col = 0;
            for col in (0..cols).rev() {
                let cell = &grid[line][Column(col)];
                if cell.c != ' '
                    || cell.fg != Color::Named(NamedColor::Foreground)
                    || cell.bg != Color::Named(NamedColor::Background)
                    || !cell.flags.is_empty()
                {
                    last_col = col + 1;
                    break;
                }
            }

            for col in 0..last_col {
                let cell = &grid[line][Column(col)];

                // Skip wide char spacers
                if cell.flags.contains(Flags::WIDE_CHAR_SPACER) {
                    continue;
                }

                // Emit SGR if attributes changed
                let flags_changed = cell.flags != prev_flags;
                let fg_changed = cell.fg != prev_fg;
                let bg_changed = cell.bg != prev_bg;

                if flags_changed || fg_changed || bg_changed {
                    out.push_str("\x1b[0"); // Reset, then set active attributes

                    // Flags
                    if cell.flags.contains(Flags::BOLD) {
                        out.push_str(";1");
                    }
                    if cell.flags.contains(Flags::DIM) {
                        out.push_str(";2");
                    }
                    if cell.flags.contains(Flags::ITALIC) {
                        out.push_str(";3");
                    }
                    if cell.flags.contains(Flags::UNDERLINE) {
                        out.push_str(";4");
                    }
                    if cell.flags.contains(Flags::INVERSE) {
                        out.push_str(";7");
                    }
                    if cell.flags.contains(Flags::HIDDEN) {
                        out.push_str(";8");
                    }
                    if cell.flags.contains(Flags::STRIKEOUT) {
                        out.push_str(";9");
                    }

                    // Foreground
                    push_color_sgr(&mut out, cell.fg, true);
                    // Background
                    push_color_sgr(&mut out, cell.bg, false);

                    out.push('m');

                    prev_fg = cell.fg;
                    prev_bg = cell.bg;
                    prev_flags = cell.flags;
                }

                out.push(cell.c);
            }
        }

        // Reset SGR at the end
        out.push_str("\x1b[0m");

        out
    }
}

/// Append SGR color parameters to the output string.
fn push_color_sgr(out: &mut String, color: Color, is_fg: bool) {
    let base = if is_fg { 30 } else { 40 };

    match color {
        Color::Named(named) => {
            let code = match named {
                NamedColor::Black => Some(base),
                NamedColor::Red => Some(base + 1),
                NamedColor::Green => Some(base + 2),
                NamedColor::Yellow => Some(base + 3),
                NamedColor::Blue => Some(base + 4),
                NamedColor::Magenta => Some(base + 5),
                NamedColor::Cyan => Some(base + 6),
                NamedColor::White => Some(base + 7),
                NamedColor::BrightBlack => Some(base + 60),
                NamedColor::BrightRed => Some(base + 61),
                NamedColor::BrightGreen => Some(base + 62),
                NamedColor::BrightYellow => Some(base + 63),
                NamedColor::BrightBlue => Some(base + 64),
                NamedColor::BrightMagenta => Some(base + 65),
                NamedColor::BrightCyan => Some(base + 66),
                NamedColor::BrightWhite => Some(base + 67),
                // Foreground/Background/Cursor/Dim* are "default" — no SGR needed
                _ => None,
            };
            if let Some(c) = code {
                out.push(';');
                out.push_str(&c.to_string());
            }
        }
        Color::Indexed(idx) => {
            // 256-color: ESC[38;5;{idx}m or ESC[48;5;{idx}m
            let prefix = if is_fg { 38 } else { 48 };
            out.push(';');
            out.push_str(&prefix.to_string());
            out.push_str(";5;");
            out.push_str(&idx.to_string());
        }
        Color::Spec(rgb) => {
            // True color: ESC[38;2;r;g;bm or ESC[48;2;r;g;bm
            let prefix = if is_fg { 38 } else { 48 };
            out.push(';');
            out.push_str(&prefix.to_string());
            out.push_str(";2;");
            out.push_str(&rgb.r.to_string());
            out.push(';');
            out.push_str(&rgb.g.to_string());
            out.push(';');
            out.push_str(&rgb.b.to_string());
        }
    }
}
