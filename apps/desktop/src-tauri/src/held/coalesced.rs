//! Writes that wait on the disk, off the runtime's own threads, one at a time, and only the latest
//! of those asked for while one was under way.

use std::sync::{Arc, Condvar, Mutex, MutexGuard, PoisonError};

/// What writes the bytes it is given.
type Writer = Arc<dyn Fn(&[u8]) + Send + Sync>;

/// What is waiting to be written, and whether a write is under way.
#[derive(Default)]
struct State {
    waiting: Option<Vec<u8>>,
    is_writing: bool,
}

/// What a writer and those asking it share.
struct Shared {
    writer: Writer,
    state: Mutex<State>,
    settled: Condvar,
}

/// Writes through `writer` on a blocking thread, never two at once, the latest bytes winning over
/// any asked for before them that had not yet been started.
#[derive(Clone)]
pub struct Coalesced(Arc<Shared>);

impl Coalesced {
    /// Writes through `writer`.
    pub fn new(writer: impl Fn(&[u8]) + Send + Sync + 'static) -> Self {
        Self(Arc::new(Shared {
            writer: Arc::new(writer),
            state: Mutex::new(State::default()),
            settled: Condvar::new(),
        }))
    }

    /// Writes `bytes` once the write under way, if any, is done, in place of anything asked for
    /// before them and not yet started.
    pub fn write(&self, bytes: Vec<u8>) {
        {
            let mut state = self.state();

            state.waiting = Some(bytes);

            if state.is_writing {
                return;
            }

            state.is_writing = true;
        }

        let writing = self.clone();

        crate::runtime::handle().spawn_blocking(move || writing.write_what_waits());
    }

    /// Waits until everything asked for has been written.
    #[cfg(test)]
    pub fn settled(&self) {
        let mut state = self.state();

        while state.is_writing {
            state = self
                .0
                .settled
                .wait(state)
                .unwrap_or_else(PoisonError::into_inner);
        }
    }

    /// Writes what waits, then whatever came while it was written, until nothing does.
    fn write_what_waits(&self) {
        loop {
            let waiting = {
                let mut state = self.state();
                let waiting = state.waiting.take();

                state.is_writing = waiting.is_some();
                waiting
            };
            let Some(bytes) = waiting else {
                self.0.settled.notify_all();
                return;
            };

            (self.0.writer)(&bytes);
        }
    }

    /// What is waiting, whatever another thread was doing when it panicked.
    fn state(&self) -> MutexGuard<'_, State> {
        self.0.state.lock().unwrap_or_else(PoisonError::into_inner)
    }
}

#[cfg(test)]
#[allow(
    clippy::unwrap_used,
    reason = "a test that cannot set up should fail loudly"
)]
mod tests {
    use super::Coalesced;
    use std::sync::mpsc;
    use std::sync::{Arc, Mutex};

    #[test]
    fn writes_only_the_latest_of_what_came_while_one_was_written() {
        let written = Arc::new(Mutex::new(Vec::new()));
        let (started, has_started) = mpsc::channel();
        let (go_on, may_go_on) = mpsc::channel::<()>();
        let may_go_on = Mutex::new(may_go_on);
        let writing = Arc::clone(&written);
        let coalesced = Coalesced::new(move |bytes| {
            started.send(()).unwrap();
            may_go_on.lock().unwrap().recv().unwrap();
            writing.lock().unwrap().push(bytes.to_vec());
        });

        coalesced.write(b"1".to_vec());
        has_started.recv().unwrap();

        coalesced.write(b"2".to_vec());
        coalesced.write(b"3".to_vec());
        coalesced.write(b"4".to_vec());

        go_on.send(()).unwrap();
        has_started.recv().unwrap();
        go_on.send(()).unwrap();
        coalesced.settled();

        assert_eq!(*written.lock().unwrap(), [b"1".to_vec(), b"4".to_vec()]);
    }

    #[test]
    fn writes_again_once_settled() {
        let written = Arc::new(Mutex::new(Vec::new()));
        let writing = Arc::clone(&written);
        let coalesced = Coalesced::new(move |bytes| writing.lock().unwrap().push(bytes.to_vec()));

        coalesced.write(b"1".to_vec());
        coalesced.settled();
        coalesced.write(b"2".to_vec());
        coalesced.settled();

        assert_eq!(*written.lock().unwrap(), [b"1".to_vec(), b"2".to_vec()]);
    }
}
