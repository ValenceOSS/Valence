//! Writing subtitles for a film that has none, by listening to it with Whisper.
//!
//! A film with no subtitles of any kind, in no language, is one nobody hard of
//! hearing can follow and nobody can watch with the sound down. Here its sound
//! is listened to once by whisper.cpp, in the background, and what was said is
//! kept as `WebVTT` beside the file's other subtitles — in Valence's own cache,
//! never in the library, which Valence does not write to.
//!
//! Listening to a whole film takes minutes on a fast machine and much longer
//! on a slow one, so it is started the first time anybody asks and answered as
//! still working until it is done, one film at a time. The model it listens
//! with is fetched the first time it is wanted and kept.

use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex as StdMutex, PoisonError};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tokio::io::AsyncWriteExt;
use tokio::process::Command;
use tokio::sync::Semaphore;

const DIRECTORY: &str = "subtitles";

const MODELS: &str = "whisper";

/// How many films are listened to at once. Whisper keeps every core it is
/// given busy, so a second would only slow the first.
const FILMS_AT_ONCE: usize = 1;

/// Where the models are fetched from: whisper.cpp's own published conversions.
const MODEL_SOURCE: &str = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main";

/// What whisper.cpp says on its error stream once it has decided what
/// language it is hearing.
const DETECTED: &str = "auto-detected language: ";

/// How large a model to listen with: the larger, the better it hears and the
/// longer it takes.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum WhisperModel {
    Tiny,
    Base,
    Small,
    Medium,
    LargeV3Turbo,
}

impl WhisperModel {
    /// The model's name as whisper.cpp publishes it.
    #[must_use]
    pub const fn name(self) -> &'static str {
        match self {
            Self::Tiny => "tiny",
            Self::Base => "base",
            Self::Small => "small",
            Self::Medium => "medium",
            Self::LargeV3Turbo => "large-v3-turbo",
        }
    }
}

/// What a caller asks to be listened to.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GeneratedSubtitleRequest {
    #[serde(deserialize_with = "crate::path_map::deserialize_input")]
    pub input_path: String,
    /// The sound to listen to, as ffprobe numbered it, or the first where none
    /// is named.
    #[serde(default)]
    pub audio_stream_index: Option<u32>,
    pub model: WhisperModel,
    /// The language spoken, as a two-letter code, or nothing to have Whisper
    /// work it out.
    #[serde(default)]
    pub language: Option<String>,
    /// Whether to write what was said in English rather than as it was said.
    #[serde(default)]
    pub translate: bool,
}

/// Where a listen has got to.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase", tag = "state")]
pub enum GeneratedSubtitleState {
    /// Listened to, and this is what was said, in this language.
    Ready {
        content: String,
        language: Option<String>,
    },
    /// Being listened to, or waiting its turn to be.
    Working,
    /// Cannot be listened to here: no whisper.cpp, no model, or nothing heard.
    Unavailable,
}

/// The listens under way, so one film is never listened to twice at once.
#[derive(Clone)]
pub struct GeneratedSubtitleRegistry {
    working: Arc<StdMutex<HashSet<PathBuf>>>,
    slots: Arc<Semaphore>,
}

impl Default for GeneratedSubtitleRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl GeneratedSubtitleRegistry {
    #[must_use]
    pub fn new() -> Self {
        Self {
            working: Arc::new(StdMutex::new(HashSet::new())),
            slots: Arc::new(Semaphore::new(FILMS_AT_ONCE)),
        }
    }

