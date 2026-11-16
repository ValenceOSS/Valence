//! Looking for a Valence on this computer, where one usually is, as `lookForAValence` did. Only
//! this computer is looked at: never anybody else on the network.

use futures_util::future::BoxFuture;
use std::sync::Arc;
use std::time::Duration;
use tokio_util::sync::CancellationToken;

/// Where a Valence on this computer usually answers, in the order they are tried.
pub const WHERE_ONE_USUALLY_IS: [&str; 2] = ["http://localhost:8420", "http://127.0.0.1:8420"];

/// How long each of those is given to answer.
pub const GIVE_EACH: Duration = Duration::from_millis(1500);

/// How long an address somebody named is given to answer.
pub const GIVE_ONE_NAMED: Duration = Duration::from_secs(10);

/// How often to look again for a server that has not finished starting.
pub const LOOK_AGAIN_EVERY: Duration = Duration::from_secs(2);

/// How long to keep looking before giving up.
pub const STOP_LOOKING_AFTER: Duration = Duration::from_secs(60);

/// Asks an address whether a Valence answers there.
pub type Reach = Arc<dyn Fn(String) -> BoxFuture<'static, bool> + Send + Sync>;

/// Asks an address's health whether there is a Valence behind it, giving it so long to answer.
pub async fn is_a_valence(client: &reqwest::Client, address: &str, allow: Duration) -> bool {
    client
        .get(format!("{address}/api/health"))
        .header(reqwest::header::ACCEPT, "application/json")
        .timeout(allow)
        .send()
        .await
        .is_ok_and(|answer| answer.status().is_success())
}

/// Looks where a Valence on this computer usually answers, and says where one did.
pub async fn look_for_a_valence(reach: &Reach) -> Option<String> {
    for address in WHERE_ONE_USUALLY_IS {
        if reach(address.to_owned()).await {
            return Some(address.to_owned());
        }
    }

    None
}

/// Keeps looking for a while for a server still starting, telling `found` once if one turns up.
#[must_use]
pub fn keep_looking_for_a_valence(
    found: impl FnOnce(String) + Send + 'static,
    reach: Reach,
) -> CancellationToken {
    let stopper = CancellationToken::new();
    let looking = stopper.clone();

    crate::runtime::spawn(async move {
        let give_up_at = tokio::time::Instant::now() + STOP_LOOKING_AFTER;
        let mut next = tokio::time::Instant::now() + LOOK_AGAIN_EVERY;

        while next < give_up_at {
            tokio::select! {
                () = looking.cancelled() => return,
                () = tokio::time::sleep_until(next) => {}
            }

            next += LOOK_AGAIN_EVERY;

            if let Some(address) = look_for_a_valence(&reach).await {
                if !looking.is_cancelled() {
                    looking.cancel();
                    found(address);
                }

                return;
            }
        }

        looking.cancel();
    });

    stopper
}

#[cfg(test)]
#[allow(
    clippy::unwrap_used,
    reason = "a test that cannot set up should fail loudly"
)]
mod tests {
    use super::{
        is_a_valence, keep_looking_for_a_valence, look_for_a_valence, Reach, LOOK_AGAIN_EVERY,
        STOP_LOOKING_AFTER, WHERE_ONE_USUALLY_IS,
    };
    use crate::held::keep_a_download::tests::serving;
    use axum::routing::get;
    use axum::Router;
    use futures_util::FutureExt;
    use std::sync::atomic::{AtomicUsize, Ordering};
    use std::sync::{Arc, Mutex};
    use std::time::Duration;

    fn answering(answers: Vec<bool>, asked: Arc<Mutex<Vec<String>>>) -> Reach {
        let answers = Arc::new(Mutex::new(answers.into_iter()));

        Arc::new(move |address| {
            asked.lock().unwrap().push(address);
            let answered = answers.lock().unwrap().next().unwrap_or(false);
            async move { answered }.boxed()
        })
    }

    fn always(answer: bool) -> (Reach, Arc<AtomicUsize>) {
        let count = Arc::new(AtomicUsize::new(0));
        let counting = count.clone();

        let reach: Reach = Arc::new(move |_| {
            counting.fetch_add(1, Ordering::SeqCst);
            async move { answer }.boxed()
        });

        (reach, count)
    }

