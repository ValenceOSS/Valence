//! The session's cookie jar on disk, sealed with a key the system keeps for this app.
//!
//! The key is kept where the system keeps secrets: the Keychain on macOS, the Credential Manager on
//! Windows and the Secret Service on Linux. The jar is sealed with it, AES-256-GCM, into
//! `cookies.sealed`, so a copy of the folder alone does not carry the session away, as Chromium's
//! own cookie store did not. Only where the system keeps no secrets at all, as on a Linux with no
//! Secret Service, is the jar kept plain in `cookies.json`, readable by this user alone. A plain jar
//! left by an earlier version is sealed and removed the first time a key can be kept.

use std::fs;
use std::io::{self, BufReader};
use std::path::{Path, PathBuf};

use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use base64::Engine;
use cookie_store::CookieStore;

const PLAIN: &str = "cookies.json";

const SEALED: &str = "cookies.sealed";

const KEYCHAIN_SERVICE: &str = "app.valence.desktop";

const KEYCHAIN_ACCOUNT: &str = "cookie-jar";

const NONCE_BYTES: usize = 12;

const KEY_BYTES: usize = 32;

/// The system's store of secrets could not be asked.
#[derive(Debug, PartialEq, Eq)]
pub struct Unavailable;

/// Where the key the jar is sealed with is kept.
pub trait Keychain {
    /// The key, or nothing where none has been kept yet.
    ///
    /// # Errors
    ///
    /// When the keychain cannot be asked.
    fn read(&self) -> Result<Option<[u8; KEY_BYTES]>, Unavailable>;

    /// Keeps `key`.
    ///
    /// # Errors
    ///
    /// When the keychain cannot be asked or will not keep it.
    fn write(&self, key: &[u8; KEY_BYTES]) -> Result<(), Unavailable>;
}

/// The keychain of the system this runs on.
pub struct SystemKeychain;

impl SystemKeychain {
    /// This app's entry in the system's keychain.
    fn entry() -> Result<keyring::Entry, Unavailable> {
        keyring::Entry::new(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT).map_err(|_| Unavailable)
    }
}

impl Keychain for SystemKeychain {
    fn read(&self) -> Result<Option<[u8; KEY_BYTES]>, Unavailable> {
        match Self::entry()?.get_password() {
            Ok(written) => Ok(base64::engine::general_purpose::STANDARD
                .decode(written)
                .ok()
                .and_then(|key| key.try_into().ok())),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(_) => Err(Unavailable),
        }
    }

    fn write(&self, key: &[u8; KEY_BYTES]) -> Result<(), Unavailable> {
        Self::entry()?
            .set_password(&base64::engine::general_purpose::STANDARD.encode(key))
            .map_err(|_| Unavailable)
    }
}

/// How the jar is kept on disk.
#[derive(Clone, Debug, PartialEq, Eq)]
enum Keeping {
    Sealed([u8; KEY_BYTES]),
    Plain,
    NotAtAll,
}

/// What was kept on disk.
#[derive(Debug)]
pub enum Kept {
    /// The cookies the jar held.
    Cookies(CookieStore),
    /// Nothing: this app has never kept a jar here.
    Nothing,
    /// A jar that cannot be opened now, because its key is gone or cannot be reached.
    Unopenable,
}

/// The cookie jar's files, and how they are kept.
#[derive(Clone, Debug)]
pub struct Jar {
    plain: PathBuf,
    sealed: PathBuf,
    keeping: Keeping,
}

impl Jar {
    /// A jar kept plain in `file`.
    #[cfg(test)]
    #[must_use]
    pub fn plain(file: PathBuf) -> Self {
        let sealed = file.with_file_name(SEALED);

        Self {
            plain: file,
            sealed,
            keeping: Keeping::Plain,
        }
    }

    /// The jar in `folder`, sealed with the key `keychain` keeps, which is made the first time.
    /// Where the keychain cannot be asked, the jar is kept plain, unless a sealed one is already
    /// there: then it is kept nowhere, rather than beside a sealed jar that would disagree with it.
    #[must_use]
    pub fn in_folder(folder: &Path, keychain: &dyn Keychain) -> Self {
        let plain = folder.join(PLAIN);
        let sealed = folder.join(SEALED);
        let keeping = match key_from(keychain) {
            Some(key) => Keeping::Sealed(key),
            None if sealed.exists() => Keeping::NotAtAll,
            None => Keeping::Plain,
        };

        Self {
            plain,
            sealed,
            keeping,
        }
    }

    /// Whether the jar is sealed with a key the system keeps.
    #[cfg(test)]
    #[must_use]
    pub fn is_sealed(&self) -> bool {
        matches!(self.keeping, Keeping::Sealed(_))
    }

