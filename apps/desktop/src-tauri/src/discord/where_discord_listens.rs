//! Every place the Discord client might be listening.

/// How many sockets Discord numbers.
const SOCKETS: usize = 10;

/// Where Flatpak's Discord keeps its socket, under the runtime directory.
const FLATPAK: &str = "app/com.discordapp.Discord";

/// Where Snap's Discord keeps its socket, under the runtime directory.
const SNAP: &str = "snap.discord";

/// Every place the Discord client might be listening, in the order worth trying.
///
/// Discord numbers its socket, because more than one build can run at once, so there are ten to
/// try in turn. A named pipe on Windows; the session's runtime directory on Linux, with Flatpak and
/// Snap each keeping theirs inside a directory of their own; and the per-user temporary directory
/// on a Mac, which is asked of the system where the environment does not say.
#[must_use]
pub fn where_discord_listens(
    platform: &str,
    environment: impl Fn(&str) -> Option<String>,
    temporary: &str,
) -> Vec<String> {
    if platform == "win32" {
        return (0..SOCKETS)
            .map(|at| format!(r"\\?\pipe\discord-ipc-{at}"))
            .collect();
    }

    let base = ["XDG_RUNTIME_DIR", "TMPDIR", "TMP", "TEMP"]
        .into_iter()
        .find_map(&environment)
        .unwrap_or_else(|| temporary.to_owned());
    let trimmed = base.trim_end_matches('/');

    [
        trimmed.to_owned(),
        format!("{trimmed}/{FLATPAK}"),
        format!("{trimmed}/{SNAP}"),
    ]
    .iter()
    .flat_map(|directory| (0..SOCKETS).map(move |at| format!("{directory}/discord-ipc-{at}")))
    .collect()
}

#[cfg(test)]
mod tests {
    use super::where_discord_listens;

    fn from<'a>(said: &'a [(&'a str, &'a str)]) -> impl Fn(&str) -> Option<String> + 'a {
        move |name| {
            said.iter()
                .find(|(given, _)| *given == name)
                .map(|(_, value)| (*value).to_owned())
        }
    }

    #[test]
    fn tries_ten_since_discord_numbers_its_socket() {
        let found =
            where_discord_listens("darwin", from(&[("TMPDIR", "/var/folders/x/T")]), "/tmp");

        assert_eq!(
            found
                .iter()
                .filter(|path| path.starts_with("/var/folders/x/T/discord-ipc-"))
                .count(),
            10
        );
    }

    #[test]
    fn asks_a_mac_for_the_per_user_temporary_directory() {
        assert_eq!(
            where_discord_listens("darwin", from(&[("TMPDIR", "/var/folders/x/T")]), "/tmp")[0],
            "/var/folders/x/T/discord-ipc-0"
        );
    }

    #[test]
    fn asks_windows_for_a_named_pipe() {
        assert_eq!(
            where_discord_listens("win32", from(&[]), "/tmp")[0],
            r"\\?\pipe\discord-ipc-0"
        );
    }

    #[test]
    fn prefers_the_session_runtime_directory_on_linux() {
        assert_eq!(
            where_discord_listens(
                "linux",
                from(&[("XDG_RUNTIME_DIR", "/run/user/1000"), ("TMPDIR", "/tmp")]),
                "/tmp"
            )[0],
            "/run/user/1000/discord-ipc-0"
        );
    }

    #[test]
    fn looks_inside_flatpak_and_snap() {
        let found = where_discord_listens(
            "linux",
            from(&[("XDG_RUNTIME_DIR", "/run/user/1000")]),
            "/tmp",
        );

        assert!(
            found.contains(&"/run/user/1000/app/com.discordapp.Discord/discord-ipc-0".to_owned())
        );
        assert!(found.contains(&"/run/user/1000/snap.discord/discord-ipc-0".to_owned()));
    }

    #[test]
    fn falls_back_to_the_temporary_directory_where_the_session_says_nothing() {
        assert_eq!(
            where_discord_listens("linux", from(&[]), "/tmp")[0],
            "/tmp/discord-ipc-0"
        );
    }

    #[test]
    fn does_not_double_the_slash_on_a_directory_that_ends_in_one() {
        assert_eq!(
            where_discord_listens(
                "linux",
                from(&[("XDG_RUNTIME_DIR", "/run/user/1000/")]),
                "/tmp"
            )[0],
            "/run/user/1000/discord-ipc-0"
        );
    }

    #[test]
    fn tries_the_plain_directory_before_the_packaged_ones() {
        let found = where_discord_listens(
            "linux",
            from(&[("XDG_RUNTIME_DIR", "/run/user/1000")]),
            "/tmp",
        );
        let at = |path: &str| found.iter().position(|found| found == path);

        assert!(
            at("/run/user/1000/discord-ipc-0")
                < at("/run/user/1000/app/com.discordapp.Discord/discord-ipc-0")
        );
    }

    #[test]
    fn never_falls_back_to_the_shared_directory_on_a_mac() {
        let found = where_discord_listens("darwin", from(&[]), "/var/folders/x/T");

        assert_eq!(found[0], "/var/folders/x/T/discord-ipc-0");
        assert!(!found.iter().any(|path| path.starts_with("/tmp/")));
    }
}