    /// Answers with what was said in a film where it has been listened to, and
    /// otherwise starts listening in the background.
    pub async fn read_or_start(
        &self,
        ffmpeg: &str,
        artefact_root: &Path,
        path: PathBuf,
        request: &GeneratedSubtitleRequest,
    ) -> GeneratedSubtitleState {
        let Some(address) = crate::source_address::of(&path).await else {
            return GeneratedSubtitleState::Unavailable;
        };
        let directory = artefact_root.join(DIRECTORY).join(&address);
        let kept = kept_at(&directory, request);

        if let Ok(content) = tokio::fs::read_to_string(&kept).await {
            return if content.trim().len() > "WEBVTT".len() {
                GeneratedSubtitleState::Ready {
                    content,
                    language: tokio::fs::read_to_string(language_at(&kept))
                        .await
                        .ok()
                        .map(|said| said.trim().to_owned())
                        .filter(|said| !said.is_empty()),
                }
            } else {
                GeneratedSubtitleState::Unavailable
            };
        }

        if !whisper_is_here().await {
            return GeneratedSubtitleState::Unavailable;
        }

        {
            let mut working = self.working.lock().unwrap_or_else(PoisonError::into_inner);

            if !working.insert(kept.clone()) {
                return GeneratedSubtitleState::Working;
            }
        }

        let registry = self.clone();
        let ffmpeg = ffmpeg.to_owned();
        let models = artefact_root.join(MODELS);
        let request = request.clone();

        tokio::spawn(async move {
            let permit = registry.slots.clone().acquire_owned().await;
            let outcome = listen(&ffmpeg, &models, &path, &request).await;

            match outcome {
                Ok((vtt, language)) => {
                    keep(&directory, &kept, &vtt).await;
                    keep(
                        &directory,
                        &language_at(&kept),
                        language.as_deref().unwrap_or(""),
                    )
                    .await;
                }
                Err(reason) => {
                    tracing::warn!(path = %path.display(), "could not write subtitles with whisper: {reason}");
                    keep(&directory, &kept, "WEBVTT\n").await;
                }
            }

            drop(permit);
            registry
                .working
                .lock()
                .unwrap_or_else(PoisonError::into_inner)
                .remove(&kept);
        });

        GeneratedSubtitleState::Working
    }
}

/// The whisper.cpp to run.
fn whisper() -> String {
    std::env::var("VALENCE_WHISPER").unwrap_or_else(|_| "whisper-cli".to_owned())
}

/// Whether whisper.cpp can be run here at all.
pub async fn whisper_is_here() -> bool {
    Command::new(whisper())
        .arg("--help")
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .kill_on_drop(true)
        .status()
        .await
        .is_ok()
}

/// Where a film's generated words are kept once heard, named for everything
/// that changes what would be written, so a different model or language is a
/// different track rather than the old one.
fn kept_at(directory: &Path, request: &GeneratedSubtitleRequest) -> PathBuf {
    let language = request
        .language
        .as_deref()
        .map(str::trim)
        .filter(|named| !named.is_empty())
        .unwrap_or("auto");
    let task = if request.translate {
        "translate"
    } else {
        "transcribe"
    };
    let audio = request
        .audio_stream_index
        .map_or_else(|| "a".to_owned(), |index| index.to_string());

    directory.join(format!(
        "generated.{audio}.{}.{language}.{task}.vtt",
        request.model.name()
    ))
}

/// Where the language a track was heard in is kept beside it.
fn language_at(kept: &Path) -> PathBuf {
    kept.with_extension("vtt.language")
}

/// Writes a finished file where it is kept, by way of a partial file so a
/// crash never leaves half of one that looks whole.
async fn keep(directory: &Path, kept: &Path, content: &str) {
    if tokio::fs::create_dir_all(directory).await.is_err() {
        return;
    }

    let partial = kept.with_extension("partial");

    if tokio::fs::write(&partial, content).await.is_ok() {
        let _ = tokio::fs::rename(&partial, kept).await;
    }
}

/// Fetches a model the first time it is wanted, and answers with where it is.
async fn model_at(models: &Path, model: WhisperModel) -> Result<PathBuf, String> {
    let file = format!("ggml-{}.bin", model.name());
    let kept = models.join(&file);

    if tokio::fs::metadata(&kept).await.is_ok() {
        return Ok(kept);
    }

    tokio::fs::create_dir_all(models)
        .await
        .map_err(|failure| failure.to_string())?;

    let partial = models.join(format!("{file}.partial"));
    let mut response = reqwest::get(format!("{MODEL_SOURCE}/{file}"))
        .await
        .and_then(reqwest::Response::error_for_status)
        .map_err(|failure| format!("the {} model could not be fetched: {failure}", model.name()))?;
    let mut written = tokio::fs::File::create(&partial)
        .await
        .map_err(|failure| failure.to_string())?;

    while let Some(chunk) = response
        .chunk()
        .await
        .map_err(|failure| failure.to_string())?
    {
        written
            .write_all(&chunk)
            .await
            .map_err(|failure| failure.to_string())?;
    }

    written
        .flush()
        .await
        .map_err(|failure| failure.to_string())?;
    drop(written);
    tokio::fs::rename(&partial, &kept)
        .await
        .map_err(|failure| failure.to_string())?;

    Ok(kept)
}

