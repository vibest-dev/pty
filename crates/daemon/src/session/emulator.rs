use crate::protocol::{Snapshot, TerminalModes};
use std::collections::VecDeque;

/// Lightweight terminal emulator for state tracking
pub struct Emulator {
    cols: u16,
    rows: u16,
    screen: Vec<Vec<char>>,
    scrollback: VecDeque<Vec<char>>,
    max_scrollback: usize,
    cursor_x: usize,
    cursor_y: usize,
    modes: TerminalModes,
    cwd: Option<String>,
    // Parsing state
    escape_state: EscapeState,
    escape_params: Vec<u16>,
    escape_intermediate: Vec<u8>,
    osc_buffer: String,
}

#[derive(Default)]
enum EscapeState {
    #[default]
    Normal,
    Escape,
    Csi,
    CsiParam,
    CsiPrivate,
    Osc,
}

impl Emulator {
    pub fn new(cols: u16, rows: u16, max_scrollback: usize) -> Self {
        let screen = vec![vec![' '; cols as usize]; rows as usize];
        Self {
            cols,
            rows,
            screen,
            scrollback: VecDeque::with_capacity(max_scrollback),
            max_scrollback,
            cursor_x: 0,
            cursor_y: 0,
            modes: TerminalModes::defaults(),
            cwd: None,
            escape_state: EscapeState::Normal,
            escape_params: Vec::new(),
            escape_intermediate: Vec::new(),
            osc_buffer: String::new(),
        }
    }

    pub fn write(&mut self, data: &[u8]) {
        for &byte in data {
            self.process_byte(byte);
        }
    }

    pub fn resize(&mut self, cols: u16, rows: u16) {
        let new_screen = vec![vec![' '; cols as usize]; rows as usize];
        let mut screen = new_screen;

        // Copy existing content
        for y in 0..self.rows.min(rows) as usize {
            for x in 0..self.cols.min(cols) as usize {
                screen[y][x] = self.screen[y][x];
            }
        }

        self.cols = cols;
        self.rows = rows;
        self.screen = screen;
        self.cursor_x = self.cursor_x.min(cols as usize - 1);
        self.cursor_y = self.cursor_y.min(rows as usize - 1);
    }

    pub fn clear_scrollback(&mut self) {
        self.scrollback.clear();
    }

    pub fn set_cwd(&mut self, cwd: String) {
        self.cwd = Some(cwd);
    }

    pub fn snapshot(&self) -> Snapshot {
        let mut content = String::new();

        // Reset and clear
        content.push_str("\x1b[0m\x1b[H\x1b[2J");

        // Scrollback (limited)
        let skip = self.scrollback.len().saturating_sub(500);
        for line in self.scrollback.iter().skip(skip) {
            for &ch in line {
                content.push(ch);
            }
            content.push_str("\r\n");
        }

        // Current screen
        for (y, row) in self.screen.iter().enumerate() {
            for &ch in row {
                content.push(ch);
            }
            if y < self.screen.len() - 1 {
                content.push_str("\r\n");
            }
        }

        // Position cursor
        content.push_str(&format!(
            "\x1b[{};{}H",
            self.cursor_y + 1,
            self.cursor_x + 1
        ));

        Snapshot {
            content,
            rehydrate: self.modes.to_rehydrate_sequence(),
            cols: self.cols,
            rows: self.rows,
            cursor_x: self.cursor_x,
            cursor_y: self.cursor_y,
            modes: self.modes.clone(),
            cwd: self.cwd.clone(),
        }
    }

    pub fn process_byte(&mut self, byte: u8) {
        match &self.escape_state {
            EscapeState::Normal => self.process_normal(byte),
            EscapeState::Escape => self.process_escape(byte),
            EscapeState::Csi | EscapeState::CsiParam => self.process_csi(byte),
            EscapeState::CsiPrivate => self.process_csi_private(byte),
            EscapeState::Osc => self.process_osc(byte),
        }
    }

