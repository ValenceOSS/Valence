//! The session the Electron app held for the chosen server, read out of its Chromium cookie
//! database.
//!
//! The database is copied before it is opened, so nothing here can change or lock the Electron
//! app's own files. Only the cookies the chosen server would be sent are taken, and only those that
//! have not run out. Nothing a cookie holds is ever written to a log.

use std::fs;
use std::path::{Path, PathBuf};

use cookie_store::{CookieStore, RawCookie};
use reqwest::Url;
use rusqlite::{Connection, OpenFlags};
use time::OffsetDateTime;

use super::sealed_values::{open_value, SealingKeys};

const DATABASES: [&str; 2] = ["Network/Cookies", "Cookies"];

const BESIDE: [&str; 2] = ["-journal", "-wal"];

const WINDOWS_EPOCH_TO_UNIX_SECONDS: i64 = 11_644_473_600;

const MICROSECONDS: i64 = 1_000_000;

/// One cookie as Chromium kept it, with its value opened.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct KeptCookie {
    /// The host it is for: a name on its own for a cookie only that host is sent, or a name after
    /// a dot for one every host under that name is sent.
    pub host_key: String,
    /// Its name.
    pub name: String,
    /// What it holds.
    pub value: String,
    /// The path it is sent under.
    pub path: String,
    /// When it runs out, in microseconds since 1601, or 0 for one that lasts as long as the app.
    pub expires_utc: i64,
    /// Whether it is only sent over HTTPS.
    pub is_secure: bool,
    /// Whether a page's script may not read it.
    pub is_httponly: bool,
    /// Chromium's word for which cross-site requests it goes with: 0 all, 1 lax, 2 strict, -1 unsaid.
    pub samesite: i64,
}

/// The cookie database the Electron app kept in `user_data`, wherever its version of Chromium put it.
#[must_use]
pub fn database_in(user_data: &Path) -> Option<PathBuf> {
    DATABASES
        .iter()
        .map(|name| user_data.join(name))
        .find(|file| file.is_file())
}

/// Every cookie in the database at `file` whose value could be opened with `keys`.
///
/// # Errors
///
/// When the database cannot be copied or read.
pub fn read_cookies(file: &Path, keys: &SealingKeys) -> Result<Vec<KeptCookie>, rusqlite::Error> {
    let copy = tempfile::tempdir().map_err(|error| io_error(&error))?;
    let copied = copy.path().join("Cookies");

    fs::copy(file, &copied).map_err(|error| io_error(&error))?;

    for suffix in BESIDE {
        let mut beside = file.as_os_str().to_owned();
        beside.push(suffix);
        let mut beside_copied = copied.as_os_str().to_owned();
        beside_copied.push(suffix);
        let _ = fs::copy(PathBuf::from(beside), PathBuf::from(beside_copied));
    }

    let database = Connection::open_with_flags(
        &copied,
        OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )?;
    let version = database
        .query_row("SELECT value FROM meta WHERE key = 'version'", [], |row| {
            row.get::<_, String>(0)
        })
        .ok()
        .and_then(|version| version.parse::<i64>().ok())
        .unwrap_or(0);
    let mut asking = database.prepare(
        "SELECT host_key, name, value, encrypted_value, path, expires_utc, is_secure, \
         is_httponly, samesite FROM cookies",
    )?;
    let rows = asking.query_map([], |row| {
        let host_key: String = row.get(0)?;
        let plain: String = row.get(2)?;
        let encrypted: Vec<u8> = row.get(3)?;
        let value = if plain.is_empty() && !encrypted.is_empty() {
            open_value(&encrypted, keys, &host_key, version)
        } else {
            Some(plain)
        };

        Ok(value.map(|value| KeptCookie {
            host_key,
            name: row.get(1).unwrap_or_default(),
            value,
            path: row.get(4).unwrap_or_default(),
            expires_utc: row.get(5).unwrap_or_default(),
            is_secure: row.get::<_, i64>(6).unwrap_or_default() != 0,
            is_httponly: row.get::<_, i64>(7).unwrap_or_default() != 0,
            samesite: row.get(8).unwrap_or(-1),
        }))
    })?;

    Ok(rows.filter_map(Result::ok).flatten().collect())
}

/// A reading error standing for a file that could not be copied.
fn io_error(error: &std::io::Error) -> rusqlite::Error {
    rusqlite::Error::InvalidPath(PathBuf::from(error.to_string()))
}

/// When a cookie Chromium kept runs out, or nothing for one that lasts as long as the app.
#[must_use]
pub fn runs_out_at(expires_utc: i64) -> Option<OffsetDateTime> {
    if expires_utc == 0 {
        return None;
    }

    OffsetDateTime::from_unix_timestamp(
        expires_utc.div_euclid(MICROSECONDS) - WINDOWS_EPOCH_TO_UNIX_SECONDS,
    )
    .ok()
}

