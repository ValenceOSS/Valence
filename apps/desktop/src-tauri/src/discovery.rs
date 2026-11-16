//! Finding the Valence servers on this computer and on the network, and offering them on the screen
//! that asks which Valence is somebody's rather than deciding with them.

pub mod listen;
pub mod look;
pub mod nearby;

use futures_util::FutureExt;
use listen::{browse_for_valences, these_machines_addresses, Listening};
use look::{
    is_a_valence, keep_looking_for_a_valence, look_for_a_valence, Reach, GIVE_EACH, GIVE_ONE_NAMED,
};
use nearby::{NearbyValence, NearbyValences};
use std::sync::{Arc, Mutex, MutexGuard, PoisonError};
use tauri::{AppHandle, Emitter, Manager, State};
use tokio_util::sync::CancellationToken;

/// The event the page hears a server found on this computer on.
pub const FOUND: &str = "valence:found";

/// The event the page hears the whole list of servers on the network on, whenever it changes.
pub const NEARBY_CHANGED: &str = "valence:nearby-changed";

/// What has been found so far, and the searches under way.
pub struct Discovery {
    client: reqwest::Client,
    found: Mutex<Vec<String>>,
    nearby: Mutex<Vec<NearbyValence>>,
    looking: Mutex<Option<CancellationToken>>,
}

/// Takes what a mutex guards, whatever another thread was doing when it panicked.
fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(PoisonError::into_inner)
}

impl Discovery {
    /// Asks addresses whether a Valence answers, giving each so long.
    fn reach(&self, allow: std::time::Duration) -> Reach {
        let client = self.client.clone();

        Arc::new(move |address| {
            let client = client.clone();
            async move { is_a_valence(&client, &address, allow).await }.boxed()
        })
    }
}

/// Servers found on this computer so far.
#[must_use]
pub fn already_found(app: &AppHandle) -> Vec<String> {
    app.try_state::<Discovery>()
        .map(|discovery| lock(&discovery.found).clone())
        .unwrap_or_default()
}

/// Servers heard on the network so far.
#[must_use]
pub fn already_nearby(app: &AppHandle) -> Vec<NearbyValence> {
    app.try_state::<Discovery>()
        .map(|discovery| lock(&discovery.nearby).clone())
        .unwrap_or_default()
}

/// Offers a server found on this computer, once.
fn offer_from_this_machine(app: &AppHandle, address: String) {
    let Some(discovery) = app.try_state::<Discovery>() else {
        return;
    };

    {
        let mut found = lock(&discovery.found);

        if found.contains(&address) {
            return;
        }

        found.push(address.clone());
    }

    let _ = app.emit(FOUND, address);
}

/// Offers the whole of what is heard on the network now.
fn offer_from_the_network(app: &AppHandle, nearby: Vec<NearbyValence>) {
    if let Some(discovery) = app.try_state::<Discovery>() {
        lock(&discovery.nearby).clone_from(&nearby);
    }

    let _ = app.emit(NEARBY_CHANGED, nearby);
}

/// Looks for a Valence on this computer where no server has been chosen yet, once and then for a
/// minute more while it may still be starting, offering what turns up.
pub async fn find_a_valence(app: AppHandle) {
    if crate::preferences::server_address(&app).is_some() {
        return;
    }

    let Some(reach) = app
        .try_state::<Discovery>()
        .map(|discovery| discovery.reach(GIVE_EACH))
    else {
        return;
    };

    if let Some(here) = look_for_a_valence(&reach).await {
        offer_from_this_machine(&app, here);
        return;
    }

    let finding = app.clone();
    let looking = keep_looking_for_a_valence(
        move |address| offer_from_this_machine(&finding, address),
        reach,
    );

    let replaced = app
        .try_state::<Discovery>()
        .and_then(|discovery| lock(&discovery.looking).replace(looking));

    if let Some(earlier) = replaced {
        earlier.cancel();
    }
}

/// Looks again for a Valence on this computer, for somebody changing server.
pub fn look_again(app: &AppHandle) {
    crate::runtime::spawn(find_a_valence(app.clone()));
}

/// Whether an address somebody named answers as a Valence server.
///
/// # Errors
///
/// Never; a command run in the background has to be able to say it failed.
#[tauri::command]
pub async fn servers_reach(
    address: serde_json::Value,
    discovery: State<'_, Discovery>,
) -> Result<bool, String> {
    Ok(match address {
        serde_json::Value::String(address) => {
            is_a_valence(&discovery.client, &address, GIVE_ONE_NAMED).await
        }
        _ => false,
    })
}

/// Starts hearing servers on the network and looking for one on this computer.
///
/// # Errors
///
/// When the HTTP client that asks addresses cannot be made; finding nothing is no error, and leaves
/// the screen that asks for an address as it was.
pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let discovery = Discovery {
        client: crate::tls::a_client(
            reqwest::Client::builder(),
            crate::upstream::LONGEST_TO_CONNECT,
        )?,
        found: Mutex::new(Vec::new()),
        nearby: Mutex::new(Vec::new()),
        looking: Mutex::new(None),
    };

    let telling = app.handle().clone();
    let finding = app.handle().clone();

    let listening = Listening {
        nearby: Arc::new(NearbyValences::new(
            discovery.reach(GIVE_EACH),
            move |nearby| offer_from_the_network(&telling, nearby),
        )),
        on_this_machine: Arc::new(move |address| offer_from_this_machine(&finding, address)),
        own_addresses: Arc::new(these_machines_addresses),
    };

    app.manage(discovery);

    browse_for_valences(listening);

    look_again(app.handle());

    Ok(())
}
