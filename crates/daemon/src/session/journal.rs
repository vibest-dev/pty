use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::os::unix::fs::PermissionsExt;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum JournalState {
    Running,
    Exited,
    Unrecoverable,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JournalEntry {
    pub id: u32,
    pub pid: i32,
    pub pts: String,
    pub cwd: String,
    pub shell: Option<String>,
    pub cols: u16,
    pub rows: u16,
    pub state: JournalState,
    pub created_at_secs: u64,
    pub last_attached_at_secs: u64,
    pub updated_at_secs: u64,
    pub exit_code: Option<i32>,
    pub exit_signal: Option<i32>,
    pub unrecoverable_reason: Option<String>,
}

pub struct JournalStore {
    path: PathBuf,
    entries: Mutex<HashMap<u32, JournalEntry>>,
}

impl JournalStore {
    pub fn open(path: impl Into<PathBuf>) -> std::io::Result<Self> {
        let path = path.into();
        let entries = Self::load(&path)?;
        Ok(Self {
            path,
            entries: Mutex::new(entries),
        })
    }

    pub fn upsert_running(
        &self,
        id: u32,
        pid: i32,
        pts: String,
        cwd: String,
        shell: Option<String>,
        cols: u16,
        rows: u16,
        created_at_secs: u64,
        last_attached_at_secs: u64,
    ) {
        let mut entries = self.entries.lock().unwrap();
        entries.insert(
            id,
            JournalEntry {
                id,
                pid,
                pts,
                cwd,
                shell,
                cols,
                rows,
                state: JournalState::Running,
                created_at_secs,
                last_attached_at_secs,
                updated_at_secs: now_secs(),
                exit_code: None,
                exit_signal: None,
                unrecoverable_reason: None,
            },
        );
        let _ = self.persist_locked(&entries);
    }

    pub fn touch_attached(&self, id: u32, last_attached_at_secs: u64) {
        let mut entries = self.entries.lock().unwrap();
        if let Some(entry) = entries.get_mut(&id) {
            entry.last_attached_at_secs = last_attached_at_secs;
            entry.updated_at_secs = now_secs();
        }
        let _ = self.persist_locked(&entries);
    }

    pub fn mark_exit(&self, id: u32, code: i32, signal: Option<i32>) {
        let mut entries = self.entries.lock().unwrap();
        if let Some(entry) = entries.get_mut(&id) {
            entry.state = JournalState::Exited;
            entry.exit_code = Some(code);
            entry.exit_signal = signal;
            entry.unrecoverable_reason = None;
            entry.updated_at_secs = now_secs();
        }
        let _ = self.persist_locked(&entries);
    }

    pub fn mark_unrecoverable(&self, id: u32, reason: impl Into<String>) {
        let mut entries = self.entries.lock().unwrap();
        if let Some(entry) = entries.get_mut(&id) {
            entry.state = JournalState::Unrecoverable;
            entry.unrecoverable_reason = Some(reason.into());
            entry.updated_at_secs = now_secs();
        }
        let _ = self.persist_locked(&entries);
    }

    pub fn running_entries(&self) -> Vec<JournalEntry> {
        self.entries
            .lock()
            .unwrap()
            .values()
            .filter(|entry| entry.state == JournalState::Running)
            .cloned()
            .collect()
    }

    fn load(path: &Path) -> std::io::Result<HashMap<u32, JournalEntry>> {
        if !path.exists() {
            return Ok(HashMap::new());
        }

        let bytes = fs::read(path)?;
        if bytes.is_empty() {
            return Ok(HashMap::new());
        }

        let decoded: Vec<JournalEntry> = rmp_serde::from_slice(&bytes).map_err(|e| {
            std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                format!("invalid journal encoding: {}", e),
            )
        })?;

        Ok(decoded.into_iter().map(|entry| (entry.id, entry)).collect())
    }

    fn persist_locked(&self, entries: &HashMap<u32, JournalEntry>) -> std::io::Result<()> {
        if let Some(parent) = self.path.parent() {
            fs::create_dir_all(parent)?;
            let _ = fs::set_permissions(parent, fs::Permissions::from_mode(0o700));
        }

        let mut values: Vec<JournalEntry> = entries.values().cloned().collect();
        values.sort_by_key(|entry| entry.id);

        let bytes = rmp_serde::to_vec_named(&values).map_err(|e| {
            std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                format!("failed to encode journal: {}", e),
            )
        })?;

        let tmp_path = self.path.with_extension("msgpack.tmp");
        fs::write(&tmp_path, bytes)?;
        let _ = fs::set_permissions(&tmp_path, fs::Permissions::from_mode(0o600));
        fs::rename(tmp_path, &self.path)?;
        Ok(())
    }
}

pub fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}