    /// What the jar holds on disk. A plain jar found where a sealed one can be kept is sealed now,
    /// and the plain one removed.
    #[must_use]
    pub fn load(&self) -> Kept {
        match &self.keeping {
            Keeping::Sealed(key) => {
                if self.sealed.exists() {
                    return fs::read(&self.sealed)
                        .ok()
                        .and_then(|sealed| open(&sealed, key))
                        .and_then(|text| parsed(&text))
                        .map_or(Kept::Unopenable, Kept::Cookies);
                }

                match read_plain(&self.plain) {
                    Kept::Cookies(cookies) => {
                        if let Err(error) = self.save(&cookies) {
                            eprintln!("Valence could not seal its session: {error}");
                        }

                        Kept::Cookies(cookies)
                    }
                    other => other,
                }
            }
            Keeping::Plain => read_plain(&self.plain),
            Keeping::NotAtAll => Kept::Unopenable,
        }
    }

    /// Keeps `cookies` on disk, sealed where a key is kept, plain where none can be.
    ///
    /// # Errors
    ///
    /// When the jar cannot be written.
    pub fn save(&self, cookies: &CookieStore) -> io::Result<()> {
        let mut text = Vec::new();

        cookie_store::serde::json::save(cookies, &mut text).map_err(io::Error::other)?;

        match &self.keeping {
            Keeping::Sealed(key) => {
                crate::upstream::write_privately(&self.sealed, &seal(&text, key)?)?;

                if self.plain.exists() {
                    fs::remove_file(&self.plain)?;
                }

                Ok(())
            }
            Keeping::Plain => crate::upstream::write_privately(&self.plain, &text),
            Keeping::NotAtAll => Ok(()),
        }
    }
}

/// The key `keychain` keeps for the jar, made and kept now where there is none yet, or nothing
/// where the keychain cannot be asked or does not give back what it was given.
fn key_from(keychain: &dyn Keychain) -> Option<[u8; KEY_BYTES]> {
    match keychain.read() {
        Ok(Some(key)) => Some(key),
        Ok(None) => {
            let key: [u8; KEY_BYTES] = rand::random();

            keychain.write(&key).ok()?;

            (keychain.read() == Ok(Some(key))).then_some(key)
        }
        Err(Unavailable) => None,
    }
}

/// The plain jar in `file`.
fn read_plain(file: &Path) -> Kept {
    match fs::File::open(file) {
        Ok(opened) => cookie_store::serde::json::load(BufReader::new(opened))
            .map_or(Kept::Unopenable, Kept::Cookies),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Kept::Nothing,
        Err(_) => Kept::Unopenable,
    }
}

/// The cookies `text` holds, as the jar writes them.
fn parsed(text: &[u8]) -> Option<CookieStore> {
    cookie_store::serde::json::load(BufReader::new(text)).ok()
}

/// `text` sealed with `key`: a fresh nonce, then what AES-256-GCM made of it.
fn seal(text: &[u8], key: &[u8; KEY_BYTES]) -> io::Result<Vec<u8>> {
    let nonce: [u8; NONCE_BYTES] = rand::random();
    let sealed = Aes256Gcm::new(key.into())
        .encrypt(Nonce::from_slice(&nonce), text)
        .map_err(|_| io::Error::other("the jar could not be sealed"))?;

    Ok([nonce.as_slice(), &sealed].concat())
}

/// What `sealed` held, or nothing where `key` did not seal it.
fn open(sealed: &[u8], key: &[u8; KEY_BYTES]) -> Option<Vec<u8>> {
    let (nonce, rest) = sealed.split_at_checked(NONCE_BYTES)?;

    Aes256Gcm::new(key.into())
        .decrypt(Nonce::from_slice(nonce), rest)
        .ok()
}

#[cfg(test)]
mod tests {
    use std::cell::RefCell;

    use reqwest::Url;

    use super::*;

    #[derive(Default)]
    struct FakeKeychain {
        key: RefCell<Option<[u8; KEY_BYTES]>>,
        is_unavailable: bool,
        forgets: bool,
    }

    impl Keychain for FakeKeychain {
        fn read(&self) -> Result<Option<[u8; KEY_BYTES]>, Unavailable> {
            if self.is_unavailable {
                return Err(Unavailable);
            }

            Ok(*self.key.borrow())
        }

        fn write(&self, key: &[u8; KEY_BYTES]) -> Result<(), Unavailable> {
            if self.is_unavailable {
                return Err(Unavailable);
            }

            if !self.forgets {
                *self.key.borrow_mut() = Some(*key);
            }

            Ok(())
        }
    }

