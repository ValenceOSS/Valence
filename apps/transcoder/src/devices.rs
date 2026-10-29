//! The graphics devices on this machine, each as something a session can be given.
//!
//! A machine is not one card. An RTX 5080 beside a Ryzen's integrated Radeon is two encoders
//! with two sets of sessions, and until VAL-411 the second was never asked about: the transcoder
//! was pointed at one render node and probed every backend against it. This finds every device
//! there is, says which backends can drive each, and reads what each is doing, so that
//! [`crate::placement`] can put a session on whichever has room.
//!
//! An NVIDIA card is found through `nvidia-smi` and addressed by its `CUDA` number. An AMD or
//! Intel card is found in sysfs and addressed by its render node. Anything else this machine
//! proved — `VideoToolbox` on a Mac, `AMF` or `QSV` on Windows, where the adapter is chosen by
//! vendor rather than by a path — is a device of its own, opened the way it always was.

use serde::Serialize;

use crate::capability::Capabilities;
use crate::graphics::ask;
use crate::pci_names::CardId;
use crate::transcode_plan::{HardwareAccel, CUDA_PREFIX};

/// What `CUDA` is asked to number its cards by.
///
/// `CUDA` numbers the fastest card first unless told otherwise, and `nvidia-smi` numbers them in
/// the order they sit on the bus. On a machine with two different NVIDIA cards the two would
/// disagree, and a session placed on the card `nvidia-smi` called 1 would run on the other one.
/// Set before anything starts, so every `FFmpeg` this process runs inherits it.
pub const CUDA_ORDER: (&str, &str) = ("CUDA_DEVICE_ORDER", "PCI_BUS_ID");

/// Where the kernel lists the graphics devices.
const DRM: &str = "/sys/class/drm";

/// Who made a device.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Vendor {
    Nvidia,
    Amd,
    Intel,
    Apple,
    Other,
}

/// A graphics device a session can be placed on.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphicsDevice {
    /// What the device is known by, the same from one start to the next.
    ///
    /// A card's place on the bus where it has one, since render nodes are numbered in the order
    /// the drivers loaded and can swap between boots.
    pub id: String,
    pub name: String,
    pub vendor: Vendor,
    /// What a backend is pointed at to open it: a render node, or `cuda:` and a card's number.
    #[serde(skip)]
    pub node: String,
    /// The backends that can drive it, in the order they are preferred.
    pub accels: Vec<HardwareAccel>,
}

/// What a device is doing, as `GET /devices` reports it.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceReport {
    #[serde(flatten)]
    pub device: GraphicsDevice,
    /// Whether its own encoders have been checked yet.
    pub probed: bool,
    /// The encoders it proved, empty until it has been checked.
    pub encoders: Vec<String>,
    /// How many renders it held at once when its sessions were counted, nought until then.
    pub capacity: u32,
    /// The playback sessions placed on it that are encoding now.
    pub streams: u32,
    /// How busy it is, where the vendor will say: the encode block where it is reported apart,
    /// otherwise the device as a whole.
    pub busy_percent: Option<f32>,
}

/// A card's place on the bus, in the form sysfs writes it.
///
/// `nvidia-smi` writes eight digits of domain where sysfs writes four, and in capitals, so the
/// same card would otherwise have two ids depending on who found it.
#[must_use]
pub fn bus_address(said: &str) -> String {
    let said = said.trim().to_ascii_lowercase();

    match said.split_once(':') {
        Some((domain, rest)) if domain.len() > 4 => {
            format!("{}:{rest}", &domain[domain.len() - 4..])
        }
        _ => said,
    }
}

/// The NVIDIA cards `nvidia-smi` listed, from `index, name, pci.bus_id` lines.
#[must_use]
pub fn parse_nvidia_cards(output: &str) -> Vec<GraphicsDevice> {
    output
        .lines()
        .filter_map(|line| {
            let mut fields = line.split(',').map(str::trim);
            let (Some(index), Some(name), Some(bus)) =
                (fields.next(), fields.next(), fields.next())
            else {
                return None;
            };
            let index: u32 = index.parse().ok()?;

            Some(GraphicsDevice {
                id: format!("pci:{}", bus_address(bus)),
                name: name.to_owned(),
                vendor: Vendor::Nvidia,
                node: format!("{CUDA_PREFIX}{index}"),
                accels: vec![HardwareAccel::Nvenc],
            })
        })
        .collect()
}