    fn process_normal(&mut self, byte: u8) {
        match byte {
            0x1b => self.escape_state = EscapeState::Escape,
            0x08 => self.cursor_x = self.cursor_x.saturating_sub(1), // BS
            0x09 => self.cursor_x = ((self.cursor_x / 8) + 1) * 8,   // TAB
            0x0a | 0x0b | 0x0c => self.line_feed(),                  // LF/VT/FF
            0x0d => self.cursor_x = 0,                               // CR
            0x20..=0x7e => self.print_char(byte as char),            // Printable
            0x80..=0xff => self.print_char(byte as char),            // Extended
            _ => {}
        }
    }

    fn process_escape(&mut self, byte: u8) {
        match byte {
            b'[' => {
                self.escape_state = EscapeState::Csi;
                self.escape_params.clear();
                self.escape_intermediate.clear();
            }
            b']' => {
                self.escape_state = EscapeState::Osc;
                self.osc_buffer.clear();
            }
            b'c' => self.reset(),
            _ => self.escape_state = EscapeState::Normal,
        }
    }

    fn process_csi(&mut self, byte: u8) {
        match byte {
            b'?' => {
                self.escape_state = EscapeState::CsiPrivate;
                self.escape_params.clear();
            }
            b'0'..=b'9' => {
                let digit = (byte - b'0') as u16;
                if let Some(last) = self.escape_params.last_mut() {
                    *last = last.saturating_mul(10).saturating_add(digit);
                } else {
                    self.escape_params.push(digit);
                }
                self.escape_state = EscapeState::CsiParam;
            }
            b';' => {
                self.escape_params.push(0);
            }
            b'A'..=b'z' => {
                self.execute_csi(byte as char);
                self.escape_state = EscapeState::Normal;
            }
            _ => self.escape_state = EscapeState::Normal,
        }
    }

    fn process_csi_private(&mut self, byte: u8) {
        match byte {
            b'0'..=b'9' => {
                let digit = (byte - b'0') as u16;
                if let Some(last) = self.escape_params.last_mut() {
                    *last = last.saturating_mul(10).saturating_add(digit);
                } else {
                    self.escape_params.push(digit);
                }
            }
            b';' => self.escape_params.push(0),
            b'h' => {
                let modes: Vec<u16> = self.escape_params.drain(..).collect();
                for mode in modes {
                    self.set_mode(mode, true);
                }
                self.escape_state = EscapeState::Normal;
            }
            b'l' => {
                let modes: Vec<u16> = self.escape_params.drain(..).collect();
                for mode in modes {
                    self.set_mode(mode, false);
                }
                self.escape_state = EscapeState::Normal;
            }
            _ => self.escape_state = EscapeState::Normal,
        }
    }

    fn process_osc(&mut self, byte: u8) {
        match byte {
            0x07 | 0x9c => {
                self.handle_osc();
                self.escape_state = EscapeState::Normal;
            }
            0x1b => {
                // ST might be ESC \
                self.handle_osc();
                self.escape_state = EscapeState::Normal;
            }
            _ => {
                if self.osc_buffer.len() < 4096 {
                    self.osc_buffer.push(byte as char);
                }
            }
        }
    }

    fn handle_osc(&mut self) {
        // OSC 7: file://host/path
        if self.osc_buffer.starts_with("7;file://") {
            if let Some(path_start) = self.osc_buffer[9..].find('/') {
                let path = &self.osc_buffer[9 + path_start..];
                self.cwd = Some(urlencoding_decode(path));
            }
        }
    }

