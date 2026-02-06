mod emulator;
pub mod manager;
mod pty;

pub use emulator::Emulator;
pub use manager::{manager, OutputEvent};
pub use pty::PtyHandle;
