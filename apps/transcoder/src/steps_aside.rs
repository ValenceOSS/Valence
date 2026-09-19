//! Letting a background render give way to whatever somebody is watching.

use tokio::process::Command;

/// How far a background render gets out of the way.
///
/// Ten of a possible twenty. Far enough that a transcode somebody is waiting on
/// always wins a contended processor, and not so far that the render is starved
/// by every passing housekeeping task.
#[cfg(unix)]
const POLITENESS: i32 = 10;

/// Asks a render to give way to anything a viewer is waiting on.
///
/// A scan draws clips and thumbnails for hours, and it does that while people
/// are watching. Nothing made it yield: a render and a transcode arrived at the
/// processor as equals, so a library being worked through competed with the
/// film it was being worked through for.
///
/// Niceness, rather than fewer threads or fewer jobs, because it costs nothing
/// when the machine is idle. A render still uses everything going spare and
/// stops the moment something else wants it, which is the behaviour a
/// background job should have had from the start. Jellyfin runs its thumbnail
/// passes Below Normal for the same reason.
///
/// This is the processor only. It says nothing about a disk or a graphics chip,
/// and on this library the disk is usually the thing being queued for — one
/// render at a time is what answers that, and this answers the other.
///
/// Returns the same command, so it can be built up in one expression.
#[cfg_attr(
    unix,
    allow(
        unsafe_code,
        reason = "setpriority has no safe wrapper; the block is the call and nothing else"
    )
)]
pub fn steps_aside(command: &mut Command) -> &mut Command {
    #[cfg(unix)]
    {
        // SAFETY: setpriority is async-signal-safe and touches only the calling process, which between fork and exec is the child alone.
        unsafe {
            command.pre_exec(|| {
                libc::setpriority(libc::PRIO_PROCESS, 0, POLITENESS);

                Ok(())
            });
        }
    }

    command
}

#[cfg(all(test, unix))]
mod tests {
    use super::{steps_aside, POLITENESS};
    use tokio::process::Command;

    /// A render that arrives at the processor as an equal competes with the film somebody is
    /// watching, which is the one thing a background job must never do.
    ///
    /// The kernel is asked directly rather than through `ps`, which is not on every image this is
    /// built in: a Debian slim image carries no `procps`, so the question came back empty there
    /// while passing everywhere a developer ran it.
    #[tokio::test]
    #[allow(
        unsafe_code,
        reason = "getpriority has no safe wrapper; the block is the call and nothing else"
    )]
    async fn runs_a_child_below_whatever_somebody_is_waiting_on() {
        let mut child = steps_aside(&mut Command::new("sleep"))
            .arg("30")
            .spawn()
            .expect("sleep should run");

        let pid = child
            .id()
            .expect("a child that has just started has an identifier");

        // SAFETY: getpriority reads one process's scheduling priority and writes nothing.
        let nice = unsafe { libc::getpriority(libc::PRIO_PROCESS, pid) };

        child
            .kill()
            .await
            .expect("the child should stop when asked");

        assert_eq!(nice, POLITENESS);
    }
}