    #[tokio::test]
    async fn finds_the_one_running_on_this_machine() {
        let asked = Arc::new(Mutex::new(Vec::new()));

        assert_eq!(
            look_for_a_valence(&answering(vec![true], asked)).await,
            Some(WHERE_ONE_USUALLY_IS[0].to_owned())
        );
    }

    #[tokio::test]
    async fn tries_the_next_address_where_the_first_says_nothing() {
        let asked = Arc::new(Mutex::new(Vec::new()));

        assert_eq!(
            look_for_a_valence(&answering(vec![false, true], asked)).await,
            Some(WHERE_ONE_USUALLY_IS[1].to_owned())
        );
    }

    #[tokio::test]
    async fn finds_nothing_where_nothing_is_running_and_looks_only_at_this_machine() {
        let asked = Arc::new(Mutex::new(Vec::new()));

        assert_eq!(
            look_for_a_valence(&answering(vec![], asked.clone())).await,
            None
        );
        assert!(asked.lock().unwrap().iter().all(|address| {
            address.starts_with("http://localhost:") || address.starts_with("http://127.0.0.1:")
        }));
    }

    #[tokio::test(start_paused = true)]
    async fn answers_for_somebody_whose_server_was_still_starting() {
        let found = Arc::new(Mutex::new(Vec::new()));
        let finding = found.clone();
        let (reach, _) = always(true);

        let _looking =
            keep_looking_for_a_valence(move |address| finding.lock().unwrap().push(address), reach);

        tokio::time::sleep(LOOK_AGAIN_EVERY + Duration::from_millis(1)).await;

        assert_eq!(
            *found.lock().unwrap(),
            vec![WHERE_ONE_USUALLY_IS[0].to_owned()]
        );
    }

    #[tokio::test(start_paused = true)]
    async fn says_nothing_while_there_is_nothing_to_say() {
        let found = Arc::new(Mutex::new(Vec::new()));
        let finding = found.clone();
        let (reach, _) = always(false);

        let _looking =
            keep_looking_for_a_valence(move |address| finding.lock().unwrap().push(address), reach);

        tokio::time::sleep(LOOK_AGAIN_EVERY * 3).await;

        assert!(found.lock().unwrap().is_empty());
    }

    #[tokio::test(start_paused = true)]
    async fn gives_up_eventually_rather_than_asking_a_machine_forever() {
        let (reach, count) = always(false);

        let _looking = keep_looking_for_a_valence(|_| {}, reach);

        tokio::time::sleep(STOP_LOOKING_AFTER + LOOK_AGAIN_EVERY * 2).await;
        let asked = count.load(Ordering::SeqCst);
        tokio::time::sleep(LOOK_AGAIN_EVERY * 3).await;

        assert!(asked > 0);
        assert_eq!(count.load(Ordering::SeqCst), asked);
    }

    #[tokio::test(start_paused = true)]
    async fn stops_when_told_to_so_changing_server_does_not_fight_the_search() {
        let found = Arc::new(Mutex::new(Vec::new()));
        let finding = found.clone();
        let (reach, _) = always(true);

        keep_looking_for_a_valence(move |address| finding.lock().unwrap().push(address), reach)
            .cancel();

        tokio::time::sleep(LOOK_AGAIN_EVERY * 2).await;

        assert!(found.lock().unwrap().is_empty());
    }

    #[tokio::test(start_paused = true)]
    async fn tells_whoever_asked_only_once_however_long_it_keeps_running() {
        let (reach, count) = always(true);

        let _looking = keep_looking_for_a_valence(|_| {}, reach);

        tokio::time::sleep(LOOK_AGAIN_EVERY * 4).await;

        assert_eq!(count.load(Ordering::SeqCst), 1);
    }

    #[tokio::test]
    async fn asks_the_health_of_an_address_and_hears_whether_it_answered() {
        let healthy = serving(Router::new().route("/api/health", get(|| async { "{}" }))).await;
        let unwell = serving(Router::new()).await;
        let client = reqwest::Client::new();

        assert!(is_a_valence(&client, &healthy, Duration::from_millis(1500)).await);
        assert!(!is_a_valence(&client, &unwell, Duration::from_millis(1500)).await);
        assert!(!is_a_valence(&client, "http://127.0.0.1:1", Duration::from_millis(1500)).await);
    }
}
