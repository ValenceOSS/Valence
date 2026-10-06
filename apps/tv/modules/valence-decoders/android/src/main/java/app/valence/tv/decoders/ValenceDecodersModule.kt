package app.valence.tv.decoders

import android.content.Context
import android.hardware.display.DisplayManager
import android.media.AudioDeviceInfo
import android.media.AudioFormat
import android.media.AudioManager
import android.media.MediaCodecInfo
import android.media.MediaCodecInfo.CodecProfileLevel
import android.media.MediaCodecList
import android.os.Build
import android.view.Display
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private val VIDEO = mapOf(
  "video/avc" to "h264",
  "video/hevc" to "hevc",
  "video/av01" to "av1",
  "video/x-vnd.on2.vp9" to "vp9",
  "video/mpeg2" to "mpeg2",
  "video/dolby-vision" to "dolbyvision",
)

private val AUDIO = mapOf(
  "audio/mp4a-latm" to "aac",
  "audio/ac3" to "ac3",
  "audio/eac3" to "eac3",
  "audio/eac3-joc" to "eac3",
  "audio/vnd.dts" to "dts",
  "audio/vnd.dts.hd" to "dts",
  "audio/true-hd" to "truehd",
  "audio/opus" to "opus",
  "audio/flac" to "flac",
  "audio/mpeg" to "mp3",
  "audio/vorbis" to "vorbis",
)

private val PASSED_THROUGH = mapOf(
  AudioFormat.ENCODING_AC3 to "ac3",
  AudioFormat.ENCODING_E_AC3 to "eac3",
  AudioFormat.ENCODING_E_AC3_JOC to "eac3",
  AudioFormat.ENCODING_DTS to "dts",
  AudioFormat.ENCODING_DTS_HD to "dts",
  AudioFormat.ENCODING_DOLBY_TRUEHD to "truehd",
)

private val HDMI = setOf(
  AudioDeviceInfo.TYPE_HDMI,
  AudioDeviceInfo.TYPE_HDMI_ARC,
  AudioDeviceInfo.TYPE_HDMI_EARC,
)

private val AVC_LEVELS = mapOf(
  CodecProfileLevel.AVCLevel1 to 10,
  CodecProfileLevel.AVCLevel1b to 9,
  CodecProfileLevel.AVCLevel11 to 11,
  CodecProfileLevel.AVCLevel12 to 12,
  CodecProfileLevel.AVCLevel13 to 13,
  CodecProfileLevel.AVCLevel2 to 20,
  CodecProfileLevel.AVCLevel21 to 21,
  CodecProfileLevel.AVCLevel22 to 22,
  CodecProfileLevel.AVCLevel3 to 30,
  CodecProfileLevel.AVCLevel31 to 31,
  CodecProfileLevel.AVCLevel32 to 32,
  CodecProfileLevel.AVCLevel4 to 40,
  CodecProfileLevel.AVCLevel41 to 41,
  CodecProfileLevel.AVCLevel42 to 42,
  CodecProfileLevel.AVCLevel5 to 50,
  CodecProfileLevel.AVCLevel51 to 51,
  CodecProfileLevel.AVCLevel52 to 52,
  CodecProfileLevel.AVCLevel6 to 60,
  CodecProfileLevel.AVCLevel61 to 61,
  CodecProfileLevel.AVCLevel62 to 62,
)

private val HEVC_LEVELS = mapOf(
  CodecProfileLevel.HEVCMainTierLevel1 to 30,
  CodecProfileLevel.HEVCHighTierLevel1 to 30,
  CodecProfileLevel.HEVCMainTierLevel2 to 60,
  CodecProfileLevel.HEVCHighTierLevel2 to 60,
  CodecProfileLevel.HEVCMainTierLevel21 to 63,
  CodecProfileLevel.HEVCHighTierLevel21 to 63,
  CodecProfileLevel.HEVCMainTierLevel3 to 90,
  CodecProfileLevel.HEVCHighTierLevel3 to 90,
  CodecProfileLevel.HEVCMainTierLevel31 to 93,
  CodecProfileLevel.HEVCHighTierLevel31 to 93,
  CodecProfileLevel.HEVCMainTierLevel4 to 120,
  CodecProfileLevel.HEVCHighTierLevel4 to 120,
  CodecProfileLevel.HEVCMainTierLevel41 to 123,
  CodecProfileLevel.HEVCHighTierLevel41 to 123,
  CodecProfileLevel.HEVCMainTierLevel5 to 150,
  CodecProfileLevel.HEVCHighTierLevel5 to 150,
  CodecProfileLevel.HEVCMainTierLevel51 to 153,
  CodecProfileLevel.HEVCHighTierLevel51 to 153,
  CodecProfileLevel.HEVCMainTierLevel52 to 156,
  CodecProfileLevel.HEVCHighTierLevel52 to 156,
  CodecProfileLevel.HEVCMainTierLevel6 to 180,
  CodecProfileLevel.HEVCHighTierLevel6 to 180,
  CodecProfileLevel.HEVCMainTierLevel61 to 183,
  CodecProfileLevel.HEVCHighTierLevel61 to 183,
  CodecProfileLevel.HEVCMainTierLevel62 to 186,
  CodecProfileLevel.HEVCHighTierLevel62 to 186,
)

