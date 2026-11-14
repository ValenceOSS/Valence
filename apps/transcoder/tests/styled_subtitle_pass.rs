//! Whether a styled track is waiting by the time a player asks for it.
//!
//! A player lists a title's tracks before it chooses one, and listing starts the one pass that
//! reads every text track out of the file. A script used to be left out of that pass and read on
//! its own afterwards, so the first play of a file with ASS subtitles read the whole file twice
//! before a line could be shown, and a viewer on a large remux often gave up first. This drives
//! the real reads against a real Matroska file and checks the script comes out of the first.

#![allow(clippy::expect_used, clippy::unwrap_used)]

use std::path::{Path, PathBuf};

use valence_transcoder::subtitle::{SubtitleError, SubtitleFormat, SubtitleRegistry, Tools};

mod common;

use common::{ffmpeg, ffprobe, require_ffmpeg, scratch};

const SCRIPT: &str = "[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,60,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,1,2,20,20,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,Hello there
Dialogue: 0,0:00:04.00,0:00:05.00,Default,,0,0,0,,{\\pos(960,200)}A sign
";

const SILENT_SCRIPT: &str = "[Script Info]
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,60,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,1,2,20,20,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
";

const SUBRIP: &str = "1\n00:00:01,000 --> 00:00:02,000\nplain\n";

/// Builds a short Matroska file with a script, a `SubRip` track and a script with no lines.
fn film(dir: &Path) -> PathBuf {
    let script = dir.join("dialogue.ass");
    let silent = dir.join("silent.ass");
    let subrip = dir.join("plain.srt");
    let film = dir.join("film.mkv");

    std::fs::write(&script, SCRIPT).unwrap();
    std::fs::write(&silent, SILENT_SCRIPT).unwrap();
    std::fs::write(&subrip, SUBRIP).unwrap();

    let status = std::process::Command::new(ffmpeg())
        .args(["-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi"])
        .args(["-i", "color=c=black:s=64x64:d=6:r=5"])
        .arg("-i")
        .arg(&script)
        .arg("-i")
        .arg(&subrip)
        .arg("-i")
        .arg(&silent)
        .args(["-map", "0", "-map", "1", "-map", "2", "-map", "3"])
        .args(["-c:v", "mpeg4", "-c:s", "copy"])
        .arg(&film)
        .status()
        .expect("runs ffmpeg");

    assert!(status.success(), "ffmpeg could not build the film");

    film
}

/// The programs a read is given.
fn tools() -> Tools {
    Tools {
        ffmpeg: ffmpeg(),
        ffprobe: ffprobe(),
    }
}

/// Where the reads keep what they took out of a file.
async fn kept_for(root: &Path, film: &Path) -> PathBuf {
    root.join("subtitles").join(
        valence_transcoder::source_address::of(film)
            .await
            .expect("addresses the film"),
    )
}

#[tokio::test]
async fn keeps_the_script_from_the_pass_that_listing_starts() {
    require_ffmpeg();

    let dir = scratch("styled-subtitle-pass");
    let root = dir.join("artefacts");

    std::fs::create_dir_all(&dir).unwrap();

    let film = film(&dir);
    let registry = SubtitleRegistry::new();

    let plain = registry
        .read(tools(), &root, film.clone(), 2, SubtitleFormat::Webvtt)
        .await
        .expect("reads the SubRip track");

    assert!(plain.content.contains("plain"));

    let kept = kept_for(&root, &film).await;

    assert!(
        kept.join("1.ass").exists(),
        "the pass a listing starts keeps the script as well as its WebVTT"
    );
    assert!(kept.join("1.vtt").exists());
    assert!(!kept.join("2.ass").exists(), "a SubRip track is no script");

    let copied = std::fs::read_to_string(kept.join("1.ass")).unwrap();

    assert!(copied.contains("[V4+ Styles]"));
    assert!(copied.contains("{\\pos(960,200)}A sign"));

    std::fs::write(kept.join("1.ass"), "Dialogue: answered from what was kept").unwrap();

    let script = registry
        .read(tools(), &root, film.clone(), 1, SubtitleFormat::Ass)
        .await
        .expect("answers the script");

    assert_eq!(
        script.content, "Dialogue: answered from what was kept",
        "the script is answered from the pass rather than read out of the file again"
    );
}

#[tokio::test]
async fn reads_a_script_in_one_pass_when_nothing_was_listed_first() {
    require_ffmpeg();

    let dir = scratch("styled-subtitle-first");
    let root = dir.join("artefacts");

    std::fs::create_dir_all(&dir).unwrap();

    let film = film(&dir);
    let registry = SubtitleRegistry::new();

    let script = registry
        .read(tools(), &root, film.clone(), 1, SubtitleFormat::Ass)
        .await
        .expect("answers the script");

    assert!(script.content.contains("Hello there"));

    let kept = kept_for(&root, &film).await;

    assert!(
        kept.join("2.vtt").exists(),
        "reading the script reads every other text track in the same pass"
    );
}

#[tokio::test]
async fn keeps_a_script_with_no_lines_so_it_is_not_read_again() {
    require_ffmpeg();

    let dir = scratch("styled-subtitle-silent");
    let root = dir.join("artefacts");

    std::fs::create_dir_all(&dir).unwrap();

    let film = film(&dir);
    let registry = SubtitleRegistry::new();

    let first = registry
        .read(tools(), &root, film.clone(), 3, SubtitleFormat::Ass)
        .await;

    assert!(matches!(first, Err(SubtitleError::Empty)));
    assert!(kept_for(&root, &film).await.join("3.ass").exists());

    let again = registry
        .read(tools(), &root, film.clone(), 3, SubtitleFormat::Ass)
        .await;

    assert!(matches!(again, Err(SubtitleError::Empty)));
}
