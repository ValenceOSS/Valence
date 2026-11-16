//! Where the Electron app's Chromium kept the key it sealed values with, on each system.
//!
//! Electron names that key after the app: on macOS it is the Keychain item `Valence Safe Storage`
//! under the account `Valence`; on Linux it is the Secret Service item of the application `Valence`
//! or, under KDE, the `KWallet` entry `Valence Safe Storage` in the folder `Valence Keys`, each also
//! looked for under Chromium's own names, with the fixed `peanuts` key where none was there; on
//! Windows it is the key in `Local State`, sealed by the system for this user.

use std::path::Path;

#[cfg(any(target_os = "linux", target_os = "macos"))]
use super::sealed_values::SealingKey;
use super::sealed_values::SealingKeys;

#[cfg(any(target_os = "linux", target_os = "macos"))]
const APP_NAME: &str = "Valence";

/// Every key the Electron app may have sealed values with, as this system keeps them.
#[cfg(target_os = "linux")]
#[must_use]
pub fn sealing_keys(_user_data: &Path) -> SealingKeys {
    linux_sealing_keys(&linux::passwords(APP_NAME))
}

/// The keys a Linux Chromium may have sealed values with, given the passwords its keyring holds:
/// `v10` only ever with the fixed key, and `v11` with the keyring's, then with the empty password
/// an old Chromium used by mistake, then with the fixed key.
#[cfg(target_os = "linux")]
#[must_use]
fn linux_sealing_keys(passwords: &[Vec<u8>]) -> SealingKeys {
    let fallback = super::sealed_values::linux_fallback_key();
    let mut v11: Vec<SealingKey> = passwords
        .iter()
        .map(|password| super::sealed_values::linux_key(password))
        .collect();

    v11.push(super::sealed_values::linux_key(b""));
    v11.push(fallback);

    SealingKeys {
        v10: vec![fallback],
        v11,
        v20: Vec::new(),
    }
}

/// Every key the Electron app may have sealed values with, as this system keeps them.
#[cfg(target_os = "macos")]
#[must_use]
pub fn sealing_keys(_user_data: &Path) -> SealingKeys {
    let service = format!("{APP_NAME} Safe Storage");
    let password = keyring::Entry::new(&service, APP_NAME)
        .and_then(|entry| entry.get_password())
        .ok();

    SealingKeys {
        v10: password
            .iter()
            .map(|password| super::sealed_values::mac_key(password.as_bytes()))
            .collect(),
        ..SealingKeys::default()
    }
}

/// Every key the Electron app may have sealed values with, as this system keeps them.
#[cfg(windows)]
#[must_use]
pub fn sealing_keys(user_data: &Path) -> SealingKeys {
    let keys: Vec<_> = windows::local_state_key(user_data)
        .map(super::sealed_values::SealingKey::Gcm)
        .into_iter()
        .collect();

    SealingKeys {
        v10: keys.clone(),
        v20: keys,
        ..SealingKeys::default()
    }
}

/// Every key the Electron app may have sealed values with: none, on a system it did not run on.
#[cfg(not(any(target_os = "linux", target_os = "macos", windows)))]
#[must_use]
pub fn sealing_keys(_user_data: &Path) -> SealingKeys {
    SealingKeys::default()
}

/// The sealed key Windows' Chromium writes into `Local State`, taken out of the JSON and out of the
/// base64 it is written in, without the `DPAPI` it starts with.
#[cfg_attr(
    not(windows),
    allow(dead_code, reason = "only Windows keeps its key this way")
)]
#[must_use]
pub fn sealed_local_state_key(local_state: &str) -> Option<Vec<u8>> {
    use base64::Engine;

    let state: serde_json::Value = serde_json::from_str(local_state).ok()?;
    let written = state.get("os_crypt")?.get("encrypted_key")?.as_str()?;
    let sealed = base64::engine::general_purpose::STANDARD
        .decode(written)
        .ok()?;

    sealed.strip_prefix(b"DPAPI").map(<[u8]>::to_vec)
}

#[cfg(target_os = "linux")]
mod linux {
    use std::collections::HashMap;

    use secret_service::blocking::SecretService;
    use secret_service::EncryptionType;

    const SCHEMA_ATTRIBUTE: &str = "xdg:schema";

    const SCHEMAS: [&str; 2] = [
        "chrome_libsecret_os_crypt_password_v2",
        "chrome_libsecret_os_crypt_password",
    ];

    const KWALLETS: [(&str, &str); 2] = [
        ("org.kde.kwalletd6", "/modules/kwalletd6"),
        ("org.kde.kwalletd5", "/modules/kwalletd5"),
    ];

    const CHROMIUM: &str = "Chromium";

    /// Every password the keyring holds for `app_name`'s sealed values: the Secret Service's first,
    /// then `KWallet`'s, each under the app's own name first and Chromium's after it.
    pub fn passwords(app_name: &str) -> Vec<Vec<u8>> {
        let mut found = secret_service_passwords(app_name);

        found.extend(secret_service_passwords(&CHROMIUM.to_lowercase()));
        found.extend(kwallet_passwords(app_name));
        found
    }

