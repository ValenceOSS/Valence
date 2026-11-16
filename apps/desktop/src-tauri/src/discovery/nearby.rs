//! The list of Valence servers heard on the network, as `nearbyValences` in the shared client keeps
//! it: each asked before it is offered, and taken off at once when it says goodbye.

use super::look::Reach;
use serde::Serialize;
use std::collections::HashSet;
use std::future::Future;
use std::sync::{Arc, Mutex, MutexGuard, PoisonError};

/// A server heard on the network that answered.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct NearbyValence {
    pub(crate) address: String,
    pub(crate) name: String,
}

/// Told the whole list whenever it changes.
type OnChange = Arc<dyn Fn(Vec<NearbyValence>) + Send + Sync>;

/// What has been heard so far.
#[derive(Default)]
struct Heard {
    offered: Vec<NearbyValence>,
    still_announced: HashSet<String>,
}

/// The servers heard on the network.
pub struct NearbyValences {
    reach: Reach,
    on_change: OnChange,
    heard: Mutex<Heard>,
}

impl NearbyValences {
    /// Keeps the list, asking each server with `reach` and telling `on_change` the whole list.
    pub fn new(
        reach: Reach,
        on_change: impl Fn(Vec<NearbyValence>) + Send + Sync + 'static,
    ) -> Self {
        Self {
            reach,
            on_change: Arc::new(on_change),
            heard: Mutex::new(Heard::default()),
        }
    }

    /// Notes a server as announced at once, then asks it and offers it where it answered and has
    /// not said goodbye meanwhile; says whether it answered, offered or not.
    pub fn arrived(
        self: &Arc<Self>,
        name: &str,
        address: &str,
        is_offered: bool,
    ) -> impl Future<Output = bool> + Send + 'static {
        self.lock().still_announced.insert(name.to_owned());

        let this = Arc::clone(self);
        let name = name.to_owned();
        let address = address.to_owned();

        async move {
            let answered = (this.reach)(address.clone()).await;

            let told = {
                let mut heard = this.lock();

                if !answered || !heard.still_announced.contains(&name) {
                    return false;
                }

                if !is_offered {
                    return true;
                }

                let arriving = NearbyValence { address, name };

                match heard
                    .offered
                    .iter_mut()
                    .find(|one| one.name == arriving.name)
                {
                    Some(already) => *already = arriving,
                    None => heard.offered.push(arriving),
                }

                heard.offered.clone()
            };

            (this.on_change)(told);

            true
        }
    }

    /// Takes a server off the list, including one still being asked about.
    pub fn left(&self, name: &str) {
        let told = {
            let mut heard = self.lock();
            heard.still_announced.remove(name);

            let before = heard.offered.len();
            heard.offered.retain(|one| one.name != name);

            (heard.offered.len() != before).then(|| heard.offered.clone())
        };

        if let Some(told) = told {
            (self.on_change)(told);
        }
    }

    /// Takes what has been heard, whatever another thread was doing when it panicked.
    fn lock(&self) -> MutexGuard<'_, Heard> {
        self.heard.lock().unwrap_or_else(PoisonError::into_inner)
    }
}