/// The NVIDIA cards on this machine, or none where `nvidia-smi` is not here to say.
async fn nvidia_cards() -> Vec<GraphicsDevice> {
    ask(
        "nvidia-smi",
        &["--query-gpu=index,name,pci.bus_id", "--format=csv,noheader"],
    )
    .await
    .map(|output| parse_nvidia_cards(&output))
    .unwrap_or_default()
}

/// The backends that drive a vendor's card through its render node.
#[must_use]
pub fn render_node_accels(vendor: Vendor) -> Vec<HardwareAccel> {
    match vendor {
        Vendor::Amd => vec![HardwareAccel::Vaapi],
        Vendor::Intel => vec![HardwareAccel::Vaapi, HardwareAccel::Qsv],
        Vendor::Nvidia | Vendor::Apple | Vendor::Other => Vec::new(),
    }
}

/// Who made a card, from the number on the bus.
#[must_use]
pub fn vendor_of(number: u16) -> Vendor {
    match number {
        0x10de => Vendor::Nvidia,
        0x1002 | 0x1022 => Vendor::Amd,
        0x8086 => Vendor::Intel,
        _ => Vendor::Other,
    }
}

/// The number in a `0x`-prefixed sysfs attribute.
fn hex_attribute(text: &str) -> Option<u16> {
    u16::from_str_radix(text.trim().trim_start_matches("0x"), 16).ok()
}

/// The AMD and Intel cards with a render node, in the order of their nodes.
///
/// NVIDIA's render nodes are passed over: the card is driven through `CUDA`, which `nvidia-smi`
/// numbers, and a render node says nothing `NVENC` can use.
async fn render_node_cards() -> Vec<GraphicsDevice> {
    let Ok(mut entries) = tokio::fs::read_dir(DRM).await else {
        return Vec::new();
    };
    let mut nodes = Vec::new();

    while let Ok(Some(entry)) = entries.next_entry().await {
        let name = entry.file_name().to_string_lossy().into_owned();

        if name.starts_with("renderD") {
            nodes.push(name);
        }
    }

    nodes.sort();

    let mut cards = Vec::new();

    for node in nodes {
        let device = std::path::Path::new(DRM).join(&node).join("device");
        let (Ok(vendor), Ok(model)) = (
            tokio::fs::read_to_string(device.join("vendor")).await,
            tokio::fs::read_to_string(device.join("device")).await,
        ) else {
            continue;
        };
        let (Some(vendor_number), Some(model)) = (hex_attribute(&vendor), hex_attribute(&model))
        else {
            continue;
        };
        let vendor = vendor_of(vendor_number);
        let accels = render_node_accels(vendor);

        if accels.is_empty() {
            continue;
        }

        let bus = tokio::fs::canonicalize(&device)
            .await
            .ok()
            .and_then(|path| {
                path.file_name()
                    .map(|name| name.to_string_lossy().into_owned())
            });
        let named = tokio::fs::read_to_string(device.join("product_name"))
            .await
            .map(|name| name.trim().to_owned())
            .ok()
            .filter(|name| !name.is_empty());
        let name = match named {
            Some(name) => name,
            None => {
                crate::pci_names::name(CardId {
                    vendor: vendor_number,
                    device: model,
                })
                .await
            }
        };

        cards.push(GraphicsDevice {
            id: bus.map_or_else(|| node.clone(), |bus| format!("pci:{bus}")),
            name,
            vendor,
            node: format!("/dev/dri/{node}"),
            accels,
        });
    }

    cards
}

