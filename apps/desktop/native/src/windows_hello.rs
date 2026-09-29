#![allow(
    unsafe_code,
    reason = "webauthn.dll is only reachable through its C interface, and every call into it is unsafe"
)]
#![cfg_attr(
    test,
    allow(
        dead_code,
        reason = "napi registers these for Electron, which a test does not load"
    )
)]

use crate::window_handle::window_handle;
use napi::bindgen_prelude::{AsyncTask, Buffer};
use napi::{Env, Error, Result, Status, Task};
use napi_derive::napi;
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

/// What a sign-in asks Windows for.
#[napi(object)]
pub struct PasskeyAsk {
    pub rp_id: String,
    pub client_data_json: String,
    pub allow: Vec<Buffer>,
    pub user_verification: String,
    pub timeout_ms: u32,
}

/// What Windows answered a sign-in with.
#[napi(object)]
pub struct PasskeyAnswer {
    pub credential_id: Buffer,
    pub authenticator_data: Buffer,
    pub signature: Buffer,
    pub user_handle: Option<Buffer>,
}

/// What adding a passkey asks Windows to make.
#[napi(object)]
pub struct PasskeyMaking {
    pub rp_id: String,
    pub rp_name: String,
    pub user_id: Buffer,
    pub user_name: String,
    pub user_display_name: String,
    pub client_data_json: String,
    pub algorithms: Vec<i32>,
    pub exclude: Vec<Buffer>,
    pub attachment: String,
    pub resident_key: String,
    pub user_verification: String,
    pub attestation: String,
    pub timeout_ms: u32,
}

/// What Windows made.
#[napi(object)]
pub struct PasskeyMade {
    pub credential_id: Buffer,
    pub attestation_object: Buffer,
    pub transports: Vec<String>,
}

/// A string as Windows reads one: wide, and ending in a nought.
fn wide(text: &str) -> Vec<u16> {
    text.encode_utf16().chain(std::iter::once(0)).collect()
}

