//! Windows Hello, and whatever passkey managers have joined it, through `webauthn.dll`.
#![allow(
    unsafe_code,
    reason = "webauthn.dll is only reachable through its C interface, and every call into it is unsafe"
)]

use crate::passkeys::asking::{Answered, PasskeyAsk};
use crate::passkeys::making::{Made, PasskeyMaking};
use windows::core::{BOOL, HRESULT, PCWSTR};
use windows::Win32::Foundation::HWND;
use windows::Win32::Networking::WindowsWebServices::{
    WebAuthNAuthenticatorGetAssertion, WebAuthNAuthenticatorMakeCredential, WebAuthNFreeAssertion,
    WebAuthNFreeCredentialAttestation, WebAuthNGetApiVersionNumber, WebAuthNGetErrorName,
    WEBAUTHN_API_VERSION_2, WEBAUTHN_ASSERTION, WEBAUTHN_ATTESTATION_CONVEYANCE_PREFERENCE_ANY,
    WEBAUTHN_ATTESTATION_CONVEYANCE_PREFERENCE_DIRECT,
    WEBAUTHN_ATTESTATION_CONVEYANCE_PREFERENCE_INDIRECT,
    WEBAUTHN_ATTESTATION_CONVEYANCE_PREFERENCE_NONE, WEBAUTHN_AUTHENTICATOR_ATTACHMENT_ANY,
    WEBAUTHN_AUTHENTICATOR_ATTACHMENT_CROSS_PLATFORM, WEBAUTHN_AUTHENTICATOR_ATTACHMENT_PLATFORM,
    WEBAUTHN_AUTHENTICATOR_GET_ASSERTION_OPTIONS,
    WEBAUTHN_AUTHENTICATOR_GET_ASSERTION_OPTIONS_VERSION_4,
    WEBAUTHN_AUTHENTICATOR_MAKE_CREDENTIAL_OPTIONS,
    WEBAUTHN_AUTHENTICATOR_MAKE_CREDENTIAL_OPTIONS_VERSION_3,
    WEBAUTHN_AUTHENTICATOR_MAKE_CREDENTIAL_OPTIONS_VERSION_4, WEBAUTHN_CLIENT_DATA,
    WEBAUTHN_CLIENT_DATA_CURRENT_VERSION, WEBAUTHN_COSE_CREDENTIAL_PARAMETER,
    WEBAUTHN_COSE_CREDENTIAL_PARAMETERS, WEBAUTHN_COSE_CREDENTIAL_PARAMETER_CURRENT_VERSION,
    WEBAUTHN_CREDENTIAL_ATTESTATION, WEBAUTHN_CREDENTIAL_EX,
    WEBAUTHN_CREDENTIAL_EX_CURRENT_VERSION, WEBAUTHN_CREDENTIAL_LIST,
    WEBAUTHN_CREDENTIAL_TYPE_PUBLIC_KEY, WEBAUTHN_CTAP_TRANSPORT_BLE,
    WEBAUTHN_CTAP_TRANSPORT_HYBRID, WEBAUTHN_CTAP_TRANSPORT_INTERNAL, WEBAUTHN_CTAP_TRANSPORT_NFC,
    WEBAUTHN_CTAP_TRANSPORT_USB, WEBAUTHN_HASH_ALGORITHM_SHA_256, WEBAUTHN_RP_ENTITY_INFORMATION,
    WEBAUTHN_RP_ENTITY_INFORMATION_CURRENT_VERSION, WEBAUTHN_USER_ENTITY_INFORMATION,
    WEBAUTHN_USER_ENTITY_INFORMATION_CURRENT_VERSION, WEBAUTHN_USER_VERIFICATION_REQUIREMENT_ANY,
    WEBAUTHN_USER_VERIFICATION_REQUIREMENT_DISCOURAGED,
    WEBAUTHN_USER_VERIFICATION_REQUIREMENT_PREFERRED,
    WEBAUTHN_USER_VERIFICATION_REQUIREMENT_REQUIRED,
};

/// Whether this build can ask Windows for a passkey, which Windows' can.
pub const CAN_ASK: bool = true;

/// The name a refusal takes when there was too much to hand to Windows, which no browser names
/// and so reads as a plain failure.
const TOO_MUCH: &str = "RangeError";

/// A string as Windows reads one: wide, and ending in a nought.
fn wide(text: &str) -> Vec<u16> {
    text.encode_utf16().chain(std::iter::once(0)).collect()
}

/// The length of something handed to Windows, which counts in 32 bits.
fn length_of<T>(items: &[T]) -> Result<u32, String> {
    u32::try_from(items.len()).map_err(|_| TOO_MUCH.to_owned())
}