/// What to call a device this machine proved a backend on and nothing else could name.
#[must_use]
pub fn backend_device(accel: HardwareAccel, node: &str) -> GraphicsDevice {
    let (name, vendor) = match accel {
        HardwareAccel::Nvenc => ("NVIDIA graphics", Vendor::Nvidia),
        HardwareAccel::Amf => ("AMD graphics", Vendor::Amd),
        HardwareAccel::Qsv | HardwareAccel::Vaapi => ("Intel graphics", Vendor::Intel),
        HardwareAccel::VideoToolbox => ("Apple graphics", Vendor::Apple),
        HardwareAccel::Rkmpp => ("Rockchip graphics", Vendor::Other),
        HardwareAccel::MediaFoundation | HardwareAccel::None => ("Graphics", Vendor::Other),
    };

    GraphicsDevice {
        id: format!("accel:{accel:?}").to_lowercase(),
        name: name.to_owned(),
        vendor,
        node: node.to_owned(),
        accels: vec![accel],
    }
}

/// Every device, from the cards that were found and the backends the machine proved.
///
/// A backend the machine proved that no card found here can drive becomes a device of its own,
/// opened on the configured node the way every session was before: that is `VideoToolbox` on a
/// Mac, `AMF` and `QSV` on Windows, and whatever else a card was found that sysfs does not show.
#[must_use]
pub fn gather(
    found: Vec<GraphicsDevice>,
    proved: &[HardwareAccel],
    node: &str,
) -> Vec<GraphicsDevice> {
    let mut devices = found;

    for accel in proved {
        if *accel == HardwareAccel::None
            || devices.iter().any(|device| device.accels.contains(accel))
        {
            continue;
        }

        devices.push(backend_device(*accel, node));
    }

    devices
}

/// Every graphics device on this machine.
///
/// `capabilities` is what the configured device proved, which is what names a backend no card
/// here could be found for.
pub async fn discover(capabilities: &Capabilities, node: &str) -> Vec<GraphicsDevice> {
    let mut found = nvidia_cards().await;

    found.extend(render_node_cards().await);

    gather(found, &capabilities.hardware_accels, node)
}

/// How busy each NVIDIA card is, by id, from `pci.bus_id, utilization.encoder, utilization.gpu`
/// lines: the encode block where the card reports it, the card where it does not.
#[must_use]
pub fn parse_nvidia_use(output: &str) -> Vec<(String, f32)> {
    output
        .lines()
        .filter_map(|line| {
            let mut fields = line.split(',').map(str::trim);
            let (Some(bus), Some(encoder), Some(whole)) =
                (fields.next(), fields.next(), fields.next())
            else {
                return None;
            };
            let busy = encoder.parse().ok().or_else(|| whole.parse().ok())?;

            Some((format!("pci:{}", bus_address(bus)), busy))
        })
        .collect()
}

/// How busy each device is, where its vendor will say.
pub async fn read_use(devices: &[GraphicsDevice]) -> Vec<(String, f32)> {
    let mut readings = Vec::new();

    if devices.iter().any(|device| device.vendor == Vendor::Nvidia) {
        if let Ok(output) = ask(
            "nvidia-smi",
            &[
                "--query-gpu=pci.bus_id,utilization.encoder,utilization.gpu",
                "--format=csv,noheader,nounits",
            ],
        )
        .await
        {
            readings.extend(parse_nvidia_use(&output));
        }
    }

    for device in devices {
        let Some(node) = device.node.strip_prefix("/dev/dri/") else {
            continue;
        };
        let busy = std::path::Path::new(DRM)
            .join(node)
            .join("device")
            .join("gpu_busy_percent");

        if let Ok(said) = tokio::fs::read_to_string(busy).await {
            if let Ok(percent) = said.trim().parse() {
                readings.push((device.id.clone(), percent));
            }
        }
    }

    readings
}

#[cfg(test)]
mod tests {
    use super::{
        backend_device, bus_address, gather, parse_nvidia_cards, parse_nvidia_use,
        render_node_accels, vendor_of, GraphicsDevice, Vendor,
    };
    use crate::transcode_plan::HardwareAccel;

