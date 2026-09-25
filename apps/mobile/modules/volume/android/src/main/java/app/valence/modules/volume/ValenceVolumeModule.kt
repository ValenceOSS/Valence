package app.valence.modules.volume

import android.content.Context
import android.database.ContentObserver
import android.media.AudioManager
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.math.roundToInt

/**
 * The phone's media volume, for a slider drawn like the rest of the player.
 *
 * Android lets an app set it directly, so there is no hidden system slider as on an iPhone. It is
 * watched through the system settings, which change whenever the buttons on the side are pressed,
 * so the slider follows them.
 */
class ValenceVolumeModule : Module() {
  private val main = Handler(Looper.getMainLooper())
  private var watching: ContentObserver? = null

  private val audio: AudioManager?
    get() = appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as AudioManager?

  override fun definition() = ModuleDefinition {
    Name("ValenceVolume")

    Events("onVolume")

    Function("now") {
      loudness()
    }

    AsyncFunction("set") { to: Double ->
      val manager = audio ?: return@AsyncFunction
      val most = manager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)

      manager.setStreamVolume(
        AudioManager.STREAM_MUSIC,
        (to.coerceIn(0.0, 1.0) * most).roundToInt(),
        0,
      )
    }

    OnStartObserving {
      val observer = object : ContentObserver(main) {
        override fun onChange(selfChange: Boolean) {
          sendEvent("onVolume", mapOf("volume" to loudness()))
        }
      }

      appContext.reactContext?.contentResolver?.registerContentObserver(
        Settings.System.CONTENT_URI,
        true,
        observer,
      )
      watching = observer
    }

    OnStopObserving {
      watching?.let { appContext.reactContext?.contentResolver?.unregisterContentObserver(it) }
      watching = null
    }
  }

  /** How loud the media volume is, from nothing to everything. */
  private fun loudness(): Double {
    val manager = audio ?: return 1.0
    val most = manager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)

    return if (most == 0) 1.0 else manager.getStreamVolume(AudioManager.STREAM_MUSIC).toDouble() / most
  }
}