private val TEN_BIT_PROFILES = mapOf(
  "hevc" to setOf(
    CodecProfileLevel.HEVCProfileMain10,
    CodecProfileLevel.HEVCProfileMain10HDR10,
    CodecProfileLevel.HEVCProfileMain10HDR10Plus,
  ),
  "av1" to setOf(
    CodecProfileLevel.AV1ProfileMain10,
    CodecProfileLevel.AV1ProfileMain10HDR10,
    CodecProfileLevel.AV1ProfileMain10HDR10Plus,
  ),
  "vp9" to setOf(
    CodecProfileLevel.VP9Profile2,
    CodecProfileLevel.VP9Profile2HDR,
    CodecProfileLevel.VP9Profile2HDR10Plus,
  ),
)

private val HDR = mapOf(
  Display.HdrCapabilities.HDR_TYPE_HDR10 to "HDR10",
  Display.HdrCapabilities.HDR_TYPE_HLG to "HLG",
  Display.HdrCapabilities.HDR_TYPE_HDR10_PLUS to "HDR10Plus",
  Display.HdrCapabilities.HDR_TYPE_DOLBY_VISION to "DolbyVision",
)

/**
 * Says what this television can play, read from the decoders it has, the screen it drives and what
 * it can pass through to a receiver, so TypeScript can tell the server exactly that rather than what
 * televisions in general manage.
 *
 * Android televisions are many boxes, and one box's decoders are not the next one's: a stick may
 * decode eight-bit HEVC and not ten, or no Dolby audio at all. Each decoder says which codecs it
 * takes, at which levels and profiles, and how large a picture; the screen says which kinds of HDR
 * it shows; and an HDMI output says which Dolby and DTS formats it hands on whole for the receiver
 * to decode. Nothing is decided here: the answer is passed up as it is read.
 */
class ValenceDecodersModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ValenceDecoders")

    Function("whatThisPlays") {
      val context = appContext.reactContext

      mapOf(
        "video" to videoDecoders(),
        "audio" to audioDecoders(),
        "passthrough" to context?.let { passedThrough(it) }.orEmpty(),
        "hdr" to context?.let { hdrShown(it) }.orEmpty(),
        "screen" to context?.let { screenSize(it) },
      )
    }
  }

  /** Every video codec a decoder here takes, with the highest level, whether it takes ten bits, and the largest picture. */
  private fun videoDecoders(): List<Map<String, Any?>> =
    decoders()
      .flatMap { info -> info.supportedTypes.mapNotNull { type -> VIDEO[type]?.let { it to info.getCapabilitiesForType(type) } } }
      .groupBy({ it.first }, { it.second })
      .map { (codec, every) ->
        val levels = every.flatMap { it.profileLevels.toList() }
        val sizes = every.mapNotNull { it.videoCapabilities }

        mapOf(
          "codec" to codec,
          "maxLevel" to levels.mapNotNull { levelOf(codec, it.level) }.maxOrNull(),
          "isTenBit" to levels.any { it.profile in TEN_BIT_PROFILES[codec].orEmpty() },
          "maxWidth" to sizes.maxOfOrNull { it.supportedWidths.upper },
          "maxHeight" to sizes.maxOfOrNull { it.supportedHeights.upper },
        )
      }

  /** Every audio codec a decoder here takes. */
  private fun audioDecoders(): List<String> =
    decoders().flatMap { info -> info.supportedTypes.mapNotNull { AUDIO[it] } }.distinct()

  /** The decoders this television has, without the names some of them go by twice. */
  private fun decoders(): List<MediaCodecInfo> =
    MediaCodecList(MediaCodecList.REGULAR_CODECS).codecInfos.filter {
      !it.isEncoder && (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q || !it.isAlias)
    }

  /** A codec's level as the server numbers it, from the flag Android gives it. */
  private fun levelOf(codec: String, level: Int): Int? =
    when (codec) {
      "h264" -> AVC_LEVELS[level]
      "hevc" -> HEVC_LEVELS[level]
      else -> null
    }

  /** The Dolby and DTS formats an HDMI output hands on whole, for a receiver to decode. */
  private fun passedThrough(context: Context): List<String> {
    val audio = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return emptyList()

    return audio.getDevices(AudioManager.GET_DEVICES_OUTPUTS)
      .filter { it.type in HDMI }
      .flatMap { device -> device.encodings.toList().mapNotNull { PASSED_THROUGH[it] } }
      .distinct()
  }

  /** The kinds of HDR the screen shows. */
  private fun hdrShown(context: Context): List<String> {
    val display = theDisplay(context) ?: return emptyList()
    val types =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        display.mode.supportedHdrTypes
      } else {
        @Suppress("DEPRECATION")
        display.hdrCapabilities?.supportedHdrTypes ?: IntArray(0)
      }

    return types.toList().mapNotNull { HDR[it] }.distinct()
  }

  /** The screen's own size in pixels, the largest of the modes it can be put in. */
  private fun screenSize(context: Context): Map<String, Int>? {
    val display = theDisplay(context) ?: return null
    val largest = display.supportedModes.maxByOrNull { it.physicalWidth * it.physicalHeight } ?: display.mode

    return mapOf("width" to largest.physicalWidth, "height" to largest.physicalHeight)
  }

  /** The screen the television draws on. */
  private fun theDisplay(context: Context): Display? =
    (context.getSystemService(Context.DISPLAY_SERVICE) as? DisplayManager)?.getDisplay(Display.DEFAULT_DISPLAY)
}