/// Whether `server` would be sent a cookie kept for `host_key`.
#[must_use]
pub fn is_for(host_key: &str, server: &Url) -> bool {
    let Some(host) = server.host_str() else {
        return false;
    };
    let host = host.to_ascii_lowercase();
    let host_key = host_key.to_ascii_lowercase();

    match host_key.strip_prefix('.') {
        Some(domain) => host == domain || host.ends_with(&format!(".{domain}")),
        None => host == host_key,
    }
}

/// A cookie jar holding those of `kept` that `server` would be sent and that have not run out by
/// `now`.
#[must_use]
pub fn jar_for(kept: &[KeptCookie], server: &Url, now: OffsetDateTime) -> CookieStore {
    let mut jar = CookieStore::default();

    for cookie in kept {
        let runs_out = runs_out_at(cookie.expires_utc);

        if !is_for(&cookie.host_key, server) || runs_out.is_some_and(|at| at <= now) {
            continue;
        }

        let mut raw = RawCookie::build((cookie.name.clone(), cookie.value.clone()))
            .path(cookie.path.clone())
            .secure(cookie.is_secure)
            .http_only(cookie.is_httponly);

        if let Some(domain) = cookie.host_key.strip_prefix('.') {
            raw = raw.domain(domain.to_owned());
        }

        if let Some(at) = runs_out {
            raw = raw.expires(at);
        }

        raw = match cookie.samesite {
            0 => raw.same_site(cookie::SameSite::None),
            1 => raw.same_site(cookie::SameSite::Lax),
            2 => raw.same_site(cookie::SameSite::Strict),
            _ => raw,
        };

        let _ = jar.insert_raw(&raw.build(), server);
    }

    jar
}

#[cfg(test)]
mod tests {
    use super::super::sealed_values::linux_fallback_key;
    use super::super::sealed_values::tests::{seal_cbc, with_host_digest};
    use super::*;

    const FAR_OFF: i64 = 13_500_000_000_000_000;

    const LONG_GONE: i64 = 13_000_000_000_000_000;

