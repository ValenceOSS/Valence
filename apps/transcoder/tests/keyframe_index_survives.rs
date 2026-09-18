//! The index has to outlive the session that read it, or it buys nothing.
//!
//! The unit tests prove that a kept index cuts a film where reading it afresh
//! would. Only real files prove that it is filed under something a rewritten
//! source changes, which is what stops a remux being served against the old
//! one's keyframes.

#![allow(clippy::expect_used, clippy::unwrap_used)]

use std::path::PathBuf;

use valence_transcoder::keyframe_index;
use valence_transcoder::keyframes::{Cut, Keyframes};

fn a_film() -> Keyframes {
    Keyframes {
        cuts: (0..10)
            .map(|at| Cut {
                at_seconds: f64::from(at) * 4.0,
                starts_at_seconds: f64::from(at) * 4.0,
            })
            .collect(),
        starts_at_seconds: 0.0,
        duration_seconds: 40.0,
    }
}

fn scratch(name: &str) -> PathBuf {
    let root = std::env::temp_dir().join(format!("valence-keyframe-index-{name}"));

    let _ = std::fs::remove_dir_all(&root);
    std::fs::create_dir_all(&root).expect("the scratch directory is made");

    root
}

#[tokio::test]
async fn reads_back_what_it_kept() {
    let root = scratch("reads-back");
    let source = root.join("film.mkv");

    std::fs::write(&source, b"not really a film").expect("the source is written");

    assert_eq!(keyframe_index::read(&root, &source).await, None);

    keyframe_index::write(&root, &source, &a_film()).await;

    assert_eq!(keyframe_index::read(&root, &source).await, Some(a_film()));
}

#[tokio::test]
async fn answers_nothing_for_a_file_rewritten_in_place() {
    let root = scratch("rewritten");
    let source = root.join("film.mkv");

    std::fs::write(&source, b"the first cut").expect("the source is written");
    keyframe_index::write(&root, &source, &a_film()).await;

    std::fs::write(&source, b"a different remux entirely").expect("the source is replaced");

    assert_eq!(
        keyframe_index::read(&root, &source).await,
        None,
        "a file replaced in place has different keyframes and must be read again"
    );
}

#[tokio::test]
async fn answers_nothing_for_a_source_that_is_not_there() {
    let root = scratch("missing");

    assert_eq!(
        keyframe_index::read(&root, &root.join("gone.mkv")).await,
        None
    );
}