    fn a_session() -> CookieStore {
        let mut cookies = CookieStore::default();
        let server = Url::parse("http://nas:8420/").unwrap();

        cookies
            .parse("session=abc; Path=/; Max-Age=3600; HttpOnly", &server)
            .unwrap();
        cookies
    }

    fn names(kept: Kept) -> Vec<String> {
        match kept {
            Kept::Cookies(cookies) => cookies
                .iter_unexpired()
                .map(|cookie| cookie.name().to_owned())
                .collect(),
            other => panic!("expected cookies, found {other:?}"),
        }
    }

    #[test]
    fn seals_the_jar_with_a_key_the_keychain_keeps() {
        let folder = tempfile::tempdir().unwrap();
        let keychain = FakeKeychain::default();
        let jar = Jar::in_folder(folder.path(), &keychain);

        assert!(jar.is_sealed());
        assert!(matches!(jar.load(), Kept::Nothing));

        jar.save(&a_session()).unwrap();

        let on_disk = fs::read(folder.path().join(SEALED)).unwrap();

        assert!(!String::from_utf8_lossy(&on_disk).contains("abc"));
        assert!(!folder.path().join(PLAIN).exists());
        assert_eq!(
            names(Jar::in_folder(folder.path(), &keychain).load()),
            ["session"]
        );

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mode = fs::metadata(folder.path().join(SEALED))
                .unwrap()
                .permissions()
                .mode();
            assert_eq!(mode & 0o777, 0o600);
        }
    }

    #[test]
    fn seals_a_plain_jar_an_earlier_version_left_and_removes_it() {
        let folder = tempfile::tempdir().unwrap();

        Jar::plain(folder.path().join(PLAIN))
            .save(&a_session())
            .unwrap();

        let keychain = FakeKeychain::default();
        let jar = Jar::in_folder(folder.path(), &keychain);

        assert_eq!(names(jar.load()), ["session"]);
        assert!(!folder.path().join(PLAIN).exists());
        assert!(folder.path().join(SEALED).exists());
        assert_eq!(names(jar.load()), ["session"]);
    }

    #[test]
    fn keeps_the_jar_plain_where_there_is_no_keychain() {
        let folder = tempfile::tempdir().unwrap();
        let keychain = FakeKeychain {
            is_unavailable: true,
            ..FakeKeychain::default()
        };
        let jar = Jar::in_folder(folder.path(), &keychain);

        assert!(!jar.is_sealed());

        jar.save(&a_session()).unwrap();

        assert!(folder.path().join(PLAIN).exists());
        assert_eq!(names(jar.load()), ["session"]);
    }

    #[test]
    fn keeps_the_jar_plain_where_the_keychain_does_not_keep_what_it_is_given() {
        let folder = tempfile::tempdir().unwrap();
        let keychain = FakeKeychain {
            forgets: true,
            ..FakeKeychain::default()
        };

        assert!(!Jar::in_folder(folder.path(), &keychain).is_sealed());
    }

    #[test]
    fn writes_nothing_beside_a_sealed_jar_it_cannot_open_now() {
        let folder = tempfile::tempdir().unwrap();
        let keychain = FakeKeychain::default();

        Jar::in_folder(folder.path(), &keychain)
            .save(&a_session())
            .unwrap();

        let unavailable = FakeKeychain {
            is_unavailable: true,
            ..FakeKeychain::default()
        };
        let jar = Jar::in_folder(folder.path(), &unavailable);

        assert!(matches!(jar.load(), Kept::Unopenable));

        jar.save(&CookieStore::default()).unwrap();

        assert!(!folder.path().join(PLAIN).exists());
        assert_eq!(
            names(Jar::in_folder(folder.path(), &keychain).load()),
            ["session"]
        );
    }

    #[test]
    fn cannot_open_a_jar_sealed_with_a_key_since_lost() {
        let folder = tempfile::tempdir().unwrap();

        Jar::in_folder(folder.path(), &FakeKeychain::default())
            .save(&a_session())
            .unwrap();

        assert!(matches!(
            Jar::in_folder(folder.path(), &FakeKeychain::default()).load(),
            Kept::Unopenable
        ));
    }

    #[test]
    fn opens_only_what_its_own_key_sealed() {
        let sealed = seal(b"cookies", &[1; KEY_BYTES]).unwrap();

        assert_eq!(open(&sealed, &[1; KEY_BYTES]), Some(b"cookies".to_vec()));
        assert_eq!(open(&sealed, &[2; KEY_BYTES]), None);
        assert_eq!(open(&sealed[..4], &[1; KEY_BYTES]), None);
        assert_ne!(seal(b"cookies", &[1; KEY_BYTES]).unwrap(), sealed);
    }
}