    type Row<'row> = (&'row str, &'row str, &'row str, Vec<u8>, i64, bool);

    /// Writes a cookie database shaped as Chromium's, of `version`, holding `rows`.
    fn a_database(folder: &Path, version: i64, rows: &[Row<'_>]) -> PathBuf {
        let file = folder.join("Cookies");
        let database = Connection::open(&file).unwrap();

        database
            .execute_batch(
                "CREATE TABLE meta(key LONGVARCHAR NOT NULL UNIQUE PRIMARY KEY, value LONGVARCHAR);
                 CREATE TABLE cookies(creation_utc INTEGER NOT NULL, host_key TEXT NOT NULL,
                   top_frame_site_key TEXT NOT NULL, name TEXT NOT NULL, value TEXT NOT NULL,
                   encrypted_value BLOB NOT NULL, path TEXT NOT NULL, expires_utc INTEGER NOT NULL,
                   is_secure INTEGER NOT NULL, is_httponly INTEGER NOT NULL,
                   last_access_utc INTEGER NOT NULL, has_expires INTEGER NOT NULL,
                   is_persistent INTEGER NOT NULL, priority INTEGER NOT NULL,
                   samesite INTEGER NOT NULL, source_scheme INTEGER NOT NULL,
                   source_port INTEGER NOT NULL, last_update_utc INTEGER NOT NULL,
                   source_type INTEGER NOT NULL, has_cross_site_ancestor INTEGER NOT NULL);",
            )
            .unwrap();
        database
            .execute(
                "INSERT INTO meta(key, value) VALUES ('version', ?1)",
                [version.to_string()],
            )
            .unwrap();

        for (host_key, name, plain, encrypted, expires_utc, is_secure) in rows {
            database
                .execute(
                    "INSERT INTO cookies VALUES (0, ?1, '', ?2, ?3, ?4, '/', ?5, ?6, 1, 0, 1, 1, 1, 1, 2, 8420, 0, 0, 0)",
                    rusqlite::params![host_key, name, plain, encrypted, expires_utc, is_secure],
                )
                .unwrap();
        }

        file
    }

    fn keys() -> SealingKeys {
        SealingKeys {
            v10: vec![linux_fallback_key()],
            ..SealingKeys::default()
        }
    }

    #[test]
    fn reads_and_opens_what_chromium_kept() {
        let folder = tempfile::tempdir().unwrap();
        let sealed = seal_cbc(
            &with_host_digest("nas.local", "secret"),
            linux_fallback_key(),
            b"v10",
        );
        let file = a_database(
            folder.path(),
            24,
            &[
                (
                    "nas.local",
                    "better-auth.session_token",
                    "",
                    sealed,
                    FAR_OFF,
                    false,
                ),
                ("nas.local", "plain", "kept-as-is", Vec::new(), 0, false),
                (
                    "nas.local",
                    "unopenable",
                    "",
                    b"v10garbage".to_vec(),
                    FAR_OFF,
                    false,
                ),
            ],
        );

        let kept = read_cookies(&file, &keys()).unwrap();

        assert_eq!(kept.len(), 2);
        assert_eq!(kept[0].name, "better-auth.session_token");
        assert_eq!(kept[0].value, "secret");
        assert!(kept[0].is_httponly);
        assert_eq!(kept[0].samesite, 1);
        assert_eq!(kept[1].value, "kept-as-is");
    }

    #[test]
    fn leaves_the_electron_apps_database_as_it_was() {
        let folder = tempfile::tempdir().unwrap();
        let file = a_database(folder.path(), 24, &[]);
        let before = fs::read(&file).unwrap();

        read_cookies(&file, &keys()).unwrap();

        assert_eq!(fs::read(&file).unwrap(), before);
    }

    #[test]
    fn finds_the_database_where_chromium_moved_it() {
        let folder = tempfile::tempdir().unwrap();

        assert_eq!(database_in(folder.path()), None);

        fs::write(folder.path().join("Cookies"), b"").unwrap();
        assert_eq!(
            database_in(folder.path()),
            Some(folder.path().join("Cookies"))
        );

        fs::create_dir(folder.path().join("Network")).unwrap();
        fs::write(folder.path().join("Network/Cookies"), b"").unwrap();
        assert_eq!(
            database_in(folder.path()),
            Some(folder.path().join("Network/Cookies"))
        );
    }

    #[test]
    fn reads_chromiums_clock() {
        assert_eq!(runs_out_at(0), None);
        assert_eq!(
            runs_out_at(13_380_000_000_000_000).map(OffsetDateTime::unix_timestamp),
            Some(1_735_526_400)
        );
    }

    #[test]
    fn sends_a_host_only_cookie_to_its_host_and_a_domain_cookie_under_its_domain() {
        let server = Url::parse("https://watch.nas.example:8420/").unwrap();

        assert!(is_for("watch.nas.example", &server));
        assert!(is_for(".nas.example", &server));
        assert!(is_for(".watch.nas.example", &server));
        assert!(!is_for("nas.example", &server));
        assert!(!is_for(".other.example", &server));
        assert!(!is_for(".as.example", &server));
    }

    #[test]
    fn puts_only_the_servers_live_cookies_in_the_jar() {
        let server = Url::parse("http://192.168.1.4:8420/").unwrap();
        let cookie = |host_key: &str, name: &str, expires_utc: i64| KeptCookie {
            host_key: host_key.to_owned(),
            name: name.to_owned(),
            value: format!("{name}-value"),
            path: "/".to_owned(),
            expires_utc,
            is_secure: false,
            is_httponly: true,
            samesite: 1,
        };
        let kept = [
            cookie("192.168.1.4", "session", FAR_OFF),
            cookie("192.168.1.4", "for-this-launch", 0),
            cookie("192.168.1.4", "ran-out", LONG_GONE),
            cookie(".youtube.com", "elsewhere", FAR_OFF),
        ];

        let jar = jar_for(&kept, &server, OffsetDateTime::now_utc());
        let mut names: Vec<_> = jar
            .iter_unexpired()
            .map(|kept| kept.name().to_owned())
            .collect();

        names.sort();
        assert_eq!(names, ["for-this-launch", "session"]);
        assert!(jar
            .iter_unexpired()
            .all(|kept| kept.http_only() == Some(true)));
    }

    #[test]
    fn keeps_a_domain_cookie_for_every_host_under_it() {
        let server = Url::parse("https://watch.nas.example/").unwrap();
        let kept = [KeptCookie {
            host_key: ".nas.example".to_owned(),
            name: "session".to_owned(),
            value: "v".to_owned(),
            path: "/api".to_owned(),
            expires_utc: FAR_OFF,
            is_secure: true,
            is_httponly: true,
            samesite: 2,
        }];

        let jar = jar_for(&kept, &server, OffsetDateTime::now_utc());
        let other = Url::parse("https://other.nas.example/api/x").unwrap();

        assert_eq!(jar.get_request_values(&other).count(), 1);
        assert_eq!(
            jar.get_request_values(&Url::parse("https://other.nas.example/").unwrap())
                .count(),
            0
        );
    }
}
