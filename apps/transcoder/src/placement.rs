//! Which graphics device a session is given, where there is more than one.
//!
//! An operator who has turned this on lists the devices in the order they want them spent, each
//! with how many streams it may carry, and says what happens when every one is full. A session
//! that encodes on hardware is put on the first device that can encode what it asks for and has
//! room; the server's own choice of backend is kept where that device can run it, so an operator
//! who chose `QSV` over `VAAPI` on an Intel card still gets `QSV` there.
//!
//! "Room" is a count of streams against a limit, not a reading of how busy the card is. A reading
//! moves second to second and lags a session that has only just started, so a burst of viewers
//! would all be put on the same card before any of them showed up in it. The limit is what the
//! operator said, or what the device was measured to hold when its sessions were counted. See
//! [`crate::concurrency`].

use serde::{Deserialize, Serialize};

use crate::capability::{Capabilities, ENCODER_CANDIDATES};
use crate::chains::{runs_here, ChainShape};
use crate::devices::GraphicsDevice;
use crate::media::VideoRange;
use crate::transcode_plan::{HardwareAccel, SessionSpec, VideoAction};

/// How many streams a device is taken to hold where it was found to have hardware and no count
/// of its sessions could be made. The same figure the background queue falls back on.
const WHEN_UNMEASURED: u32 = 2;

/// What happens to a session when every device is full.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum WhenFull {
    /// Encode it on the processor, which is slower and never refuses.
    #[default]
    Software,
    /// Put it on the first device anyway, which is faster until the card gives out.
    Preferred,
}

/// One device an operator has switched on, and how many streams it may carry.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlacementRule {
    pub id: String,
    /// Absent means as many as it was measured to hold.
    #[serde(default)]
    pub max_streams: Option<u32>,
}

/// How sessions are spread across devices, as the server sends it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Placement {
    /// The devices to use, the first preferred.
    pub devices: Vec<PlacementRule>,
    #[serde(default)]
    pub when_full: WhenFull,
}

/// The device a session was placed on, as the server is told it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlacedHardware {
    pub device_id: String,
    pub device_name: String,
    pub accel: HardwareAccel,
}

/// A device a session could be given, with what it was found to do and what it is carrying.
#[derive(Debug, Clone, Copy)]
pub struct Candidate<'a> {
    pub device: &'a GraphicsDevice,
    pub capabilities: &'a Capabilities,
    pub streams: u32,
}

/// Where a session goes.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Choice {
    /// On a device, encoding with this backend and encoder.
    On {
        device: GraphicsDevice,
        accel: HardwareAccel,
        encoder: String,
    },
    /// On the processor, every device being full.
    Software,
    /// Where the server put it, no device being able to take it.
    Unchanged,
}

/// The codec an encoder makes, among the encoders Valence knows how to drive.
#[must_use]
pub fn codec_of(encoder: &str) -> Option<&'static str> {
    ENCODER_CANDIDATES
        .iter()
        .find(|candidate| candidate.encoder == encoder)
        .map(|candidate| candidate.codec)
}

/// The bit depth a session's chain is proved at: ten for an HDR source, eight otherwise.
fn depth_of(spec: &SessionSpec) -> u8 {
    match spec.source_range {
        Some(range) if range != VideoRange::Sdr => 10,
        _ => 8,
    }
}

/// The backend and encoder a device would encode a codec with, where it can: the one asked for
/// where the device drives it, otherwise the first it proved whose whole chain runs.
fn encoder_on<'a>(
    candidate: &Candidate<'a>,
    codec: &str,
    asked: HardwareAccel,
    depth: u8,
) -> Option<(HardwareAccel, &'a str)> {
    let usable = |accel: HardwareAccel| {
        candidate.device.accels.contains(&accel)
            && runs_here(
                &candidate.capabilities.chains,
                accel,
                ChainShape::Transcode,
                Some(depth),
            )
    };

    let proved = || {
        candidate
            .capabilities
            .encoders
            .iter()
            .filter(|encoder| encoder.codec == codec && encoder.accel != HardwareAccel::None)
    };

    proved()
        .find(|encoder| encoder.accel == asked && usable(encoder.accel))
        .or_else(|| proved().find(|encoder| usable(encoder.accel)))
        .map(|encoder| (encoder.accel, encoder.encoder.as_str()))
}