    fn execute_csi(&mut self, cmd: char) {
        let p1 = self.escape_params.first().copied().unwrap_or(1).max(1) as usize;
        let p2 = self.escape_params.get(1).copied().unwrap_or(1).max(1) as usize;

        match cmd {
            'A' => self.cursor_y = self.cursor_y.saturating_sub(p1),
            'B' => self.cursor_y = (self.cursor_y + p1).min(self.rows as usize - 1),
            'C' => self.cursor_x = (self.cursor_x + p1).min(self.cols as usize - 1),
            'D' => self.cursor_x = self.cursor_x.saturating_sub(p1),
            'H' | 'f' => {
                self.cursor_y = (p1 - 1).min(self.rows as usize - 1);
                self.cursor_x = (p2 - 1).min(self.cols as usize - 1);
            }
            'J' => self.erase_display(self.escape_params.first().copied().unwrap_or(0)),
            'K' => self.erase_line(self.escape_params.first().copied().unwrap_or(0)),
            'm' => {} // SGR - ignore for simplicity
            _ => {}
        }
    }

    fn set_mode(&mut self, mode: u16, enable: bool) {
        match mode {
            1 => self.modes.application_cursor = enable,
            25 => self.modes.cursor_visible = enable,
            47 | 1049 => {
                self.modes.alternate_screen = enable;
                if enable {
                    self.clear_screen();
                }
            }
            1000 | 1002 | 1003 => self.modes.mouse_tracking = enable,
            1004 => self.modes.focus_reporting = enable,
            1006 => self.modes.mouse_sgr = enable,
            2004 => self.modes.bracketed_paste = enable,
            7 => self.modes.auto_wrap = enable,
            _ => {}
        }
    }

    fn print_char(&mut self, ch: char) {
        if self.cursor_x >= self.cols as usize {
            if self.modes.auto_wrap {
                self.cursor_x = 0;
                self.line_feed();
            } else {
                self.cursor_x = self.cols as usize - 1;
            }
        }

        if self.cursor_y < self.screen.len() && self.cursor_x < self.screen[0].len() {
            self.screen[self.cursor_y][self.cursor_x] = ch;
        }
        self.cursor_x += 1;
    }

    fn line_feed(&mut self) {
        self.cursor_y += 1;
        if self.cursor_y >= self.rows as usize {
            self.scroll_up();
            self.cursor_y = self.rows as usize - 1;
        }
    }

    fn scroll_up(&mut self) {
        if !self.modes.alternate_screen {
            let line = self.screen.remove(0);
            if self.max_scrollback > 0 {
                if self.scrollback.len() >= self.max_scrollback {
                    self.scrollback.pop_front();
                }
                self.scrollback.push_back(line);
            }
        } else {
            self.screen.remove(0);
        }
        self.screen.push(vec![' '; self.cols as usize]);
    }

    fn clear_screen(&mut self) {
        for row in &mut self.screen {
            row.fill(' ');
        }
        self.cursor_x = 0;
        self.cursor_y = 0;
    }

    fn erase_display(&mut self, mode: u16) {
        match mode {
            0 => {
                // Cursor to end
                self.screen[self.cursor_y][self.cursor_x..].fill(' ');
                for row in &mut self.screen[self.cursor_y + 1..] {
                    row.fill(' ');
                }
            }
            1 => {
                // Start to cursor
                for row in &mut self.screen[..self.cursor_y] {
                    row.fill(' ');
                }
                self.screen[self.cursor_y][..=self.cursor_x].fill(' ');
            }
            2 | 3 => self.clear_screen(),
            _ => {}
        }
    }

    fn erase_line(&mut self, mode: u16) {
        match mode {
            0 => self.screen[self.cursor_y][self.cursor_x..].fill(' '),
            1 => self.screen[self.cursor_y][..=self.cursor_x].fill(' '),
            2 => self.screen[self.cursor_y].fill(' '),
            _ => {}
        }
    }

    fn reset(&mut self) {
        self.clear_screen();
        self.modes = TerminalModes::defaults();
        self.escape_state = EscapeState::Normal;
    }
}

fn urlencoding_decode(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let mut chars = s.chars();

    while let Some(c) = chars.next() {
        if c == '%' {
            let hex: String = chars.by_ref().take(2).collect();
            if let Ok(byte) = u8::from_str_radix(&hex, 16) {
                result.push(byte as char);
            }
        } else {
            result.push(c);
        }
    }

    result
}
