mod emulator;
pub mod manager;
mod pty;

pub use emulator::Emulator;
#[cfg(test)]
pub use manager::Manager;
pub use manager::{manager, OutputEvent};
pub use pty::PtyHandle;
