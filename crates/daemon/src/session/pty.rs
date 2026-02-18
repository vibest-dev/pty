use rustix::fd::{BorrowedFd, IntoRawFd, OwnedFd};
use rustix::pty::{grantpt, openpt, ptsname, unlockpt, OpenptFlags};
use rustix::termios::{tcsetwinsize, Winsize};
use std::collections::HashMap;
use std::ffi::CString;
use std::io;

pub struct PtyHandle {
    pub master_fd: i32,
    pub pts_path: String,
    pub child_pid: i32,
}

impl PtyHandle {
    pub fn spawn(
        cwd: &str,
        shell: Option<&str>,
        env: Option<&HashMap<String, String>>,
        cols: u16,
        rows: u16,
    ) -> io::Result<Self> {
        let master: OwnedFd = openpt(OpenptFlags::RDWR | OpenptFlags::NOCTTY)
            .map_err(|e| io::Error::new(io::ErrorKind::Other, e.to_string()))?;

        grantpt(&master).map_err(|e| io::Error::new(io::ErrorKind::Other, e.to_string()))?;
        unlockpt(&master).map_err(|e| io::Error::new(io::ErrorKind::Other, e.to_string()))?;

        let pts_path = ptsname(&master, Vec::new())
            .map_err(|e| io::Error::new(io::ErrorKind::Other, e.to_string()))?
            .to_string_lossy()
            .into_owned();

        let master_fd = master.into_raw_fd();
        let child_pid = unsafe { spawn_child(&pts_path, cwd, shell, env, cols, rows) };

        if child_pid < 0 {
            unsafe { libc::close(master_fd) };
            return Err(io::Error::new(io::ErrorKind::Other, "fork failed"));
        }

        Ok(Self {
            master_fd,
            pts_path,
            child_pid,
        })
    }

    pub fn write(&self, data: &[u8]) -> io::Result<usize> {
        let fd = unsafe { BorrowedFd::borrow_raw(self.master_fd) };
        rustix::io::write(fd, data).map_err(|e| io::Error::from_raw_os_error(e.raw_os_error()))
    }

    pub fn resize(&self, cols: u16, rows: u16) -> io::Result<()> {
        let fd = unsafe { BorrowedFd::borrow_raw(self.master_fd) };
        let ws = Winsize {
            ws_col: cols,
            ws_row: rows,
            ws_xpixel: 0,
            ws_ypixel: 0,
        };
        match tcsetwinsize(fd, ws) {
            Ok(()) => Ok(()),
            Err(master_err) => {
                // Some platforms/drivers reject TIOCSWINSZ on the master PTY.
                // Fall back to opening the slave PTY path and applying ioctl there.
                self.resize_via_slave(cols, rows).map_err(|slave_err| {
                    io::Error::new(
                        io::ErrorKind::Other,
                        format!(
                            "master resize failed: {}; slave resize failed: {}",
                            master_err, slave_err
                        ),
                    )
                })
            }
        }
    }

    pub fn send_signal(&self, signal: i32) -> io::Result<()> {
        let ret = unsafe { libc::kill(self.child_pid, signal) };
        if ret == 0 {
            Ok(())
        } else {
            Err(io::Error::last_os_error())
        }
    }

    fn resize_via_slave(&self, cols: u16, rows: u16) -> io::Result<()> {
        let pts = CString::new(self.pts_path.as_str()).map_err(|_| {
            io::Error::new(
                io::ErrorKind::InvalidInput,
                "pts path contains interior null byte",
            )
        })?;

        let slave_fd = unsafe { libc::open(pts.as_ptr(), libc::O_RDWR | libc::O_NOCTTY) };
        if slave_fd < 0 {
            return Err(io::Error::last_os_error());
        }

        let ws = libc::winsize {
            ws_row: rows,
            ws_col: cols,
            ws_xpixel: 0,
            ws_ypixel: 0,
        };

        let ret = unsafe { libc::ioctl(slave_fd, libc::TIOCSWINSZ, &ws) };
        let resize_result = if ret == 0 {
            Ok(())
        } else {
            Err(io::Error::last_os_error())
        };

        let _ = unsafe { libc::close(slave_fd) };
        resize_result
    }
}

impl Drop for PtyHandle {
    fn drop(&mut self) {
        if self.master_fd >= 0 {
            unsafe { libc::close(self.master_fd) };
        }
    }
}

unsafe fn spawn_child(
    pts_path: &str,
    cwd: &str,
    shell: Option<&str>,
    env: Option<&HashMap<String, String>>,
    cols: u16,
    rows: u16,
) -> i32 {
    let pid = libc::fork();
    if pid != 0 {
        return pid;
    }

    // Child process
    libc::setsid();

    let pts = CString::new(pts_path).unwrap();
    let fd = libc::open(pts.as_ptr(), libc::O_RDWR);
    if fd < 0 {
        libc::_exit(1);
    }

    libc::ioctl(fd, libc::TIOCSCTTY as _, 0);
    libc::dup2(fd, 0);
    libc::dup2(fd, 1);
    libc::dup2(fd, 2);
    if fd > 2 {
        libc::close(fd);
    }

    // Set window size
    let ws = libc::winsize {
        ws_row: rows,
        ws_col: cols,
        ws_xpixel: 0,
        ws_ypixel: 0,
    };
    libc::ioctl(0, libc::TIOCSWINSZ, &ws);

    // Change directory
    if let Ok(cwd_cstr) = CString::new(cwd) {
        libc::chdir(cwd_cstr.as_ptr());
    }

    // Set TERM
    let term_key = CString::new("TERM").unwrap();
    let term_val = CString::new("xterm-256color").unwrap();
    libc::setenv(term_key.as_ptr(), term_val.as_ptr(), 1);

    // Set custom env
    if let Some(env_map) = env {
        for (key, value) in env_map {
            if let (Ok(k), Ok(v)) = (CString::new(key.as_str()), CString::new(value.as_str())) {
                libc::setenv(k.as_ptr(), v.as_ptr(), 1);
            }
        }
    }

    // Get shell
    let shell_path = shell
        .map(String::from)
        .or_else(|| std::env::var("SHELL").ok())
        .unwrap_or_else(|| "/bin/sh".into());

    let shell_cstr = CString::new(shell_path.clone()).unwrap();
    let is_interactive =
        shell_path.contains("zsh") || shell_path.contains("bash") || shell_path.contains("fish");

    if is_interactive {
        let arg = CString::new("-l").unwrap();
        let args = [shell_cstr.as_ptr(), arg.as_ptr(), std::ptr::null()];
        libc::execvp(shell_cstr.as_ptr(), args.as_ptr());
    } else {
        let args = [shell_cstr.as_ptr(), std::ptr::null()];
        libc::execvp(shell_cstr.as_ptr(), args.as_ptr());
    }

    libc::_exit(1);
}