/// Windows' name for how much a person has to prove it is them.
fn verification(said: &str) -> u32 {
    match said {
        "required" => WEBAUTHN_USER_VERIFICATION_REQUIREMENT_REQUIRED,
        "preferred" => WEBAUTHN_USER_VERIFICATION_REQUIREMENT_PREFERRED,
        "discouraged" => WEBAUTHN_USER_VERIFICATION_REQUIREMENT_DISCOURAGED,
        _ => WEBAUTHN_USER_VERIFICATION_REQUIREMENT_ANY,
    }
}

/// Windows' name for which kind of authenticator may answer.
fn attachment(said: &str) -> u32 {
    match said {
        "platform" => WEBAUTHN_AUTHENTICATOR_ATTACHMENT_PLATFORM,
        "cross-platform" => WEBAUTHN_AUTHENTICATOR_ATTACHMENT_CROSS_PLATFORM,
        _ => WEBAUTHN_AUTHENTICATOR_ATTACHMENT_ANY,
    }
}

/// Windows' name for how much the server wants to know about the authenticator.
fn conveyance(said: &str) -> u32 {
    match said {
        "none" => WEBAUTHN_ATTESTATION_CONVEYANCE_PREFERENCE_NONE,
        "indirect" => WEBAUTHN_ATTESTATION_CONVEYANCE_PREFERENCE_INDIRECT,
        "direct" | "enterprise" => WEBAUTHN_ATTESTATION_CONVEYANCE_PREFERENCE_DIRECT,
        _ => WEBAUTHN_ATTESTATION_CONVEYANCE_PREFERENCE_ANY,
    }
}

/// The transports a passkey was made over, in the words a server expects.
fn transports_in(used: u32) -> Vec<String> {
    [
        (WEBAUTHN_CTAP_TRANSPORT_USB, "usb"),
        (WEBAUTHN_CTAP_TRANSPORT_NFC, "nfc"),
        (WEBAUTHN_CTAP_TRANSPORT_BLE, "ble"),
        (WEBAUTHN_CTAP_TRANSPORT_INTERNAL, "internal"),
        (WEBAUTHN_CTAP_TRANSPORT_HYBRID, "hybrid"),
    ]
    .into_iter()
    .filter(|(flag, _)| used & flag != 0)
    .map(|(_, name)| name.to_owned())
    .collect()
}

/// Names a refusal from Windows the way a browser would, so that `NotAllowedError` still means
/// somebody cancelled.
fn refused(error: &windows::core::Error) -> String {
    let code: HRESULT = error.code();

    // SAFETY: WebAuthNGetErrorName returns a static string that webauthn.dll owns for good.
    unsafe { WebAuthNGetErrorName(code).to_string() }
        .unwrap_or_else(|_| String::from("UnknownError"))
}

/// Copies something Windows owns into bytes of our own.
///
/// # Safety
///
/// `pointer` must point at `length` readable bytes, or `length` must be nought.
unsafe fn copied(pointer: *const u8, length: u32) -> Vec<u8> {
    if pointer.is_null() || length == 0 {
        return Vec::new();
    }

    // SAFETY: the caller promises `pointer` has `length` readable bytes.
    unsafe { std::slice::from_raw_parts(pointer, length as usize) }.to_vec()
}

/// The window a prompt belongs to, from its address.
fn the_window(window: usize) -> HWND {
    HWND(window as *mut core::ffi::c_void)
}

/// Credentials as Windows lists them, with everything they point at kept alive beside them.
struct CredentialList {
    ids: Vec<Vec<u8>>,
    entries: Vec<WEBAUTHN_CREDENTIAL_EX>,
    pointers: Vec<*mut WEBAUTHN_CREDENTIAL_EX>,
}

impl CredentialList {
    /// Lists the credentials by their ids.
    fn of(ids: Vec<Vec<u8>>) -> Result<Self, String> {
        let mut list = Self {
            ids,
            entries: Vec::new(),
            pointers: Vec::new(),
        };

        for id in &mut list.ids {
            list.entries.push(WEBAUTHN_CREDENTIAL_EX {
                dwVersion: WEBAUTHN_CREDENTIAL_EX_CURRENT_VERSION,
                cbId: length_of(id)?,
                pbId: id.as_mut_ptr(),
                pwszCredentialType: WEBAUTHN_CREDENTIAL_TYPE_PUBLIC_KEY,
                dwTransports: 0,
            });
        }

        list.pointers = list.entries.iter_mut().map(std::ptr::from_mut).collect();

        Ok(list)
    }

    /// The list, in the shape Windows reads, or nothing where it is empty.
    fn for_windows(&mut self) -> Result<Option<WEBAUTHN_CREDENTIAL_LIST>, String> {
        if self.pointers.is_empty() {
            return Ok(None);
        }

        Ok(Some(WEBAUTHN_CREDENTIAL_LIST {
            cCredentials: length_of(&self.pointers)?,
            ppCredentials: self.pointers.as_mut_ptr(),
        }))
    }
}

