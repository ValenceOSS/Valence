//! How Chromium seals what it keeps on disk, cookie values among it, and how to open a value again
//! with the key it was sealed with.
//!
//! A sealed value starts with three bytes naming how it was sealed: `v10` and `v11` on Linux,
//! `v10` on macOS, and `v10` or `v20` on Windows. On Linux and macOS the rest is AES-128-CBC with
//! an IV of sixteen spaces, under a key derived from a password with PBKDF2-HMAC-SHA1 and the salt
//! `saltysalt`; on Windows it is AES-256-GCM, a 12-byte nonce first and the tag last. Since version
//! 24 of the cookie database, what is sealed starts with the SHA-256 of the cookie's host, so a
//! value cannot be moved from one host's cookie to another's.

use aes::cipher::block_padding::Pkcs7;
use aes::cipher::{BlockDecryptMut, KeyIvInit};
use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use sha1::Sha1;
use sha2::{Digest, Sha256};

const SALT: &[u8] = b"saltysalt";

const IV: [u8; 16] = [b' '; 16];

#[cfg_attr(
    not(any(target_os = "linux", test)),
    allow(dead_code, reason = "only Linux seals with it")
)]
const LINUX_ROUNDS: u32 = 1;

#[cfg_attr(
    not(any(target_os = "macos", test)),
    allow(dead_code, reason = "only a Mac seals with it")
)]
const MAC_ROUNDS: u32 = 1003;

#[cfg_attr(
    not(any(target_os = "linux", test)),
    allow(dead_code, reason = "only Linux seals with it")
)]
const LINUX_FALLBACK_PASSWORD: &[u8] = b"peanuts";

const HOST_DIGEST_SINCE: i64 = 24;

const NONCE_BYTES: usize = 12;

const PREFIX_BYTES: usize = 3;

type Aes128CbcOpener = cbc::Decryptor<aes::Aes128>;

/// A key Chromium sealed values with.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SealingKey {
    /// AES-128-CBC, as on Linux and macOS.
    Cbc([u8; 16]),
    /// AES-256-GCM, as on Windows.
    #[cfg_attr(
        not(any(windows, test)),
        allow(dead_code, reason = "only Windows seals with it")
    )]
    Gcm([u8; 32]),
}

impl SealingKey {
    /// Opens `sealed`, the part of a value after its prefix, or nothing where this key did not
    /// seal it.
    #[must_use]
    pub fn open(&self, sealed: &[u8]) -> Option<Vec<u8>> {
        match self {
            Self::Cbc(key) => open_cbc(sealed, key),
            Self::Gcm(key) => open_gcm(sealed, key),
        }
    }
}

/// The keys that may have sealed a value, for each prefix a value can start with. Each is tried in
/// turn until one opens it.
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct SealingKeys {
    /// The keys for values that start `v10`.
    pub v10: Vec<SealingKey>,
    /// The keys for values that start `v11`.
    pub v11: Vec<SealingKey>,
    /// The keys for values that start `v20`.
    pub v20: Vec<SealingKey>,
}

impl SealingKeys {
    /// The keys that may have sealed a value starting with `prefix`.
    fn for_prefix(&self, prefix: &[u8]) -> &[SealingKey] {
        match prefix {
            b"v10" => &self.v10,
            b"v11" => &self.v11,
            b"v20" => &self.v20,
            _ => &[],
        }
    }
}

/// The key Chromium derives from `password` with PBKDF2-HMAC-SHA1 over `rounds` rounds.
#[must_use]
pub fn key_from_password(password: &[u8], rounds: u32) -> SealingKey {
    let mut key = [0; 16];

    pbkdf2::pbkdf2_hmac::<Sha1>(password, SALT, rounds, &mut key);
    SealingKey::Cbc(key)
}

/// The key a Linux Chromium seals with when it has a password from the system's keyring.
#[cfg_attr(
    not(any(target_os = "linux", test)),
    allow(dead_code, reason = "only Linux seals with it")
)]
#[must_use]
pub fn linux_key(password: &[u8]) -> SealingKey {
    key_from_password(password, LINUX_ROUNDS)
}

/// The key a Linux Chromium seals `v10` values with, and anything else where no keyring answered.
#[cfg_attr(
    not(any(target_os = "linux", test)),
    allow(dead_code, reason = "only Linux seals with it")
)]
#[must_use]
pub fn linux_fallback_key() -> SealingKey {
    linux_key(LINUX_FALLBACK_PASSWORD)
}