/// How many streams a device may carry: what the operator said, or what it was measured to hold.
fn limit_of(rule: &PlacementRule, capabilities: &Capabilities) -> u32 {
    rule.max_streams
        .unwrap_or(match capabilities.concurrent_renders {
            0 => WHEN_UNMEASURED,
            measured => measured,
        })
}

/// Chooses the device a session is given.
///
/// Only a session the server sent to hardware is placed: a copy needs no device, and a session
/// the server sent to software was sent there for a reason this cannot see. A device that has not
/// been checked yet is not offered, since nothing says it can encode at all.
#[must_use]
pub fn choose(spec: &SessionSpec, placement: &Placement, candidates: &[Candidate<'_>]) -> Choice {
    let VideoAction::Encode { encoder, .. } = &spec.video else {
        return Choice::Unchanged;
    };

    if spec.hardware_accel == HardwareAccel::None {
        return Choice::Unchanged;
    }

    let Some(codec) = codec_of(encoder) else {
        return Choice::Unchanged;
    };

    let depth = depth_of(spec);
    let mut first = None;

    for rule in &placement.devices {
        let Some(candidate) = candidates
            .iter()
            .find(|candidate| candidate.device.id == rule.id)
        else {
            continue;
        };
        let Some((accel, chosen)) = encoder_on(candidate, codec, spec.hardware_accel, depth) else {
            continue;
        };
        let choice = Choice::On {
            device: candidate.device.clone(),
            accel,
            encoder: chosen.to_owned(),
        };

        if candidate.streams < limit_of(rule, candidate.capabilities) {
            return choice;
        }

        first.get_or_insert(choice);
    }

    match (first, placement.when_full) {
        (None, _) => Choice::Unchanged,
        (Some(_), WhenFull::Software) => Choice::Software,
        (Some(choice), WhenFull::Preferred) => choice,
    }
}

/// The session as it runs on a device: the backend and encoder that device chose, everything
/// else as it was asked for.
#[must_use]
pub fn on_device(spec: &SessionSpec, accel: HardwareAccel, chosen: &str) -> SessionSpec {
    let video = match &spec.video {
        VideoAction::Encode {
            max_bitrate_kbps,
            max_width,
            max_height,
            tone_map,
            deinterlace,
            square_pixels,
            ..
        } => VideoAction::Encode {
            encoder: chosen.to_owned(),
            max_bitrate_kbps: *max_bitrate_kbps,
            max_width: *max_width,
            max_height: *max_height,
            tone_map: *tone_map,
            deinterlace: *deinterlace,
            square_pixels: *square_pixels,
        },
        VideoAction::Copy => VideoAction::Copy,
    };

    SessionSpec {
        hardware_accel: accel,
        video,
        ..spec.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::{
        choose, codec_of, on_device, Candidate, Choice, Placement, PlacementRule, WhenFull,
    };
    use crate::capability::{Capabilities, VerifiedEncoder};
    use crate::chains::{ChainShape, VerifiedChain};
    use crate::devices::{GraphicsDevice, Vendor};
    use crate::media::VideoRange;
    use crate::transcode_plan::{HardwareAccel, SessionSpec, VideoAction};

    fn device(id: &str, vendor: Vendor, node: &str, accels: &[HardwareAccel]) -> GraphicsDevice {
        GraphicsDevice {
            id: id.to_owned(),
            name: id.to_owned(),
            vendor,
            node: node.to_owned(),
            accels: accels.to_vec(),
        }
    }

    fn capabilities(encoders: &[(&str, &str, HardwareAccel)], renders: u32) -> Capabilities {
        let mut found: Capabilities = serde_json::from_value(serde_json::json!({
            "ffmpegVersion": "7.1",
            "encoders": [],
            "hardwareAccels": [],
            "toneMapping": "none",
            "canBurnTextSubtitles": false,
            "canBurnImageSubtitles": false,
        }))
        .expect("capabilities");

        found.encoders = encoders
            .iter()
            .map(|(codec, encoder, accel)| VerifiedEncoder {
                codec: (*codec).to_owned(),
                encoder: (*encoder).to_owned(),
                accel: *accel,
                verified: true,
            })
            .collect();
        found.concurrent_renders = renders;

        found
    }

    fn spec(encoder: &str, accel: HardwareAccel) -> SessionSpec {
        serde_json::from_value(serde_json::json!({
            "inputPath": "/films/arrival.mkv",
            "startSeconds": 0,
            "segmentSeconds": 4,
            "hardwareAccel": accel,
            "video": {
                "kind": "encode",
                "encoder": encoder,
                "maxBitrateKbps": 8000,
                "maxWidth": 1920,
                "maxHeight": 1080,
            },
            "audio": { "kind": "copy" },
        }))
        .expect("spec")
    }

    fn rule(id: &str, max_streams: Option<u32>) -> PlacementRule {
        PlacementRule {
            id: id.to_owned(),
            max_streams,
        }
    }

    fn rtx() -> GraphicsDevice {
        device("rtx", Vendor::Nvidia, "cuda:0", &[HardwareAccel::Nvenc])
    }

    fn radeon() -> GraphicsDevice {
        device(
            "radeon",
            Vendor::Amd,
            "/dev/dri/renderD129",
            &[HardwareAccel::Vaapi],
        )
    }

    fn nvenc() -> Capabilities {
        capabilities(&[("h264", "h264_nvenc", HardwareAccel::Nvenc)], 8)
    }

    fn vaapi() -> Capabilities {
        capabilities(&[("h264", "h264_vaapi", HardwareAccel::Vaapi)], 4)
    }

    fn both(when_full: WhenFull, rtx_cap: Option<u32>) -> Placement {
        Placement {
            devices: vec![rule("rtx", rtx_cap), rule("radeon", None)],
            when_full,
        }
    }

    /// The first device in the operator's order takes the session while it has room.
    #[test]
    fn puts_a_session_on_the_first_device_with_room() {
        let (rtx, radeon, nvenc, vaapi) = (rtx(), radeon(), nvenc(), vaapi());
        let candidates = [
            Candidate {
                device: &rtx,
                capabilities: &nvenc,
                streams: 3,
            },
            Candidate {
                device: &radeon,
                capabilities: &vaapi,
                streams: 0,
            },
        ];

        assert_eq!(
            choose(
                &spec("h264_nvenc", HardwareAccel::Nvenc),
                &both(WhenFull::Software, None),
                &candidates
            ),
            Choice::On {
                device: rtx.clone(),
                accel: HardwareAccel::Nvenc,
                encoder: "h264_nvenc".to_owned()
            }
        );
    }

    /// The card is full, so the iGPU beside it takes the session with its own encoder.
    #[test]
    fn overflows_onto_the_next_device() {
        let (rtx, radeon, nvenc, vaapi) = (rtx(), radeon(), nvenc(), vaapi());
        let candidates = [
            Candidate {
                device: &rtx,
                capabilities: &nvenc,
                streams: 2,
            },
            Candidate {
                device: &radeon,
                capabilities: &vaapi,
                streams: 0,
            },
        ];

        assert_eq!(
            choose(
                &spec("h264_nvenc", HardwareAccel::Nvenc),
                &both(WhenFull::Software, Some(2)),
                &candidates
            ),
            Choice::On {
                device: radeon.clone(),
                accel: HardwareAccel::Vaapi,
                encoder: "h264_vaapi".to_owned()
            }
        );
    }

    /// With no cap, the measured count is the limit.
    #[test]
    fn holds_a_device_to_what_it_was_measured_to_carry() {
        let (rtx, radeon, nvenc, vaapi) = (rtx(), radeon(), nvenc(), vaapi());
        let candidates = [
            Candidate {
                device: &rtx,
                capabilities: &nvenc,
                streams: 8,
            },
            Candidate {
                device: &radeon,
                capabilities: &vaapi,
                streams: 1,
            },
        ];

        assert!(matches!(
            choose(&spec("h264_nvenc", HardwareAccel::Nvenc), &both(WhenFull::Software, None), &candidates),
            Choice::On { device, .. } if device.id == "radeon"
        ));
    }

    /// Every device full and software chosen for that case.
    #[test]
    fn goes_to_software_when_every_device_is_full() {
        let (rtx, radeon, nvenc, vaapi) = (rtx(), radeon(), nvenc(), vaapi());
        let candidates = [
            Candidate {
                device: &rtx,
                capabilities: &nvenc,
                streams: 8,
            },
            Candidate {
                device: &radeon,
                capabilities: &vaapi,
                streams: 4,
            },
        ];

        assert_eq!(
            choose(
                &spec("h264_nvenc", HardwareAccel::Nvenc),
                &both(WhenFull::Software, None),
                &candidates
            ),
            Choice::Software
        );
    }

    /// Every device full and the first chosen for that case.
    #[test]
    fn stays_on_the_first_device_when_told_to() {
        let (rtx, radeon, nvenc, vaapi) = (rtx(), radeon(), nvenc(), vaapi());
        let candidates = [
            Candidate {
                device: &rtx,
                capabilities: &nvenc,
                streams: 8,
            },
            Candidate {
                device: &radeon,
                capabilities: &vaapi,
                streams: 4,
            },
        ];

        assert!(matches!(
            choose(&spec("h264_nvenc", HardwareAccel::Nvenc), &both(WhenFull::Preferred, None), &candidates),
            Choice::On { device, .. } if device.id == "rtx"
        ));
    }

    /// A device that cannot make the codec is passed over, full or not.
    #[test]
    fn passes_over_a_device_that_cannot_make_the_codec() {
        let (rtx, radeon, vaapi) = (rtx(), radeon(), vaapi());
        let hevc = capabilities(&[("hevc", "hevc_nvenc", HardwareAccel::Nvenc)], 8);
        let candidates = [
            Candidate {
                device: &radeon,
                capabilities: &vaapi,
                streams: 0,
            },
            Candidate {
                device: &rtx,
                capabilities: &hevc,
                streams: 0,
            },
        ];
        let placement = Placement {
            devices: vec![rule("radeon", None), rule("rtx", None)],
            when_full: WhenFull::Software,
        };

        assert!(matches!(
            choose(&spec("hevc_nvenc", HardwareAccel::Nvenc), &placement, &candidates),
            Choice::On { device, .. } if device.id == "rtx"
        ));
    }

    /// A chain the device was proved not to run at this depth rules it out.
    #[test]
    fn passes_over_a_device_whose_chain_will_not_run() {
        let (rtx, radeon, nvenc) = (rtx(), radeon(), nvenc());
        let mut vaapi = vaapi();
        vaapi.chains = vec![VerifiedChain {
            accel: HardwareAccel::Vaapi,
            shape: ChainShape::Transcode,
            bit_depth: 10,
            works: false,
            reason: None,
        }];
        let candidates = [
            Candidate {
                device: &rtx,
                capabilities: &nvenc,
                streams: 8,
            },
            Candidate {
                device: &radeon,
                capabilities: &vaapi,
                streams: 0,
            },
        ];
        let mut hdr = spec("h264_nvenc", HardwareAccel::Nvenc);
        hdr.source_range = Some(VideoRange::Hdr10);

        assert_eq!(
            choose(&hdr, &both(WhenFull::Software, None), &candidates),
            Choice::Software
        );
    }

    /// The backend the server chose is kept where the device drives it.
    #[test]
    fn keeps_the_backend_the_server_chose() {
        let intel = device(
            "intel",
            Vendor::Intel,
            "/dev/dri/renderD128",
            &[HardwareAccel::Vaapi, HardwareAccel::Qsv],
        );
        let found = capabilities(
            &[
                ("h264", "h264_vaapi", HardwareAccel::Vaapi),
                ("h264", "h264_qsv", HardwareAccel::Qsv),
            ],
            4,
        );
        let candidates = [Candidate {
            device: &intel,
            capabilities: &found,
            streams: 0,
        }];
        let placement = Placement {
            devices: vec![rule("intel", None)],
            when_full: WhenFull::Software,
        };

        assert!(matches!(
            choose(
                &spec("h264_qsv", HardwareAccel::Qsv),
                &placement,
                &candidates
            ),
            Choice::On {
                accel: HardwareAccel::Qsv,
                ..
            }
        ));
    }

    /// A session the server sent to software, or one that copies, is left where it is.
    #[test]
    fn leaves_software_and_copies_alone() {
        let (rtx, nvenc) = (rtx(), nvenc());
        let candidates = [Candidate {
            device: &rtx,
            capabilities: &nvenc,
            streams: 0,
        }];
        let placement = Placement {
            devices: vec![rule("rtx", None)],
            when_full: WhenFull::Software,
        };
        let mut copy = spec("h264_nvenc", HardwareAccel::Nvenc);
        copy.video = VideoAction::Copy;

        assert_eq!(
            choose(
                &spec("libx264", HardwareAccel::None),
                &placement,
                &candidates
            ),
            Choice::Unchanged
        );
        assert_eq!(choose(&copy, &placement, &candidates), Choice::Unchanged);
    }

    /// A device the operator switched off, or one not checked yet, is never chosen.
    #[test]
    fn chooses_only_devices_it_was_given() {
        let (rtx, nvenc) = (rtx(), nvenc());
        let candidates = [Candidate {
            device: &rtx,
            capabilities: &nvenc,
            streams: 0,
        }];
        let placement = Placement {
            devices: vec![rule("radeon", None)],
            when_full: WhenFull::Software,
        };

        assert_eq!(
            choose(
                &spec("h264_nvenc", HardwareAccel::Nvenc),
                &placement,
                &candidates
            ),
            Choice::Unchanged
        );
    }

    /// Placed on a device, a session encodes with that device's encoder and nothing else changes.
    #[test]
    fn swaps_only_the_encoder() {
        let placed = on_device(
            &spec("h264_nvenc", HardwareAccel::Nvenc),
            HardwareAccel::Vaapi,
            "h264_vaapi",
        );

        assert_eq!(placed.hardware_accel, HardwareAccel::Vaapi);
        assert!(matches!(
            placed.video,
            VideoAction::Encode { ref encoder, max_bitrate_kbps: 8000, .. } if encoder == "h264_vaapi"
        ));
    }

    /// Encoders are matched to codecs through the list Valence drives.
    #[test]
    fn knows_what_an_encoder_makes() {
        assert_eq!(codec_of("hevc_vaapi"), Some("hevc"));
        assert_eq!(codec_of("nonsense"), None);
    }

    /// The server's shape reads, with software as the default for a full machine.
    #[test]
    fn reads_what_the_server_sends() {
        let placement: Placement = serde_json::from_str(
            r#"{"devices":[{"id":"pci:0000:01:00.0","maxStreams":4},{"id":"pci:0000:7a:00.0"}]}"#,
        )
        .expect("placement");

        assert_eq!(placement.devices[0].max_streams, Some(4));
        assert_eq!(placement.devices[1].max_streams, None);
        assert_eq!(placement.when_full, WhenFull::Software);
    }
}
