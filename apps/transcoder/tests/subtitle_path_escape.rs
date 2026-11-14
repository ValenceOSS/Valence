//! Whether a path with filter syntax in its name reaches the `subtitles` filter as that path.

#![allow(clippy::expect_used, clippy::unwrap_used)]

use std::process::Command;

use valence_transcoder::transcode_plan::escape_filter_path;

mod common;

use common::{ffmpeg, require_ffmpeg, scratch};

#[test]
fn opens_a_subtitle_file_named_with_filter_syntax() {
    require_ffmpeg();

    let filters = Command::new(ffmpeg())
        .args(["-hide_banner", "-filters"])
        .output()
        .expect("lists the filters");

    assert!(
        String::from_utf8_lossy(&filters.stdout).contains(" subtitles "),
        "this ffmpeg has no subtitles filter. Set VALENCE_FFMPEG to Valence's own FFmpeg build."
    );

    let dir = scratch("subtitle-path-escape");

    std::fs::create_dir_all(&dir).unwrap();

    let path = dir.join("it's, a;[b] c.srt");

    std::fs::write(&path, "1\n00:00:00,000 --> 00:00:01,000\nhello\n").unwrap();

    let filter = format!("subtitles='{}'", escape_filter_path(path.to_str().unwrap()));
    let output = Command::new(ffmpeg())
        .args(["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i"])
        .arg("color=c=black:s=64x64:d=1:r=5")
        .args(["-vf", &filter, "-f", "null", "-"])
        .output()
        .expect("runs ffmpeg");

    assert!(
        output.status.success(),
        "the filter graph did not open the file: {}",
        String::from_utf8_lossy(&output.stderr)
    );
}