    fn radeon() -> GraphicsDevice {
        GraphicsDevice {
            id: "pci:0000:7a:00.0".to_owned(),
            name: "AMD Radeon Graphics".to_owned(),
            vendor: Vendor::Amd,
            node: "/dev/dri/renderD129".to_owned(),
            accels: vec![HardwareAccel::Vaapi],
        }
    }

    /// `nvidia-smi` and sysfs write the same card's place differently, and it has to be one id.
    #[test]
    fn writes_a_bus_address_the_way_sysfs_does() {
        assert_eq!(bus_address("00000000:01:00.0"), "0000:01:00.0");
        assert_eq!(bus_address("0000:7A:00.0"), "0000:7a:00.0");
    }

    /// Each card is addressed by its `CUDA` number, which is what `-gpu` and `-hwaccel_device`
    /// take.
    #[test]
    fn reads_the_nvidia_cards() {
        let cards = parse_nvidia_cards(
            "0, NVIDIA GeForce RTX 5080, 00000000:01:00.0\n1, NVIDIA RTX A2000, 00000000:02:00.0\n",
        );

        assert_eq!(cards.len(), 2);
        assert_eq!(cards[0].id, "pci:0000:01:00.0");
        assert_eq!(cards[0].name, "NVIDIA GeForce RTX 5080");
        assert_eq!(cards[1].node, "cuda:1");
        assert_eq!(cards[1].accels, vec![HardwareAccel::Nvenc]);
    }

    /// A line that is not a card is passed over rather than misread.
    #[test]
    fn passes_over_what_is_not_a_card() {
        assert_eq!(parse_nvidia_cards("No devices were found\n"), Vec::new());
    }

    /// Intel's render node drives `QSV` as well as `VAAPI`; AMD's drives `VAAPI` alone.
    #[test]
    fn says_which_backends_drive_a_render_node() {
        assert_eq!(
            render_node_accels(Vendor::Intel),
            vec![HardwareAccel::Vaapi, HardwareAccel::Qsv]
        );
        assert_eq!(render_node_accels(Vendor::Amd), vec![HardwareAccel::Vaapi]);
        assert_eq!(render_node_accels(Vendor::Nvidia), Vec::new());
        assert_eq!(vendor_of(0x1002), Vendor::Amd);
        assert_eq!(vendor_of(0x1af4), Vendor::Other);
    }

    /// A backend proved on a machine with no card found for it is a device of its own, opened
    /// on the configured node.
    #[test]
    fn makes_a_device_of_a_backend_no_card_was_found_for() {
        let devices = gather(
            Vec::new(),
            &[HardwareAccel::VideoToolbox],
            "/dev/dri/renderD128",
        );

        assert_eq!(devices.len(), 1);
        assert_eq!(devices[0].id, "accel:videotoolbox");
        assert_eq!(devices[0].vendor, Vendor::Apple);
        assert_eq!(devices[0].node, "/dev/dri/renderD128");
    }

    /// A backend a found card drives is not listed a second time.
    #[test]
    fn does_not_list_a_card_twice() {
        let devices = gather(
            vec![radeon()],
            &[HardwareAccel::Vaapi, HardwareAccel::None],
            "/dev/dri/renderD128",
        );

        assert_eq!(devices, vec![radeon()]);
    }

    /// Windows opens `AMF` by vendor, so an AMD card there is named for its backend.
    #[test]
    fn names_a_device_by_its_backend() {
        let device = backend_device(HardwareAccel::Amf, "");

        assert_eq!(device.id, "accel:amf");
        assert_eq!(device.vendor, Vendor::Amd);
    }

    /// The encode block is the figure that decides another stream, and the card stands in
    /// where the encode block is not reported.
    #[test]
    fn reads_how_busy_each_nvidia_card_is() {
        let readings = parse_nvidia_use("00000000:01:00.0, 37, 12\n00000000:02:00.0, [N/A], 64\n");

        assert_eq!(
            readings,
            vec![
                ("pci:0000:01:00.0".to_owned(), 37.0),
                ("pci:0000:02:00.0".to_owned(), 64.0)
            ]
        );
    }
}
