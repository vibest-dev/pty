use std::io::{Read, Write};
use std::os::unix::net::UnixStream;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

const MAX_MESSAGE_SIZE: usize = 4 * 1024 * 1024; // 4MB

pub fn read_message<T: serde::de::DeserializeOwned>(stream: &mut UnixStream) -> std::io::Result<T> {
    let mut len_buf = [0u8; 4];
    stream.read_exact(&mut len_buf)?;

    let len = u32::from_be_bytes(len_buf) as usize;
    if len > MAX_MESSAGE_SIZE {
        return Err(std::io::Error::new(
            std::io::ErrorKind::InvalidData,
            format!("message too large: {} bytes", len),
        ));
    }

    let mut payload = vec![0u8; len];
    stream.read_exact(&mut payload)?;

    rmp_serde::from_slice(&payload).map_err(|e| {
        std::io::Error::new(std::io::ErrorKind::InvalidData, e.to_string())
    })
}

pub fn write_message<T: serde::Serialize>(stream: &mut UnixStream, msg: &T) -> std::io::Result<()> {
    let payload = rmp_serde::to_vec_named(msg).map_err(|e| {
        std::io::Error::new(std::io::ErrorKind::InvalidData, e.to_string())
    })?;

    let len = (payload.len() as u32).to_be_bytes();
    stream.write_all(&len)?;
    stream.write_all(&payload)?;
    stream.flush()
}

// Async versions for tokio
pub async fn read_message_async<T: serde::de::DeserializeOwned>(
    stream: &mut tokio::net::UnixStream,
) -> std::io::Result<T> {
    let mut len_buf = [0u8; 4];
    stream.read_exact(&mut len_buf).await?;

    let len = u32::from_be_bytes(len_buf) as usize;
    if len > MAX_MESSAGE_SIZE {
        return Err(std::io::Error::new(
            std::io::ErrorKind::InvalidData,
            format!("message too large: {} bytes", len),
        ));
    }

    let mut payload = vec![0u8; len];
    stream.read_exact(&mut payload).await?;

    rmp_serde::from_slice(&payload).map_err(|e| {
        std::io::Error::new(std::io::ErrorKind::InvalidData, e.to_string())
    })
}

pub async fn write_message_async<T: serde::Serialize>(
    stream: &mut tokio::net::UnixStream,
    msg: &T,
) -> std::io::Result<()> {
    let payload = rmp_serde::to_vec_named(msg).map_err(|e| {
        std::io::Error::new(std::io::ErrorKind::InvalidData, e.to_string())
    })?;

    let len = (payload.len() as u32).to_be_bytes();
    stream.write_all(&len).await?;
    stream.write_all(&payload).await?;
    stream.flush().await
}
