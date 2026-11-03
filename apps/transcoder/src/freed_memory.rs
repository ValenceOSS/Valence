//! Handing memory the service has finished with back to the system.

use std::time::Duration;

/// How often freed memory is handed back.
///
/// Often enough that a burst of fingerprinting does not sit on its buffers for
/// long after it ends, and rare enough that the walk over every arena costs
/// nothing anybody could measure. A walk with nothing to give back takes
/// microseconds.
pub const GIVE_BACK_EVERY: Duration = Duration::from_secs(60);

/// Hands back to the system every whole page of heap the service has freed,
/// and says whether there were any.
///
/// glibc gives each thread that allocates its own arena, and an arena keeps
/// what is freed in it for that thread to use again rather than returning it.
/// The work here is bursty and spread over every thread the runtime has: a
/// fingerprint decodes ten minutes of audio, a picture subtitle decodes every
/// caption, each on whichever thread is free, and each thread's arena then
/// holds the high-water mark of whatever ran on it. On a twenty-core server
/// that came to fifty-three arenas holding 2.1 GB between them, almost none of
/// it in use. `malloc_trim` walks every arena and releases the free pages in
/// the middle of each, which an arena never does by itself.
///
/// Elsewhere — macOS, Windows, a musl build — the allocator returns memory on
/// its own terms, and there is nothing to do.
#[cfg_attr(
    all(target_os = "linux", target_env = "gnu"),
    allow(
        unsafe_code,
        reason = "malloc_trim has no safe wrapper; the block is the call and nothing else"
    )
)]
#[must_use]
pub fn give_back() -> bool {
    #[cfg(all(target_os = "linux", target_env = "gnu"))]
    {
        // SAFETY: malloc_trim takes the allocator's own locks, frees nothing still in use, and is safe to call from any thread at any time.
        unsafe { libc::malloc_trim(0) == 1 }
    }

    #[cfg(not(all(target_os = "linux", target_env = "gnu")))]
    {
        false
    }
}

#[cfg(all(test, target_os = "linux", target_env = "gnu"))]
mod tests {
    use super::give_back;

    /// What a thread frees stays in that thread's arena until it is asked for back, which is the
    /// memory a busy server was holding. Blocks under the mmap threshold land in the arena, and
    /// the last one stays allocated so that the arena cannot simply shrink from its top.
    #[test]
    fn gives_back_what_a_finished_thread_left_in_its_arena() {
        let kept = std::thread::spawn(|| {
            let blocks: Vec<Vec<u8>> = (0..256).map(|_| vec![7_u8; 96 * 1024]).collect();
            let pinned = vec![1_u8; 1024];

            drop(blocks);

            pinned
        })
        .join()
        .expect("the allocating thread should finish");

        assert!(give_back());
        assert_eq!(kept.len(), 1024);
    }
}

#[cfg(all(test, not(all(target_os = "linux", target_env = "gnu"))))]
mod tests {
    use super::give_back;

    /// Only glibc keeps freed memory in per-thread arenas, so there is nothing to ask for anywhere
    /// else.
    #[test]
    fn has_nothing_to_give_back_without_glibc() {
        assert!(!give_back());
    }
}
