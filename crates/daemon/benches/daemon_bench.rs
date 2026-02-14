//! Benchmarks for performance-critical paths in the PTY daemon.
//!
//! Run with: cargo bench -p vibest-pty-daemon
//!
//! Covers:
//! - FrameReader decode throughput
//! - encode_message serialization speed
//! - Emulator process_bytes throughput
//! - Emulator snapshot generation
//! - Manager ReaderEvent coalescing (simulated)

use criterion::{black_box, criterion_group, criterion_main, Criterion, Throughput};
use rmp_serde::to_vec_named;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ============== FrameReader replica ==============
// We reproduce FrameReader here because the daemon is a binary crate.

const MAX_MESSAGE_SIZE: usize = 4 * 1024 * 1024;

struct FrameReader {
    buf: Vec<u8>,
    need: usize,
}

impl FrameReader {
    fn new() -> Self {
        Self {
            buf: Vec::with_capacity(4096),
            need: 0,
        }
    }

    fn push(&mut self, data: &[u8]) {
        self.buf.extend_from_slice(data);
    }

    fn try_decode<T: serde::de::DeserializeOwned>(&mut self) -> std::io::Result<Option<T>> {
        if self.need == 0 {
            if self.buf.len() < 4 {
                return Ok(None);
            }
            let len =
                u32::from_be_bytes([self.buf[0], self.buf[1], self.buf[2], self.buf[3]]) as usize;
            if len > MAX_MESSAGE_SIZE {
                return Err(std::io::Error::new(
                    std::io::ErrorKind::InvalidData,
                    "too large",
                ));
            }
            self.need = len;
            self.buf.drain(..4);
        }
        if self.buf.len() < self.need {
            return Ok(None);
        }
        let payload: Vec<u8> = self.buf.drain(..self.need).collect();
        self.need = 0;
        let msg = rmp_serde::from_slice(&payload)
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e.to_string()))?;
        Ok(Some(msg))
    }
}

fn encode_message<T: serde::Serialize>(msg: &T) -> Vec<u8> {
    let payload = to_vec_named(msg).unwrap();
    let len = (payload.len() as u32).to_be_bytes();
    let mut buf = Vec::with_capacity(4 + payload.len());
    buf.extend_from_slice(&len);
    buf.extend_from_slice(&payload);
    buf
}

