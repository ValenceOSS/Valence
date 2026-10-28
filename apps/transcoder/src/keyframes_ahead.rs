//! Reading a film's keyframes before anybody presses play.
//!
//! A film is copied into segments cut on its own keyframes, so a session has to
//! know where they are before it can answer. Reading them means reading every
//! packet in the file: a large film on a spinning disk takes minutes, the
//! session gives up after two seconds, and the first play of a film that could
//! have been copied is encoded in full instead, while the read carries on
//! behind it competing for the same disk. Read ahead, in the server's own time,
//! the first play finds them kept and copies the film as it was meant to.
//!
//! This is the same read a session makes, kept in the same place, so a film
//! read ahead is cut exactly where it would have been cut anyway. Only when it
//! happens changes. It never runs while somebody is watching, since on a
//! spinning disk a whole-file read competes with the film being played, and
//! the disk scheduler a pool such as ZFS uses takes no notice of priorities: a
//! read that is asked for while anybody watches is answered "later", and one
//! under way when somebody starts is stopped and asked for again another time.

use std::time::Duration;

use serde::{Deserialize, Serialize};

use crate::session::SessionRegistry;

/// The lane read-ahead work runs in, one file at a time.
///
/// One, because each read is the whole of a file and two at once only make a
/// spinning disk seek between them.
pub const KEYFRAMES: &str = "keyframes";

/// How many files' keyframes are read at once.
pub const KEYFRAMES_AT_ONCE: usize = 1;

/// How often a read under way looks to see whether somebody has started watching.
const WATCHING_LOOKED_AT_EVERY: Duration = Duration::from_millis(100);

/// What the server asks to have read.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyframesAheadRequest {
    /// The film, as the server would ask a session to play it.
    pub input_path: String,
    /// Ties the work to the job that asked for it, in both services' logs.
    pub correlation_id: Option<String>,
}

/// What became of a request to read a film's keyframes.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum KeyframesAhead {
    /// They were already kept, so nothing was read.
    Kept,
    /// They were read just now, and are kept.
    Read,
    /// Somebody is watching, so nothing was read; ask again later.
    Later,
    /// Nothing to read here: a film made of several files, one played from a
    /// remote service, or a file with no picture.
    Skipped,
}

/// The answer the server reads.
#[derive(Debug, Serialize)]
pub struct KeyframesAheadAnswer {
    /// What became of the request.
    pub state: KeyframesAhead,
}

/// Reading one film's keyframes ahead, as the queue shows it.
pub struct KeyframesJob {
    subject: String,
}

impl KeyframesJob {
    /// A read-ahead job for the given film, named as a person would know it.
    #[must_use]
    pub fn new(subject: impl Into<String>) -> Self {
        Self {
            subject: subject.into(),
        }
    }
}

impl crate::queue::Job for KeyframesJob {
    fn kind(&self) -> &'static str {
        KEYFRAMES
    }

    fn subject(&self) -> String {
        self.subject.clone()
    }
}

/// Whether anybody is watching anything, or is pressing play on something.
///
/// A film being started counts before it is in the registry: working out where
/// it can be cut is itself a read of the film, and the one a whole-file read
/// would slow down most.
pub async fn is_somebody_watching(registry: &SessionRegistry) -> bool {
    !registry.is_empty().await || registry.is_starting().await
}

/// Resolves once anybody is watching anything, or pressing play on something.
///
/// What a read under way is stopped by, so a film somebody starts never shares
/// the disk with a whole-file read that could have waited.
pub async fn until_somebody_watches(registry: &SessionRegistry) {
    while !is_somebody_watching(registry).await {
        tokio::time::sleep(WATCHING_LOOKED_AT_EVERY).await;
    }
}