/// The key a Mac Chromium seals with, from the password kept in the Keychain.
#[cfg_attr(
    not(any(target_os = "macos", test)),
    allow(dead_code, reason = "only a Mac seals with it")
)]
#[must_use]
pub fn mac_key(password: &[u8]) -> SealingKey {
    key_from_password(password, MAC_ROUNDS)
}

/// Opens one value AES-128-CBC sealed with `key`, or nothing where the key or the padding is wrong.
fn open_cbc(sealed: &[u8], key: &[u8; 16]) -> Option<Vec<u8>> {
    let mut buffer = sealed.to_vec();
    let opened = Aes128CbcOpener::new(key.into(), &IV.into())
        .decrypt_padded_mut::<Pkcs7>(&mut buffer)
        .ok()?
        .len();

    buffer.truncate(opened);
    Some(buffer)
}

/// Opens one value AES-256-GCM sealed with `key`, or nothing where it does not authenticate.
fn open_gcm(sealed: &[u8], key: &[u8; 32]) -> Option<Vec<u8>> {
    let (nonce, rest) = sealed.split_at_checked(NONCE_BYTES)?;

    Aes256Gcm::new(key.into())
        .decrypt(Nonce::from_slice(nonce), rest)
        .ok()
}

/// What one sealed value said, opened with whichever of `keys` sealed it, or nothing where none
/// did. A value from a database of `version` 24 or later has to start with the digest of
/// `host_key`, which is taken off.
#[must_use]
pub fn open_value(
    encrypted: &[u8],
    keys: &SealingKeys,
    host_key: &str,
    version: i64,
) -> Option<String> {
    let (prefix, sealed) = encrypted.split_at_checked(PREFIX_BYTES)?;

    keys.for_prefix(prefix).iter().find_map(|key| {
        let opened = key.open(sealed)?;
        let value = if version >= HOST_DIGEST_SINCE {
            without_host_digest(&opened, host_key)?
        } else {
            opened
        };

        String::from_utf8(value).ok()
    })
}