// ============== Protocol message types (subset) ==============

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum Response {
    Output {
        session: u32,
        #[serde(with = "serde_bytes")]
        data: Vec<u8>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct RequestEnvelope {
    seq: u32,
    #[serde(flatten)]
    request: Request,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum Request {
    Input {
        session: u32,
        #[serde(with = "serde_bytes")]
        data: Vec<u8>,
    },
    List,
}

// ============== Emulator replica ==============
// Uses the actual alacritty_terminal crate for realistic benchmarks.

use alacritty_terminal::event::{Event, EventListener};
use alacritty_terminal::grid::Dimensions;
use alacritty_terminal::index::{Column, Line};
use alacritty_terminal::term::cell::Flags;
use alacritty_terminal::term::{Config, Term};
use alacritty_terminal::vte::ansi::{Color, NamedColor, Processor};

#[derive(Clone)]
struct NullListener;
impl EventListener for NullListener {
    fn send_event(&self, _event: Event) {}
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

fn make_emulator(cols: u16, rows: u16) -> (Term<NullListener>, Processor) {
    let config = Config {
        scrolling_history: 10000,
        ..Default::default()
    };
    let size = TermSize {
        cols: cols as usize,
        rows: rows as usize,
    };
    let term = Term::new(config, &size, NullListener);
    let processor = Processor::new();
    (term, processor)
}

fn build_ansi_snapshot(term: &Term<NullListener>) -> String {
    let grid = term.grid();
    let cols = grid.columns();
    let rows = grid.screen_lines();

    let mut out = String::with_capacity(cols * rows * 4);
    out.push_str("\x1b[0m\x1b[H\x1b[2J");

    for row in 0..rows {
        if row > 0 {
            out.push_str("\r\n");
        }
        out.push_str("\x1b[0m");
        let mut prev_fg = Color::Named(NamedColor::Foreground);
        let mut prev_bg = Color::Named(NamedColor::Background);
        let mut prev_flags = Flags::empty();

        let line = Line(row as i32);
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
            if cell.flags.contains(Flags::WIDE_CHAR_SPACER) {
                continue;
            }
            let flags_changed = cell.flags != prev_flags;
            let fg_changed = cell.fg != prev_fg;
            let bg_changed = cell.bg != prev_bg;
            if flags_changed || fg_changed || bg_changed {
                out.push_str("\x1b[0");
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
                out.push('m');
                prev_fg = cell.fg;
                prev_bg = cell.bg;
                prev_flags = cell.flags;
            }
            out.push(cell.c);
        }
    }
    out.push_str("\x1b[0m");
    out
}

// ============== Coalescing simulation ==============

#[derive(Debug)]
enum ReaderEvent {
    Data { session: u32, data: Vec<u8> },
}

fn process_reader_events(events: Vec<ReaderEvent>) -> Vec<(u32, Vec<u8>)> {
    let mut session_data: HashMap<u32, Vec<Vec<u8>>> = HashMap::new();

    for event in events {
        match event {
            ReaderEvent::Data { session, data } => {
                session_data.entry(session).or_default().push(data);
            }
        }
    }

    let mut output = Vec::new();
    for (session_id, chunks) in session_data {
        let total_len: usize = chunks.iter().map(|c| c.len()).sum();
        let mut coalesced = Vec::with_capacity(total_len);
        for chunk in chunks {
            coalesced.extend_from_slice(&chunk);
        }
        output.push((session_id, coalesced));
    }
    output
}

// ============== Benchmarks ==============

fn bench_frame_reader_decode(c: &mut Criterion) {
    let mut group = c.benchmark_group("frame_reader_decode");

    // Small message (e.g., a List request).
    let small = encode_message(&Request::List);
    group.throughput(Throughput::Bytes(small.len() as u64));
    group.bench_function("small_message", |b| {
        b.iter(|| {
            let mut reader = FrameReader::new();
            reader.push(black_box(&small));
            let _: Request = reader.try_decode().unwrap().unwrap();
        });
    });

    // Medium message (Input with 4KB payload).
    let medium = encode_message(&Request::Input {
        session: 1,
        data: vec![b'x'; 4096],
    });
    group.throughput(Throughput::Bytes(medium.len() as u64));
    group.bench_function("4KB_input_message", |b| {
        b.iter(|| {
            let mut reader = FrameReader::new();
            reader.push(black_box(&medium));
            let _: Request = reader.try_decode().unwrap().unwrap();
        });
    });

    // Batch: 100 small messages pushed at once.
    let mut batch = Vec::new();
    for i in 0..100u32 {
        batch.extend_from_slice(&encode_message(&RequestEnvelope {
            seq: i,
            request: Request::List,
        }));
    }
    group.throughput(Throughput::Elements(100));
    group.bench_function("100_messages_batch", |b| {
        b.iter(|| {
            let mut reader = FrameReader::new();
            reader.push(black_box(&batch));
            let mut count = 0u32;
            while let Ok(Some(_msg)) = reader.try_decode::<RequestEnvelope>() {
                count += 1;
            }
            assert_eq!(count, 100);
        });
    });

    group.finish();
}

fn bench_encode_message(c: &mut Criterion) {
    let mut group = c.benchmark_group("encode_message");

    // Small: Output with 64 bytes.
    let small = Response::Output {
        session: 1,
        data: vec![b'A'; 64],
    };
    group.bench_function("output_64B", |b| {
        b.iter(|| {
            let _ = encode_message(black_box(&small));
        });
    });

    // Medium: Output with 4KB.
    let medium = Response::Output {
        session: 1,
        data: vec![b'B'; 4096],
    };
    group.throughput(Throughput::Bytes(4096));
    group.bench_function("output_4KB", |b| {
        b.iter(|| {
            let _ = encode_message(black_box(&medium));
        });
    });

    // Large: Output with 64KB.
    let large = Response::Output {
        session: 1,
        data: vec![b'C'; 65536],
    };
    group.throughput(Throughput::Bytes(65536));
    group.bench_function("output_64KB", |b| {
        b.iter(|| {
            let _ = encode_message(black_box(&large));
        });
    });

    group.finish();
}

fn bench_emulator_process_bytes(c: &mut Criterion) {
    let mut group = c.benchmark_group("emulator_process_bytes");

    // Generate realistic terminal output: lines of numbered text with colors.
    let mut realistic_output = Vec::new();
    for i in 0..100 {
        let line = format!(
            "\x1b[32m{:04}\x1b[0m The quick brown fox jumps over the lazy dog\r\n",
            i
        );
        realistic_output.extend_from_slice(line.as_bytes());
    }

    group.throughput(Throughput::Bytes(realistic_output.len() as u64));
    group.bench_function("100_colored_lines", |b| {
        let (mut term, mut proc) = make_emulator(80, 24);
        b.iter(|| {
            proc.advance(&mut term, black_box(&realistic_output));
        });
    });

    // Raw ASCII: 64KB of plain text (worst case for throughput).
    let plain = vec![b'x'; 65536];
    group.throughput(Throughput::Bytes(65536));
    group.bench_function("64KB_plain_ascii", |b| {
        let (mut term, mut proc) = make_emulator(80, 24);
        b.iter(|| {
            proc.advance(&mut term, black_box(&plain));
        });
    });

    // Heavy escape sequences: cursor movements, SGR, etc.
    let mut heavy_escapes = Vec::new();
    for _ in 0..1000 {
        heavy_escapes.extend_from_slice(b"\x1b[1;31m*\x1b[0m\x1b[2D\x1b[B");
    }
    group.throughput(Throughput::Bytes(heavy_escapes.len() as u64));
    group.bench_function("1000_escape_sequences", |b| {
        let (mut term, mut proc) = make_emulator(80, 24);
        b.iter(|| {
            proc.advance(&mut term, black_box(&heavy_escapes));
        });
    });

    group.finish();
}

fn bench_emulator_snapshot(c: &mut Criterion) {
    let mut group = c.benchmark_group("emulator_snapshot");

    // Fill the terminal with content, then snapshot.
    let mut content = Vec::new();
    for i in 0..24 {
        let line = format!(
            "\x1b[{}m{:>80}\x1b[0m\r\n",
            31 + (i % 7),
            format!("line-{}", i)
        );
        content.extend_from_slice(line.as_bytes());
    }

    // 80x24 terminal.
    let (mut term, mut proc) = make_emulator(80, 24);
    proc.advance(&mut term, &content);

    group.bench_function("80x24_filled", |b| {
        b.iter(|| {
            let _ = black_box(build_ansi_snapshot(&term));
        });
    });

    // 200x50 terminal (larger).
    let mut content_large = Vec::new();
    for i in 0..50 {
        let line = format!(
            "\x1b[{}m{:>200}\x1b[0m\r\n",
            31 + (i % 7),
            format!("wide-line-{}", i)
        );
        content_large.extend_from_slice(line.as_bytes());
    }
    let (mut term_large, mut proc_large) = make_emulator(200, 50);
    proc_large.advance(&mut term_large, &content_large);

    group.bench_function("200x50_filled", |b| {
        b.iter(|| {
            let _ = black_box(build_ansi_snapshot(&term_large));
        });
    });

    // Empty terminal (best case).
    let (term_empty, _) = make_emulator(80, 24);
    group.bench_function("80x24_empty", |b| {
        b.iter(|| {
            let _ = black_box(build_ansi_snapshot(&term_empty));
        });
    });

    group.finish();
}

fn bench_coalescing(c: &mut Criterion) {
    let mut group = c.benchmark_group("coalescing");

    // Simulate coalescing 50 chunks from a single session.
    group.throughput(Throughput::Elements(50));
    group.bench_function("50_chunks_single_session", |b| {
        b.iter(|| {
            let events: Vec<ReaderEvent> = (0..50)
                .map(|_| ReaderEvent::Data {
                    session: 1,
                    data: vec![b'A'; 1300],
                })
                .collect();
            let _ = black_box(process_reader_events(events));
        });
    });

    // Multi-session: 10 sessions × 10 chunks each.
    group.throughput(Throughput::Elements(100));
    group.bench_function("100_chunks_10_sessions", |b| {
        b.iter(|| {
            let events: Vec<ReaderEvent> = (0..100)
                .map(|i| ReaderEvent::Data {
                    session: (i % 10) as u32,
                    data: vec![b'B'; 1300],
                })
                .collect();
            let _ = black_box(process_reader_events(events));
        });
    });

    // Large single chunk (64KB, simulating a single big read).
    group.throughput(Throughput::Bytes(65536));
    group.bench_function("single_64KB_chunk", |b| {
        b.iter(|| {
            let events = vec![ReaderEvent::Data {
                session: 1,
                data: vec![b'C'; 65536],
            }];
            let _ = black_box(process_reader_events(events));
        });
    });

    group.finish();
}

fn bench_sync_channel_throughput(c: &mut Criterion) {
    let mut group = c.benchmark_group("sync_channel");

    // Measure throughput of std::sync::mpsc::sync_channel (the reader→main path).
    group.throughput(Throughput::Elements(1000));
    group.bench_function("1000_send_recv_1KB", |b| {
        let (tx, rx) = std::sync::mpsc::sync_channel::<Vec<u8>>(256);
        b.iter(|| {
            let tx = tx.clone();
            let handle = std::thread::spawn(move || {
                for _ in 0..1000 {
                    tx.send(vec![0u8; 1024]).unwrap();
                }
            });
            let mut count = 0;
            while count < 1000 {
                let _ = rx.recv().unwrap();
                count += 1;
            }
            handle.join().unwrap();
        });
    });

    // Measure try_recv drain speed (what the main loop does).
    group.throughput(Throughput::Elements(1000));
    group.bench_function("drain_1000_try_recv", |b| {
        b.iter(|| {
            let (tx, rx) = std::sync::mpsc::sync_channel::<Vec<u8>>(1024);
            for _ in 0..1000 {
                tx.send(vec![0u8; 128]).unwrap();
            }
            let mut count = 0;
            while let Ok(_) = rx.try_recv() {
                count += 1;
            }
            assert_eq!(count, 1000);
        });
    });

    group.finish();
}

criterion_group!(
    benches,
    bench_frame_reader_decode,
    bench_encode_message,
    bench_emulator_process_bytes,
    bench_emulator_snapshot,
    bench_coalescing,
    bench_sync_channel_throughput,
);
criterion_main!(benches);
