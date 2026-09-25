package app.valence.modules.music

import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import androidx.annotation.OptIn
import androidx.media3.common.C
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaSession
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

/**
 * What is playing, for the lock screen and the notification: a song, or a chapter of a book, and
 * the stretch of the file it covers where it is only part of one.
 */
class ATrackDescribed : Record {
  @Field var title: String = ""

  @Field var artist: String = ""

  @Field var album: String = ""

  @Field var artwork: String? = null

  @Field var from: Double? = null

  @Field var lasts: Double? = null
}

/**
 * Plays Valence's music and audiobooks the way they play on an Android phone: on after the app is
 * closed and the phone is locked, described on the lock screen and in the notification shade, and
 * answering their buttons and a pair of headphones.
 *
 * Music and books each have a speaker of their own, named by the channel every call gives, so
 * starting a book does not throw away the song that was loaded. Whichever last started playing is
 * the one the lock screen shows and answers for.
 *
 * As on an iPhone no queue and no chapters are kept here. These are only the speakers: each is told
 * what to play and reports what happens in the same events a browser's audio element sends, and
 * whatever the lock screen asks for is passed on, naming the channel it answers for, so the app can
 * decide what that means.
 */
@OptIn(UnstableApi::class)
class ValenceMusicModule : Module() {
  private val main = Handler(Looper.getMainLooper())
  private val fetching = Executors.newSingleThreadExecutor()
  private val speakers = mutableMapOf<String, ValenceSpeaker>()
  private val passedOn = mutableMapOf<String, ThePassedOnPlayer>()
  private var owner = "music"
  private var isTicking = false

  private val ticking = object : Runnable {
    override fun run() {
      speakers.values.filter { it.player.isPlaying }.forEach { heard(it, "timeupdate") }
      main.postDelayed(this, 500)
    }
  }

  private val context: Context?
    get() = appContext.reactContext?.applicationContext

  override fun definition() = ModuleDefinition {
    Name("ValenceMusic")

    Events("onAudio", "onRemote")

    OnDestroy {
      main.post { speakers.values.forEach { it.stop() } }
    }

    Function("load") { channel: String, url: String, cookie: String? ->
      main.post {
        speaker(channel)?.let {
          it.load(url, cookie)
          fetchTheArtwork(it)
        }
      }
    }

    Function("lineUp") { channel: String, url: String, cookie: String? ->
      main.post { speaker(channel)?.lineUp(url, cookie) }
    }

    Function("play") { channel: String ->
      main.post { play(channel) }
    }

    Function("pause") { channel: String ->
      main.post { speaker(channel)?.player?.pause() }
    }

    Function("seek") { channel: String, seconds: Double ->
      main.post { speaker(channel)?.seek(seconds) }
    }

    Function("setRate") { channel: String, rate: Double ->
      main.post { speaker(channel)?.setRate(rate) }
    }

    Function("setVolume") { channel: String, volume: Double ->
      main.post { speaker(channel)?.setVolume(volume) }
    }

    Function("setMuted") { channel: String, muted: Boolean ->
      main.post { speaker(channel)?.setMuted(muted) }
    }

    Function("describe") { channel: String, track: ATrackDescribed ->
      main.post { speaker(channel)?.let { describe(it, track) } }
    }

    Function("stop") { channel: String ->
      main.post { speaker(channel)?.stop() }
    }
  }

  /** The speaker for a channel, made the first time the channel is used. */
  private fun speaker(channel: String): ValenceSpeaker? {
    speakers[channel]?.let { return it }

    val context = context ?: return null
    val made = ValenceSpeaker(channel, context) { speaker, type -> heard(speaker, type) }

    speakers[channel] = made

    if (!isTicking) {
      isTicking = true
      main.post(ticking)
    }

    return made
  }

  /**
   * The speaker as the lock screen sees it, every button passed on for its channel. Android's bar
   * runs through the whole file, so where it moved to is told from the start of the stretch the app
   * described, as an iPhone's bar tells it.
   */
  private fun passedOnFor(speaker: ValenceSpeaker): ThePassedOnPlayer =
    passedOn.getOrPut(speaker.channel) {
      ThePassedOnPlayer(speaker.player, speaker.channel == "book") { command, seconds ->
        val told = if (command == "seek" && seconds != null) {
          seconds - (speaker.described.from ?: 0.0)
        } else {
          seconds
        }

        sendEvent(
          "onRemote",
          if (told == null) {
            mapOf("channel" to speaker.channel, "command" to command)
          } else {
            mapOf("channel" to speaker.channel, "command" to command, "seconds" to told)
          },
        )
      }
    }

  /**
   * Plays a channel, handing it the lock screen and starting the service first so it carries on in
   * the background.
   */
  private fun play(channel: String) {
    val context = context ?: return
    val speaker = speaker(channel) ?: return

    owner = channel
    takeTheLockScreen(context, speaker)
    runCatching { context.startService(Intent(context, ValenceMusicService::class.java)) }
    speaker.player.play()
  }

  /** Makes the one session the lock screen reads, or hands it to the speaker playing now. */
  private fun takeTheLockScreen(context: Context, speaker: ValenceSpeaker) {
    val shown = passedOnFor(speaker)
    val session = TheSession.session

    if (session != null) {
      if (session.player !== shown) {
        session.player = shown
      }

      return
    }

    val opening = context.packageManager.getLaunchIntentForPackage(context.packageName)
    val building = MediaSession.Builder(context, shown).setId("valence-music")

    if (opening != null) {
      building.setSessionActivity(
        android.app.PendingIntent.getActivity(
          context,
          0,
          opening,
          android.app.PendingIntent.FLAG_IMMUTABLE or android.app.PendingIntent.FLAG_UPDATE_CURRENT,
        ),
      )
    }

    TheSession.session = building.build()
  }

  /** Takes what a speaker plays, fetching its cover where that has changed. */
  private fun describe(speaker: ValenceSpeaker, track: ATrackDescribed) {
    val isNewArtwork = track.artwork != speaker.described.artwork

    speaker.described = track

    if (isNewArtwork) {
      speaker.artwork = null
      fetchTheArtwork(speaker)
    }

    speaker.tellTheLockScreen()
  }

  /** Tells the app what a speaker just did, with where it is. */
  private fun heard(speaker: ValenceSpeaker, type: String) {
    val duration = speaker.player.duration

    sendEvent(
      "onAudio",
      mapOf(
        "channel" to speaker.channel,
        "type" to type,
        "currentTime" to speaker.player.currentPosition.coerceAtLeast(0) / 1000.0,
        "duration" to if (duration == C.TIME_UNSET) -1.0 else duration / 1000.0,
        "paused" to !speaker.player.playWhenReady,
        "source" to (speaker.player.currentMediaItem?.localConfiguration?.uri?.toString() ?: ""),
      ),
    )
  }

  /** Fetches a speaker's cover for the lock screen, with the same session its file came with. */
  private fun fetchTheArtwork(speaker: ValenceSpeaker) {
    val wanted = speaker.described.artwork ?: return
    val withCookie = speaker.cookie

    if (speaker.artwork != null) {
      return
    }

    fetching.execute {
      val bytes = runCatching {
        val asking = URL(wanted).openConnection() as HttpURLConnection

        withCookie?.let { asking.setRequestProperty("Cookie", it) }
        asking.connectTimeout = 10_000
        asking.readTimeout = 10_000
        asking.inputStream.use { it.readBytes() }
      }.getOrNull() ?: return@execute

      main.post {
        if (speaker.described.artwork == wanted) {
          speaker.artwork = bytes
          speaker.tellTheLockScreen()
        }
      }
    }
  }
}