/// `opened` without the digest of `host_key` it starts with, or nothing where it does not start
/// with that digest.
fn without_host_digest(opened: &[u8], host_key: &str) -> Option<Vec<u8>> {
    let (digest, rest) = opened.split_at_checked(32)?;

    (digest == Sha256::digest(host_key.as_bytes()).as_slice()).then(|| rest.to_vec())
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use aes::cipher::BlockEncryptMut;
    use aes_gcm::aead::AeadCore;

    type Aes128CbcSealer = cbc::Encryptor<aes::Aes128>;

    /// Seals `plain` the way a Linux or Mac Chromium does, with `key` and the `v10` prefix.
    pub fn seal_cbc(plain: &[u8], key: SealingKey, prefix: &[u8]) -> Vec<u8> {
        let SealingKey::Cbc(key) = key else {
            panic!("a CBC key");
        };
        [prefix, &sealed_cbc(plain, &key)].concat()
    }

    /// `plain` AES-128-CBC sealed with `key` and Chromium's IV.
    fn sealed_cbc(plain: &[u8], key: &[u8; 16]) -> Vec<u8> {
        let mut buffer = plain.to_vec();

        buffer.resize(plain.len() + 16, 0);

        let sealed = Aes128CbcSealer::new(key.into(), &IV.into())
            .encrypt_padded_mut::<Pkcs7>(&mut buffer, plain.len())
            .expect("room for the padding")
            .len();

        buffer.truncate(sealed);
        buffer
    }

    /// Seals `plain` the way a Windows Chromium does, with `key` and `prefix`.
    pub fn seal_gcm(plain: &[u8], key: &[u8; 32], prefix: &[u8]) -> Vec<u8> {
        let cipher = Aes256Gcm::new(key.into());
        let nonce = Aes256Gcm::generate_nonce(&mut aes_gcm::aead::OsRng);
        let sealed = cipher.encrypt(&nonce, plain).expect("sealed");

        [prefix, nonce.as_slice(), &sealed].concat()
    }

    /// What Chromium seals for a value in a database of version 24 or later.
    pub fn with_host_digest(host_key: &str, value: &str) -> Vec<u8> {
        [
            Sha256::digest(host_key.as_bytes()).as_slice(),
            value.as_bytes(),
        ]
        .concat()
    }

    fn hex(bytes: &[u8]) -> String {
        bytes.iter().fold(String::new(), |mut written, byte| {
            use std::fmt::Write;
            let _ = write!(written, "{byte:02x}");
            written
        })
    }

    #[test]
    fn derives_linuxs_fallback_key_as_chromium_does() {
        let SealingKey::Cbc(key) = linux_fallback_key() else {
            panic!("a CBC key");
        };

        assert_eq!(hex(&key), "fd621fe5a2b402539dfa147ca9272778");
    }

    #[test]
    fn derives_a_macs_key_over_more_rounds_than_linuxs() {
        let SealingKey::Cbc(mac) = mac_key(b"secret") else {
            panic!("a CBC key");
        };
        let SealingKey::Cbc(linux) = linux_key(b"secret") else {
            panic!("a CBC key");
        };
        let mut expected = [0; 16];

        pbkdf2::pbkdf2_hmac::<Sha1>(b"secret", b"saltysalt", 1003, &mut expected);

        assert_eq!(mac, expected);
        assert_ne!(mac, linux);
    }

    #[test]
    fn opens_a_known_cbc_vector() {
        let SealingKey::Cbc(key) = linux_fallback_key() else {
            panic!("a CBC key");
        };
        let sealed = sealed_cbc(b"session-token", &key);

        assert_eq!(hex(&sealed), "757e275851a537ece1ae4f1204c53632");
        assert_eq!(open_cbc(&sealed, &key), Some(b"session-token".to_vec()));
    }

    #[test]
    fn opens_a_value_sealed_on_linux_or_a_mac() {
        let key = linux_key(b"from the keyring");
        let keys = SealingKeys {
            v10: vec![linux_fallback_key()],
            v11: vec![linux_fallback_key(), key],
            v20: Vec::new(),
        };
        let sealed = seal_cbc(&with_host_digest("nas.local", "abc"), key, b"v11");

        assert_eq!(
            open_value(&sealed, &keys, "nas.local", 24),
            Some("abc".to_owned())
        );
    }

    #[test]
    fn opens_an_older_databases_value_without_a_digest() {
        let keys = SealingKeys {
            v10: vec![linux_fallback_key()],
            ..SealingKeys::default()
        };
        let sealed = seal_cbc(b"abc", linux_fallback_key(), b"v10");

        assert_eq!(
            open_value(&sealed, &keys, "nas.local", 23),
            Some("abc".to_owned())
        );
    }

    #[test]
    fn refuses_a_value_moved_from_another_hosts_cookie() {
        let keys = SealingKeys {
            v10: vec![linux_fallback_key()],
            ..SealingKeys::default()
        };
        let sealed = seal_cbc(
            &with_host_digest("elsewhere.example", "abc"),
            linux_fallback_key(),
            b"v10",
        );

        assert_eq!(open_value(&sealed, &keys, "nas.local", 24), None);
    }

    #[test]
    fn opens_a_value_sealed_on_windows() {
        let key = [7; 32];
        let keys = SealingKeys {
            v10: vec![SealingKey::Gcm(key)],
            v20: vec![SealingKey::Gcm(key)],
            ..SealingKeys::default()
        };
        let sealed = seal_gcm(&with_host_digest(".nas.example", "xyz"), &key, b"v10");

        assert_eq!(
            open_value(&sealed, &keys, ".nas.example", 24),
            Some("xyz".to_owned())
        );
        assert_eq!(open_value(&sealed, &keys, "nas.example", 24), None);
    }

    #[test]
    fn opens_a_known_gcm_vector() {
        let key = [0; 32];
        let nonce = [0; 12];
        let cipher = Aes256Gcm::new(&key.into());
        let sealed = cipher
            .encrypt(Nonce::from_slice(&nonce), b"".as_slice())
            .expect("sealed");

        assert_eq!(hex(&sealed), "530f8afbc74536b9a963b4f1c4cb738b");
        assert_eq!(
            open_gcm(&[nonce.as_slice(), &sealed].concat(), &key),
            Some(Vec::new())
        );
    }

    #[test]
    fn opens_nothing_with_the_wrong_key_or_prefix() {
        let keys = SealingKeys {
            v10: vec![SealingKey::Gcm([1; 32])],
            ..SealingKeys::default()
        };

        assert_eq!(
            open_value(&seal_gcm(b"abc", &[2; 32], b"v10"), &keys, "h", 0),
            None
        );
        assert_eq!(
            open_value(&seal_gcm(b"abc", &[1; 32], b"v99"), &keys, "h", 0),
            None
        );
        assert_eq!(open_value(b"v1", &keys, "h", 0), None);
    }
}