/// A directory of its own for one listen, so two never share a sound file.
fn scratch(models: &Path) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |since| since.as_nanos());

    models.join(format!("listening-{nanos}"))
}

/// The arguments that take a film's sound out as Whisper hears it: one
/// channel, sixteen thousand samples a second.
#[must_use]
pub fn sound_arguments(
    input: &Path,
    audio_stream_index: Option<u32>,
    output: &Path,
) -> Vec<String> {
    crate::joined_input::opened(vec![
        "-nostdin".to_owned(),
        "-v".to_owned(),
        "error".to_owned(),
        "-i".to_owned(),
        input.display().to_string(),
        "-map".to_owned(),
        audio_stream_index.map_or_else(|| "0:a:0".to_owned(), |index| format!("0:{index}")),
        "-vn".to_owned(),
        "-ac".to_owned(),
        "1".to_owned(),
        "-ar".to_owned(),
        "16000".to_owned(),
        "-c:a".to_owned(),
        "pcm_s16le".to_owned(),
        "-y".to_owned(),
        output.display().to_string(),
    ])
}

/// The arguments that have whisper.cpp listen to a sound file and write what
/// it heard as `WebVTT`.
///
/// Its progress is left on rather than silenced, because the line saying what
/// language it heard is part of it.
#[must_use]
pub fn whisper_arguments(
    model: &Path,
    sound: &Path,
    written: &Path,
    request: &GeneratedSubtitleRequest,
    threads: usize,
) -> Vec<String> {
    let mut arguments = vec![
        "-m".to_owned(),
        model.display().to_string(),
        "-f".to_owned(),
        sound.display().to_string(),
        "-l".to_owned(),
        request
            .language
            .as_deref()
            .map(str::trim)
            .filter(|named| !named.is_empty())
            .unwrap_or("auto")
            .to_owned(),
        "-t".to_owned(),
        threads.to_string(),
        "-ovtt".to_owned(),
        "-of".to_owned(),
        written.display().to_string(),
    ];

    if request.translate {
        arguments.push("-tr".to_owned());
    }

    arguments
}

/// Reads the language whisper.cpp said it heard, from what it wrote while it
/// worked.
#[must_use]
pub fn detected_language(said: &str) -> Option<String> {
    said.lines().find_map(|line| {
        let at = line.find(DETECTED)?;
        let rest = &line[at + DETECTED.len()..];
        let code: String = rest.chars().take_while(char::is_ascii_alphabetic).collect();

        (!code.is_empty()).then_some(code)
    })
}

/// The language what was written is in: English where it was translated, what
/// was asked for where somebody said, and otherwise what Whisper heard.
fn language_written(request: &GeneratedSubtitleRequest, heard: Option<String>) -> Option<String> {
    if request.translate {
        return Some("en".to_owned());
    }

    request
        .language
        .as_deref()
        .map(str::trim)
        .filter(|named| !named.is_empty())
        .map(str::to_owned)
        .or(heard)
}

/// Listens to a film and answers with what was said, as `WebVTT`, and the
/// language it was written in.
async fn listen(
    ffmpeg: &str,
    models: &Path,
    path: &Path,
    request: &GeneratedSubtitleRequest,
) -> Result<(String, Option<String>), String> {
    let model = model_at(models, request.model).await?;
    let directory = scratch(models);

    tokio::fs::create_dir_all(&directory)
        .await
        .map_err(|failure| failure.to_string())?;

    let outcome = listen_in(ffmpeg, &model, &directory, path, request).await;
    let _ = tokio::fs::remove_dir_all(&directory).await;

    outcome
}

