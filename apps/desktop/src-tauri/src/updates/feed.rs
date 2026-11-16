//! Where releases are looked for.

use tauri::Url;

/// Where Valence is published.
const REPOSITORY: &str = "https://github.com/ValenceOSS/Valence";

/// The release manifest a feed folder holds.
const MANIFEST: &str = "latest.json";

/// Where to look for a release: the feed `VALENCE_UPDATE_FEED_URL` names, for testing an update
/// end to end; the dev channel's release, for a dev build; or the latest release.
///
/// A feed that names a folder is looked in for its manifest, as electron-updater's generic feed
/// was; one that names a manifest is read as it is.
#[must_use]
pub fn the_feed(asked: Option<&str>, is_a_dev_build: bool) -> Option<Url> {
    if let Some(asked) = asked.map(str::trim).filter(|asked| !asked.is_empty()) {
        let asked = Url::parse(asked).ok()?;

        let is_a_manifest = std::path::Path::new(asked.path())
            .extension()
            .is_some_and(|extension| extension.eq_ignore_ascii_case("json"));

        if is_a_manifest {
            return Some(asked);
        }

        let mut folder = asked;

        if !folder.path().ends_with('/') {
            let path = format!("{}/", folder.path());

            folder.set_path(&path);
        }

        return folder.join(MANIFEST).ok();
    }

    let release = if is_a_dev_build {
        "releases/download/desktop-dev"
    } else {
        "releases/latest/download"
    };

    Url::parse(&format!("{REPOSITORY}/{release}/{MANIFEST}")).ok()
}

#[cfg(test)]
mod tests {
    use super::the_feed;

    fn said(asked: Option<&str>, is_a_dev_build: bool) -> Option<String> {
        the_feed(asked, is_a_dev_build).map(String::from)
    }

    #[test]
    fn looks_at_the_latest_release() {
        assert_eq!(
            said(None, false),
            Some(
                "https://github.com/ValenceOSS/Valence/releases/latest/download/latest.json"
                    .to_owned()
            )
        );
    }

    #[test]
    fn looks_at_the_dev_channel_from_a_dev_build() {
        assert_eq!(
            said(None, true),
            Some(
                "https://github.com/ValenceOSS/Valence/releases/download/desktop-dev/latest.json"
                    .to_owned()
            )
        );
    }

    #[test]
    fn looks_where_it_is_told_to() {
        assert_eq!(
            said(Some("http://127.0.0.1:8080/feed"), false),
            Some("http://127.0.0.1:8080/feed/latest.json".to_owned())
        );
        assert_eq!(
            said(Some("http://127.0.0.1:8080/feed/"), true),
            Some("http://127.0.0.1:8080/feed/latest.json".to_owned())
        );
        assert_eq!(
            said(Some("http://127.0.0.1:8080/feed/dev.json"), false),
            Some("http://127.0.0.1:8080/feed/dev.json".to_owned())
        );
        assert_eq!(said(Some("not a feed"), false), None);
        assert_eq!(said(Some(""), false), said(None, false));
    }
}