/// Asks Windows for a passkey, over the given window, and waits for what it signs.
///
/// Blocks until somebody answers the prompt, so it belongs off the main thread.
///
/// # Errors
///
/// The name a browser would give the refusal — `NotAllowedError` where somebody cancelled or
/// nothing answered in time.
pub fn ask_for_a_passkey(window: usize, ask: &PasskeyAsk) -> Result<Answered, String> {
    let rp_id = wide(&ask.rp_id);
    let mut client_data_json = ask.client_data_json.clone().into_bytes();
    let client_data = WEBAUTHN_CLIENT_DATA {
        dwVersion: WEBAUTHN_CLIENT_DATA_CURRENT_VERSION,
        cbClientDataJSON: length_of(&client_data_json)?,
        pbClientDataJSON: client_data_json.as_mut_ptr(),
        pwszHashAlgId: WEBAUTHN_HASH_ALGORITHM_SHA_256,
    };
    let mut allow = CredentialList::of(ask.allow.clone())?;
    let mut allowed = allow.for_windows()?;
    let options = WEBAUTHN_AUTHENTICATOR_GET_ASSERTION_OPTIONS {
        dwVersion: WEBAUTHN_AUTHENTICATOR_GET_ASSERTION_OPTIONS_VERSION_4,
        dwTimeoutMilliseconds: ask.timeout_ms,
        dwUserVerificationRequirement: verification(&ask.user_verification),
        pAllowCredentialList: allowed
            .as_mut()
            .map_or(std::ptr::null_mut(), std::ptr::from_mut),
        ..Default::default()
    };

    // SAFETY: every pointer is into a value alive for the call, and the window is the app's own.
    let answer = unsafe {
        WebAuthNAuthenticatorGetAssertion(
            the_window(window),
            PCWSTR(rp_id.as_ptr()),
            &raw const client_data,
            Some(&raw const options),
        )
    }
    .map_err(|error| refused(&error))?;

    // SAFETY: Windows returned a valid assertion, which is read here and freed straight after.
    let answered = unsafe {
        let assertion: &WEBAUTHN_ASSERTION = &*answer;

        Answered {
            credential_id: copied(assertion.Credential.pbId, assertion.Credential.cbId),
            authenticator_data: copied(
                assertion.pbAuthenticatorData,
                assertion.cbAuthenticatorData,
            ),
            signature: copied(assertion.pbSignature, assertion.cbSignature),
            user_handle: copied(assertion.pbUserId, assertion.cbUserId),
        }
    };

    // SAFETY: the assertion came from WebAuthNAuthenticatorGetAssertion and is freed once.
    unsafe { WebAuthNFreeAssertion(answer) };

    drop(allow);

    Ok(answered)
}

