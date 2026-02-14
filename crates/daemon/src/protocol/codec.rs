use std::io::{self, Read, Write};

const MAX_MESSAGE_SIZE: usize = 4 * 1024 * 1024; // 4MB

/// Read a length-prefixed msgpack message from a blocking stream.
#[allow(dead_code)]
pub fn read_message<T: serde::de::DeserializeOwned>(stream: &mut impl Read) -> io::Result<T> {
    let mut len_buf = [0u8; 4];
    stream.read_exact(&mut len_buf)?;

    let len = u32::from_be_bytes(len_buf) as usize;
    if len > MAX_MESSAGE_SIZE {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            format!("message too large: {} bytes", len),
        ));
    }

    let mut payload = vec![0u8; len];
    stream.read_exact(&mut payload)?;

    rmp_serde::from_slice(&payload)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e.to_string()))
}

/// Write a length-prefixed msgpack message to a blocking stream.
#[allow(dead_code)]
pub fn write_message<T: serde::Serialize>(stream: &mut impl Write, msg: &T) -> io::Result<()> {
    let payload = rmp_serde::to_vec_named(msg)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e.to_string()))?;

    let len = (payload.len() as u32).to_be_bytes();
    stream.write_all(&len)?;
    stream.write_all(&payload)?;
    stream.flush()
}

/// Serialize a message into a length-prefixed byte buffer (for non-blocking writes).
pub fn encode_message<T: serde::Serialize>(msg: &T) -> io::Result<Vec<u8>> {
    let payload = rmp_serde::to_vec_named(msg)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e.to_string()))?;

    let len = (payload.len() as u32).to_be_bytes();
    let mut buf = Vec::with_capacity(4 + payload.len());
    buf.extend_from_slice(&len);
    buf.extend_from_slice(&payload);
    Ok(buf)
}

/// Non-blocking frame reader that accumulates data across calls.
///
/// Returns `Ok(Some(msg))` when a complete frame is available,
/// `Ok(None)` when more data is needed, or `Err` on failure.
pub struct FrameReader {
    buf: Vec<u8>,
    need: usize, // 0 = reading header, >0 = reading payload of this size
}

impl FrameReader {
    pub fn new() -> Self {
        Self {
            buf: Vec::with_capacity(4096),
            need: 0,
        }
    }

    /// Feed data from a non-blocking read. Call this with whatever bytes
    /// were read from the socket. Then call `try_decode` to extract frames.
    pub fn push(&mut self, data: &[u8]) {
        self.buf.extend_from_slice(data);
    }

    /// Try to decode a complete frame from the buffer.
    /// Returns decoded messages until the buffer is exhausted.
    pub fn try_decode<T: serde::de::DeserializeOwned>(&mut self) -> io::Result<Option<T>> {
        loop {
            if self.need == 0 {
                // Need 4-byte length header
                if self.buf.len() < 4 {
                    return Ok(None);
                }
                let len = u32::from_be_bytes([self.buf[0], self.buf[1], self.buf[2], self.buf[3]])
                    as usize;
                if len > MAX_MESSAGE_SIZE {
                    return Err(io::Error::new(
                        io::ErrorKind::InvalidData,
                        format!("message too large: {} bytes", len),
                    ));
                }
                self.need = len;
                // Remove header bytes
                self.buf.drain(..4);
            }

            if self.buf.len() < self.need {
                return Ok(None);
            }

            let payload: Vec<u8> = self.buf.drain(..self.need).collect();
            self.need = 0;

            let msg = rmp_serde::from_slice(&payload)
                .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e.to_string()))?;

            return Ok(Some(msg));
        }
    }
}