/// The length of something handed to Windows, which counts in 32 bits.
fn length_of(bytes: &[u8]) -> Result<u32> {
    u32::try_from(bytes.len())
        .map_err(|_| Error::new(Status::InvalidArg, "Too much to hand to Windows."))
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

/// Turns a refusal from Windows into an error named the way a browser would name it, so that
/// `NotAllowedError` still means somebody cancelled.
fn refused(error: &windows::core::Error) -> Error {
    let code: HRESULT = error.code();
    // SAFETY: WebAuthNGetErrorName returns a static string that webauthn.dll owns for good.
    let name = unsafe { WebAuthNGetErrorName(code).to_string() }
        .unwrap_or_else(|_| String::from("UnknownError"));

    Error::new(Status::GenericFailure, name)
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

/// Credentials as Windows lists them, with everything they point at kept alive beside them.
struct CredentialList {
    ids: Vec<Vec<u8>>,
    entries: Vec<WEBAUTHN_CREDENTIAL_EX>,
    pointers: Vec<*mut WEBAUTHN_CREDENTIAL_EX>,
}

impl CredentialList {
    /// Lists the credentials by their ids.
    fn of(ids: Vec<Vec<u8>>) -> Result<Self> {
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
    fn for_windows(&mut self) -> Result<Option<WEBAUTHN_CREDENTIAL_LIST>> {
        if self.pointers.is_empty() {
            return Ok(None);
        }

        Ok(Some(WEBAUTHN_CREDENTIAL_LIST {
            cCredentials: u32::try_from(self.pointers.len())
                .map_err(|_| Error::new(Status::InvalidArg, "Too many passkeys to list."))?,
            ppCredentials: self.pointers.as_mut_ptr(),
        }))
    }
}

/// The part of a sign-in that waits on Windows, off the main thread.
pub struct Asking {
    window: usize,
    rp_id: String,
    client_data_json: String,
    allow: Vec<Vec<u8>>,
    user_verification: String,
    timeout_ms: u32,
}

/// The same, answered in bytes of our own, since what Windows returns is freed before we go on.
pub struct Answered {
    credential_id: Vec<u8>,
    authenticator_data: Vec<u8>,
    signature: Vec<u8>,
    user_handle: Vec<u8>,
}

impl Task for Asking {
    type Output = Answered;
    type JsValue = PasskeyAnswer;

    fn compute(&mut self) -> Result<Self::Output> {
        let rp_id = wide(&self.rp_id);
        let mut client_data_json = self.client_data_json.clone().into_bytes();
        let client_data = WEBAUTHN_CLIENT_DATA {
            dwVersion: WEBAUTHN_CLIENT_DATA_CURRENT_VERSION,
            cbClientDataJSON: length_of(&client_data_json)?,
            pbClientDataJSON: client_data_json.as_mut_ptr(),
            pwszHashAlgId: WEBAUTHN_HASH_ALGORITHM_SHA_256,
        };
        let mut allow = CredentialList::of(self.allow.clone())?;
        let mut allowed = allow.for_windows()?;
        let options = WEBAUTHN_AUTHENTICATOR_GET_ASSERTION_OPTIONS {
            dwVersion: WEBAUTHN_AUTHENTICATOR_GET_ASSERTION_OPTIONS_VERSION_4,
            dwTimeoutMilliseconds: self.timeout_ms,
            dwUserVerificationRequirement: verification(&self.user_verification),
            pAllowCredentialList: allowed
                .as_mut()
                .map_or(std::ptr::null_mut(), std::ptr::from_mut),
            ..Default::default()
        };

        // SAFETY: every pointer is into a value alive for the call, and the window is Electron's.
        let answer = unsafe {
            WebAuthNAuthenticatorGetAssertion(
                HWND(self.window as *mut core::ffi::c_void),
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

    fn resolve(&mut self, _env: Env, output: Self::Output) -> Result<Self::JsValue> {
        Ok(PasskeyAnswer {
            credential_id: output.credential_id.into(),
            authenticator_data: output.authenticator_data.into(),
            signature: output.signature.into(),
            user_handle: (!output.user_handle.is_empty()).then(|| output.user_handle.into()),
        })
    }
}

/// The part of adding a passkey that waits on Windows, off the main thread.
pub struct Making {
    window: usize,
    rp_id: String,
    rp_name: String,
    user_id: Vec<u8>,
    user_name: String,
    user_display_name: String,
    client_data_json: String,
    algorithms: Vec<i32>,
    exclude: Vec<Vec<u8>>,
    attachment: String,
    resident_key: String,
    user_verification: String,
    attestation: String,
    timeout_ms: u32,
}

/// The same, made, in bytes of our own.
pub struct Made {
    credential_id: Vec<u8>,
    attestation_object: Vec<u8>,
    transports: Vec<String>,
}

impl Task for Making {
    type Output = Made;
    type JsValue = PasskeyMade;

    fn compute(&mut self) -> Result<Self::Output> {
        let rp_id = wide(&self.rp_id);
        let rp_name = wide(&self.rp_name);
        let user_name = wide(&self.user_name);
        let user_display_name = wide(&self.user_display_name);
        let mut user_id = self.user_id.clone();
        let mut client_data_json = self.client_data_json.clone().into_bytes();

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
        let mut parameters: Vec<WEBAUTHN_COSE_CREDENTIAL_PARAMETER> = self
            .algorithms
            .iter()
            .map(|&algorithm| WEBAUTHN_COSE_CREDENTIAL_PARAMETER {
                dwVersion: WEBAUTHN_COSE_CREDENTIAL_PARAMETER_CURRENT_VERSION,
                pwszCredentialType: WEBAUTHN_CREDENTIAL_TYPE_PUBLIC_KEY,
                lAlg: algorithm,
            })
            .collect();
        let algorithms = WEBAUTHN_COSE_CREDENTIAL_PARAMETERS {
            cCredentialParameters: u32::try_from(parameters.len())
                .map_err(|_| Error::new(Status::InvalidArg, "Too many algorithms."))?,
            pCredentialParameters: parameters.as_mut_ptr(),
        };
        let client_data = WEBAUTHN_CLIENT_DATA {
            dwVersion: WEBAUTHN_CLIENT_DATA_CURRENT_VERSION,
            cbClientDataJSON: length_of(&client_data_json)?,
            pbClientDataJSON: client_data_json.as_mut_ptr(),
            pwszHashAlgId: WEBAUTHN_HASH_ALGORITHM_SHA_256,
        };
        let mut exclude = CredentialList::of(self.exclude.clone())?;
        let mut excluded = exclude.for_windows()?;
        // SAFETY: WebAuthNGetApiVersionNumber takes nothing and only reports a number.
        let can_prefer = unsafe { WebAuthNGetApiVersionNumber() } >= WEBAUTHN_API_VERSION_2;
        let options = WEBAUTHN_AUTHENTICATOR_MAKE_CREDENTIAL_OPTIONS {
            dwVersion: if can_prefer {
                WEBAUTHN_AUTHENTICATOR_MAKE_CREDENTIAL_OPTIONS_VERSION_4
            } else {
                WEBAUTHN_AUTHENTICATOR_MAKE_CREDENTIAL_OPTIONS_VERSION_3
            },
            dwTimeoutMilliseconds: self.timeout_ms,
            dwAuthenticatorAttachment: attachment(&self.attachment),
            bRequireResidentKey: BOOL::from(
                self.resident_key == "required"
                    || (!can_prefer && self.resident_key == "preferred"),
            ),
            bPreferResidentKey: BOOL::from(self.resident_key == "preferred"),
            dwUserVerificationRequirement: verification(&self.user_verification),
            dwAttestationConveyancePreference: conveyance(&self.attestation),
            pExcludeCredentialList: excluded
                .as_mut()
                .map_or(std::ptr::null_mut(), std::ptr::from_mut),
            ..Default::default()
        };

        // SAFETY: every pointer is into a value alive for the call, and the window is Electron's.
        let made = unsafe {
            WebAuthNAuthenticatorMakeCredential(
                HWND(self.window as *mut core::ffi::c_void),
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

    fn resolve(&mut self, _env: Env, output: Self::Output) -> Result<Self::JsValue> {
        Ok(PasskeyMade {
            credential_id: output.credential_id.into(),
            attestation_object: output.attestation_object.into(),
            transports: output.transports,
        })
    }
}

/// The window a prompt belongs to, from what Electron said about it.
fn the_window(handle: &Buffer) -> Result<usize> {
    window_handle(handle).ok_or_else(|| Error::new(Status::InvalidArg, "That is not a window."))
}

/// Asks Windows for a passkey, over the given window, and hands back what it signed.
///
/// # Errors
///
/// Fails with the name a browser would give the refusal — `NotAllowedError` where somebody
/// cancelled or nothing answered in time.
#[napi]
#[allow(
    clippy::needless_pass_by_value,
    reason = "napi hands arguments over by value"
)]
pub fn ask_for_a_passkey(window: Buffer, ask: PasskeyAsk) -> Result<AsyncTask<Asking>> {
    Ok(AsyncTask::new(Asking {
        window: the_window(&window)?,
        rp_id: ask.rp_id,
        client_data_json: ask.client_data_json,
        allow: ask.allow.iter().map(|id| id.to_vec()).collect(),
        user_verification: ask.user_verification,
        timeout_ms: ask.timeout_ms,
    }))
}

/// Asks Windows to make a passkey, over the given window, and hands back what it made.
///
/// # Errors
///
/// Fails with the name a browser would give the refusal — `NotAllowedError` where somebody
/// cancelled, and `InvalidStateError` where this device already holds one for the account.
#[napi]
#[allow(
    clippy::needless_pass_by_value,
    reason = "napi hands arguments over by value"
)]
pub fn make_a_passkey(window: Buffer, making: PasskeyMaking) -> Result<AsyncTask<Making>> {
    Ok(AsyncTask::new(Making {
        window: the_window(&window)?,
        rp_id: making.rp_id,
        rp_name: making.rp_name,
        user_id: making.user_id.to_vec(),
        user_name: making.user_name,
        user_display_name: making.user_display_name,
        client_data_json: making.client_data_json,
        algorithms: making.algorithms,
        exclude: making.exclude.iter().map(|id| id.to_vec()).collect(),
        attachment: making.attachment,
        resident_key: making.resident_key,
        user_verification: making.user_verification,
        attestation: making.attestation,
        timeout_ms: making.timeout_ms,
    }))
}
