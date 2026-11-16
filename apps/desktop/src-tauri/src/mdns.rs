//! The one daemon this app listens to the network's announcements with.
//!
//! Each daemon runs a thread of its own and listens on every network the computer is on, and one
//! can look for any number of kinds of service at once, so Valence servers and Cast devices are
//! looked for through the same one.

use std::sync::OnceLock;

use mdns_sd::ServiceDaemon;

/// The daemon every search shares, started the first time one is wanted, or nothing where the
/// network cannot be listened to.
#[must_use]
pub fn daemon() -> Option<ServiceDaemon> {
    static STARTED: OnceLock<Option<ServiceDaemon>> = OnceLock::new();

    STARTED.get_or_init(|| ServiceDaemon::new().ok()).clone()
}

#[cfg(test)]
mod tests {
    use super::daemon;

    #[test]
    fn shares_one_daemon_between_searches() {
        let Some(first) = daemon() else {
            return;
        };
        let first_kinds = first.browse("_first-search._tcp.local.");
        let second_kinds = daemon().map(|second| second.browse("_second-search._tcp.local."));

        assert!(first_kinds.is_ok());
        assert!(second_kinds.is_some_and(|browsing| browsing.is_ok()));
    }
}