/// Asks Windows to make a passkey, over the given window, and waits for what it makes.
///
/// Blocks until somebody answers the prompt, so it belongs off the main thread.
///
/// # Errors
///
/// The name a browser would give the refusal — `NotAllowedError` where somebody cancelled, and
/// `InvalidStateError` where this device already holds one for the account.
pub fn make_a_passkey(window: usize, making: &PasskeyMaking) -> Result<Made, String> {
    let rp_id = wide(&making.rp_id);
    let rp_name = wide(&making.rp_name);
    let user_name = wide(&making.user_name);
    let user_display_name = wide(&making.user_display_name);
    let mut user_id = making.user_id.clone();
    let mut client_data_json = making.client_data_json.clone().into_bytes();

    let rp = WEBAUTHN_RP_ENTITY_INFORMATION {
        dwVersion: WEBAUTHN_RP_ENTITY_INFORMATION_CURRENT_VERSION,
        pwszId: PCWSTR(rp_id.as_ptr()),
        pwszName: PCWSTR(rp_name.as_ptr()),
        pwszIcon: PCWSTR::null(),
    };
    let user = WEBAUTHN_USER_ENTITY_INFORMATION {
        dwVersion: WEBAUTHN_USER_ENTITY_INFORMATION_CURRENT_VERSION,
        cbId: length_of(&user_id)?,
        pbId: user_id.as_mut_ptr(),
        pwszName: PCWSTR(user_name.as_ptr()),
        pwszIcon: PCWSTR::null(),
        pwszDisplayName: PCWSTR(user_display_name.as_ptr()),
    };
    let mut parameters: Vec<WEBAUTHN_COSE_CREDENTIAL_PARAMETER> = making
        .algorithms
        .iter()
        .map(|&algorithm| WEBAUTHN_COSE_CREDENTIAL_PARAMETER {
            dwVersion: WEBAUTHN_COSE_CREDENTIAL_PARAMETER_CURRENT_VERSION,
            pwszCredentialType: WEBAUTHN_CREDENTIAL_TYPE_PUBLIC_KEY,
            lAlg: algorithm,
        })
        .collect();
    let algorithms = WEBAUTHN_COSE_CREDENTIAL_PARAMETERS {
        cCredentialParameters: length_of(&parameters)?,
        pCredentialParameters: parameters.as_mut_ptr(),
    };
    let client_data = WEBAUTHN_CLIENT_DATA {
        dwVersion: WEBAUTHN_CLIENT_DATA_CURRENT_VERSION,
        cbClientDataJSON: length_of(&client_data_json)?,
        pbClientDataJSON: client_data_json.as_mut_ptr(),
        pwszHashAlgId: WEBAUTHN_HASH_ALGORITHM_SHA_256,
    };
    let mut exclude = CredentialList::of(making.exclude.clone())?;
    let mut excluded = exclude.for_windows()?;
    // SAFETY: WebAuthNGetApiVersionNumber takes nothing and only reports a number.
    let can_prefer = unsafe { WebAuthNGetApiVersionNumber() } >= WEBAUTHN_API_VERSION_2;
    let options = WEBAUTHN_AUTHENTICATOR_MAKE_CREDENTIAL_OPTIONS {
        dwVersion: if can_prefer {
            WEBAUTHN_AUTHENTICATOR_MAKE_CREDENTIAL_OPTIONS_VERSION_4
        } else {
            WEBAUTHN_AUTHENTICATOR_MAKE_CREDENTIAL_OPTIONS_VERSION_3
        },
        dwTimeoutMilliseconds: making.timeout_ms,
        dwAuthenticatorAttachment: attachment(&making.attachment),
        bRequireResidentKey: BOOL::from(
            making.resident_key == "required"
                || (!can_prefer && making.resident_key == "preferred"),
        ),
        bPreferResidentKey: BOOL::from(making.resident_key == "preferred"),
        dwUserVerificationRequirement: verification(&making.user_verification),
        dwAttestationConveyancePreference: conveyance(&making.attestation),
        pExcludeCredentialList: excluded
            .as_mut()
            .map_or(std::ptr::null_mut(), std::ptr::from_mut),
        ..Default::default()
    };

    // SAFETY: every pointer is into a value alive for the call, and the window is the app's own.
    let made = unsafe {
        WebAuthNAuthenticatorMakeCredential(
            the_window(window),
            &raw const rp,
            &raw const user,
            &raw const algorithms,
            &raw const client_data,
            Some(&raw const options),
        )
    }
    .map_err(|error| refused(&error))?;

    // SAFETY: Windows returned a valid attestation, which is read here and freed straight after.
    let answered = unsafe {
        let attestation: &WEBAUTHN_CREDENTIAL_ATTESTATION = &*made;

        Made {
            credential_id: copied(attestation.pbCredentialId, attestation.cbCredentialId),
            attestation_object: copied(
                attestation.pbAttestationObject,
                attestation.cbAttestationObject,
            ),
            transports: transports_in(attestation.dwUsedTransport),
        }
    };

    // SAFETY: the attestation came from WebAuthNAuthenticatorMakeCredential and is freed once.
    unsafe { WebAuthNFreeCredentialAttestation(Some(made.cast_const())) };

    drop(exclude);
    drop(parameters);

    Ok(answered)
}

#[cfg(test)]
mod tests {
    use super::{attachment, conveyance, transports_in, verification, wide};
    use windows::Win32::Networking::WindowsWebServices::{
        WEBAUTHN_ATTESTATION_CONVEYANCE_PREFERENCE_DIRECT, WEBAUTHN_AUTHENTICATOR_ATTACHMENT_ANY,
        WEBAUTHN_CTAP_TRANSPORT_HYBRID, WEBAUTHN_CTAP_TRANSPORT_USB,
        WEBAUTHN_USER_VERIFICATION_REQUIREMENT_REQUIRED,
    };

    #[test]
    fn writes_a_string_the_way_windows_reads_one() {
        assert_eq!(wide("ab"), vec![97, 98, 0]);
    }

    #[test]
    fn names_what_the_server_asked_for_in_windows_own_words() {
        assert_eq!(
            verification("required"),
            WEBAUTHN_USER_VERIFICATION_REQUIREMENT_REQUIRED
        );
        assert_eq!(attachment(""), WEBAUTHN_AUTHENTICATOR_ATTACHMENT_ANY);
        assert_eq!(
            conveyance("enterprise"),
            WEBAUTHN_ATTESTATION_CONVEYANCE_PREFERENCE_DIRECT
        );
    }

    #[test]
    fn says_how_a_passkey_was_reached() {
        assert_eq!(
            transports_in(WEBAUTHN_CTAP_TRANSPORT_USB | WEBAUTHN_CTAP_TRANSPORT_HYBRID),
            vec!["usb".to_owned(), "hybrid".to_owned()]
        );
    }
}