/// The listening itself, in a directory that is thrown away afterwards.
async fn listen_in(
    ffmpeg: &str,
    model: &Path,
    directory: &Path,
    path: &Path,
    request: &GeneratedSubtitleRequest,
) -> Result<(String, Option<String>), String> {
    let sound = directory.join("sound.wav");
    let taken = Command::new(ffmpeg)
        .args(sound_arguments(path, request.audio_stream_index, &sound))
        .kill_on_drop(true)
        .output()
        .await
        .map_err(|failure| failure.to_string())?;

    if !taken.status.success() {
        return Err(String::from_utf8_lossy(&taken.stderr).trim().to_owned());
    }

    let written = directory.join("words");
    let threads = std::thread::available_parallelism().map_or(2, std::num::NonZeroUsize::get);
    let heard = Command::new(whisper())
        .args(whisper_arguments(model, &sound, &written, request, threads))
        .kill_on_drop(true)
        .output()
        .await
        .map_err(|failure| failure.to_string())?;

    if !heard.status.success() {
        return Err(crate::capability::summarise_failure(
            &String::from_utf8_lossy(&heard.stderr),
            "whisper stopped without saying why",
        ));
    }

    let vtt = tokio::fs::read_to_string(written.with_extension("vtt"))
        .await
        .map_err(|failure| failure.to_string())?;

    Ok((
        tidy(&vtt),
        language_written(
            request,
            detected_language(&String::from_utf8_lossy(&heard.stderr)),
        ),
    ))
}

/// Takes the space whisper.cpp starts each line with away, so cues read as
/// any other subtitle's do.
#[must_use]
pub fn tidy(vtt: &str) -> String {
    let mut out = vtt.lines().map(str::trim).collect::<Vec<_>>().join("\n");

    out.push('\n');
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn asked(language: Option<&str>, translate: bool) -> GeneratedSubtitleRequest {
        GeneratedSubtitleRequest {
            input_path: "/media/film.mkv".to_owned(),
            audio_stream_index: None,
            model: WhisperModel::Base,
            language: language.map(str::to_owned),
            translate,
        }
    }

    #[test]
    fn reads_the_language_whisper_said_it_heard() {
        assert_eq!(
            detected_language("whisper_full_with_state: auto-detected language: en (p = 0.978124)"),
            Some("en".to_owned())
        );
        assert_eq!(detected_language("nothing about it"), None);
    }

    #[test]
    fn writes_in_english_whatever_was_said_once_translated() {
        assert_eq!(
            language_written(&asked(Some("fr"), true), Some("fr".to_owned())),
            Some("en".to_owned())
        );
        assert_eq!(
            language_written(&asked(None, false), Some("de".to_owned())),
            Some("de".to_owned())
        );
        assert_eq!(
            language_written(&asked(Some("ja"), false), Some("en".to_owned())),
            Some("ja".to_owned())
        );
    }

    #[test]
    fn keeps_a_different_model_or_language_as_a_different_track() {
        let directory = Path::new("/cache/subtitles/abc");

        assert_ne!(
            kept_at(directory, &asked(None, false)),
            kept_at(directory, &asked(None, true))
        );
        assert_eq!(
            kept_at(directory, &asked(Some("fr"), false)),
            directory.join("generated.a.base.fr.transcribe.vtt")
        );
    }

    #[test]
    fn takes_the_sound_out_as_whisper_hears_it() {
        let arguments = sound_arguments(
            Path::new("/media/film.mkv"),
            Some(2),
            Path::new("/tmp/s.wav"),
        );

        assert!(arguments.windows(2).any(|pair| pair == ["-map", "0:2"]));
        assert!(arguments.windows(2).any(|pair| pair == ["-ar", "16000"]));
        assert!(arguments.windows(2).any(|pair| pair == ["-ac", "1"]));
    }

    #[test]
    fn asks_whisper_to_translate_only_when_told() {
        let model = Path::new("/m.bin");
        let sound = Path::new("/s.wav");
        let written = Path::new("/w");

        assert!(
            !whisper_arguments(model, sound, written, &asked(None, false), 4)
                .contains(&"-tr".to_owned())
        );
        assert!(
            whisper_arguments(model, sound, written, &asked(None, true), 4)
                .contains(&"-tr".to_owned())
        );
        assert!(
            whisper_arguments(model, sound, written, &asked(None, false), 4)
                .windows(2)
                .any(|pair| pair == ["-l", "auto"])
        );
    }

    #[test]
    fn takes_away_the_space_each_line_starts_with() {
        assert_eq!(
            tidy("WEBVTT\n\n00:00:00.000 --> 00:00:01.000\n And so.\n"),
            "WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nAnd so.\n"
        );
    }
}