    /// The passwords the Secret Service holds for `app_name`, under either schema Chromium has used.
    fn secret_service_passwords(app_name: &str) -> Vec<Vec<u8>> {
        let Ok(service) = SecretService::connect(EncryptionType::Plain) else {
            return Vec::new();
        };

        SCHEMAS
            .iter()
            .filter_map(|schema| {
                let attributes =
                    HashMap::from([(SCHEMA_ATTRIBUTE, *schema), ("application", app_name)]);
                let found = service.search_items(attributes).ok()?;
                let items = found.unlocked.into_iter().chain(found.locked);

                items
                    .filter_map(|item| {
                        item.ensure_unlocked().ok()?;
                        item.get_secret().ok()
                    })
                    .find(|secret| !secret.is_empty())
            })
            .collect()
    }

    /// The passwords `KWallet` holds for `app_name`'s sealed values, where KDE's wallet is running.
    fn kwallet_passwords(app_name: &str) -> Vec<Vec<u8>> {
        [app_name, CHROMIUM]
            .iter()
            .filter_map(|name| kwallet_password(app_name, name))
            .collect()
    }

    /// The password `KWallet` holds, asked as `app_name`, in the folder and under the key Chromium
    /// names after `name`.
    fn kwallet_password(app_name: &str, name: &str) -> Option<Vec<u8>> {
        let connection = zbus::blocking::Connection::session().ok()?;
        let folder = format!("{name} Keys");
        let key = format!("{name} Safe Storage");

        KWALLETS.iter().find_map(|&wallet_at| {
            let wallet: String = ask(&connection, wallet_at, "networkWallet", &())?;
            let handle: i32 = ask(
                &connection,
                wallet_at,
                "open",
                &(wallet.as_str(), 0_i64, app_name),
            )?;

            if handle < 0 {
                return None;
            }

            let password: Option<String> = ask(
                &connection,
                wallet_at,
                "readPassword",
                &(handle, folder.as_str(), key.as_str(), app_name),
            );
            let _: Option<i32> = ask(&connection, wallet_at, "close", &(handle, false, app_name));

            password
                .filter(|password| !password.is_empty())
                .map(String::into_bytes)
        })
    }

    /// Asks the `KWallet` service at `(service, path)` to do `method` with `body`, and reads its
    /// answer, or nothing where it cannot be asked or answers something else.
    fn ask<B, A>(
        connection: &zbus::blocking::Connection,
        (service, path): (&str, &str),
        method: &str,
        body: &B,
    ) -> Option<A>
    where
        B: serde::Serialize + zbus::zvariant::DynamicType,
        A: for<'answer> serde::Deserialize<'answer> + zbus::zvariant::Type,
    {
        connection
            .call_method(Some(service), path, Some("org.kde.KWallet"), method, body)
            .ok()?
            .body()
            .deserialize()
            .ok()
    }
}

#[cfg(windows)]
mod windows {
    use std::path::Path;

    use windows::Win32::Foundation::{LocalFree, HLOCAL};
    use windows::Win32::Security::Cryptography::{CryptUnprotectData, CRYPT_INTEGER_BLOB};

    const LOCAL_STATE: &str = "Local State";

    /// The key the Electron app's Chromium sealed values with, unsealed by Windows for this user.
    pub fn local_state_key(user_data: &Path) -> Option<[u8; 32]> {
        let local_state = std::fs::read_to_string(user_data.join(LOCAL_STATE)).ok()?;
        let sealed = super::sealed_local_state_key(&local_state)?;

        unseal(&sealed)?.try_into().ok()
    }

    /// What Windows sealed for this user, unsealed.
    #[allow(
        unsafe_code,
        reason = "Windows unseals what it sealed for a user only through its C API"
    )]
    fn unseal(sealed: &[u8]) -> Option<Vec<u8>> {
        let input = CRYPT_INTEGER_BLOB {
            cbData: u32::try_from(sealed.len()).ok()?,
            pbData: sealed.as_ptr().cast_mut(),
        };
        let mut output = CRYPT_INTEGER_BLOB::default();

        // SAFETY: `input` is only read for the call; Windows allocates `output`, freed once here.
        unsafe {
            CryptUnprotectData(&raw const input, None, None, None, None, 0, &raw mut output)
                .ok()?;
            let unsealed =
                std::slice::from_raw_parts(output.pbData, output.cbData as usize).to_vec();
            let _ = LocalFree(Some(HLOCAL(output.pbData.cast())));

            Some(unsealed)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn takes_the_sealed_key_out_of_local_state() {
        let local_state = r#"{"os_crypt":{"encrypted_key":"RFBBUEkBAgM="},"other":1}"#;

        assert_eq!(sealed_local_state_key(local_state), Some(vec![1, 2, 3]));
    }

    #[test]
    fn finds_no_key_where_local_state_has_none_sealed_by_the_system() {
        assert_eq!(sealed_local_state_key("{}"), None);
        assert_eq!(sealed_local_state_key("not json"), None);
        assert_eq!(
            sealed_local_state_key(r#"{"os_crypt":{"encrypted_key":"AQID"}}"#),
            None
        );
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn tries_the_keyrings_password_first_then_chromiums_fixed_keys_on_linux() {
        use super::super::sealed_values::{linux_fallback_key, linux_key};

        let keys = linux_sealing_keys(&[b"from the keyring".to_vec()]);

        assert_eq!(keys.v10, vec![linux_fallback_key()]);
        assert_eq!(
            keys.v11,
            vec![
                linux_key(b"from the keyring"),
                linux_key(b""),
                linux_fallback_key()
            ]
        );
        assert!(keys.v20.is_empty());
    }
}
