package app.valence.modules.music

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.os.Looper
import androidx.annotation.OptIn
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.session.MediaSession
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

/** What a track is called, for the lock screen and the notification. */
class ATrackDescribed : Record {
  @Field var title: String = ""

  @Field var artist: String = ""

  @Field var album: String = ""

  @Field var artwork: String? = null
}

/**
 * Plays Valence's music the way music plays on an Android phone: on after the app is closed and the
 * phone is locked, described on the lock screen and in the notification shade, and answering their
 * buttons and a pair of headphones.
 *
 * As on an iPhone the queue is not kept here. This is only the speaker: it is told what to play and
 * reports what happens in the same events a browser's audio element sends, and passes on whatever
 * the lock screen asks for so the app can decide what that means.
 */
@OptIn(UnstableApi::class)
class ValenceMusicModule : Module() {
  private val main = Handler(Looper.getMainLooper())
  private val fetching = Executors.newSingleThreadExecutor()
  private var player: ExoPlayer? = null
  private var described = ATrackDescribed()
  private var artwork: ByteArray? = null
  private var cookie: String? = null
  private var loudness = 1f
  private var isMuted = false
  private var hasSaidReady = false

  private val ticking = object : Runnable {
    override fun run() {
      if (player?.isPlaying == true) {
        send("timeupdate")
      }

      main.postDelayed(this, 500)
    }
  }

  private val context: Context?
    get() = appContext.reactContext?.applicationContext

  override fun definition() = ModuleDefinition {
    Name("ValenceMusic")

    Events("onAudio", "onRemote")

    OnDestroy {
      main.post { stopEverything() }
    }

    Function("load") { url: String, cookie: String? ->
      main.post { load(url, cookie) }
    }

    Function("play") {
      main.post { play() }
    }

    Function("pause") {
      main.post { player?.pause() }
    }

    Function("seek") { seconds: Double ->
      main.post { player?.seekTo((seconds.coerceAtLeast(0.0) * 1000).toLong()) }
    }

    Function("setVolume") { volume: Double ->
      main.post {
        loudness = volume.coerceIn(0.0, 1.0).toFloat()
        player?.volume = if (isMuted) 0f else loudness
      }
    }

    Function("setMuted") { muted: Boolean ->
      main.post {
        isMuted = muted
        player?.volume = if (isMuted) 0f else loudness
      }
    }

    Function("describe") { track: ATrackDescribed ->
      main.post { describe(track) }
    }

    Function("stop") {
      main.post { stopEverything() }
    }
  }

  /** The player, made the first time it is needed along with the session the lock screen reads. */
  private fun thePlayer(): ExoPlayer? {
    player?.let { return it }

    val context = context ?: return null
    val made = ExoPlayer.Builder(context)
      .setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(C.USAGE_MEDIA)
          .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
          .build(),
        true,
      )
      .setHandleAudioBecomingNoisy(true)
      .setWakeMode(C.WAKE_MODE_NETWORK)
      .build()

    made.addListener(watching)
    made.volume = if (isMuted) 0f else loudness
    player = made

    val passedOn = ThePassedOnPlayer(made) { command, seconds ->
      sendEvent("onRemote", if (seconds == null) mapOf("command" to command) else mapOf("command" to command, "seconds" to seconds))
    }
    val opening = context.packageManager.getLaunchIntentForPackage(context.packageName)
    val session = MediaSession.Builder(context, passedOn).setId("valence-music")

    if (opening != null) {
      session.setSessionActivity(
        android.app.PendingIntent.getActivity(
          context,
          0,
          opening,
          android.app.PendingIntent.FLAG_IMMUTABLE or android.app.PendingIntent.FLAG_UPDATE_CURRENT,
        ),
      )
    }

    TheSession.session = session.build()
    main.post(ticking)

    return made
  }

  /** Takes what the track is called, fetching its cover where that has changed. */
  private fun describe(track: ATrackDescribed) {
    val isNewArtwork = track.artwork != described.artwork

    described = track

    if (isNewArtwork) {
      artwork = null
      fetchTheArtwork()
    }

    tellTheLockScreen()
  }

  /** Starts on a new track, forgetting the last one. */
  private fun load(url: String, cookie: String?) {
    val context = context ?: return
    val player = thePlayer() ?: return
    val http = DefaultHttpDataSource.Factory().setAllowCrossProtocolRedirects(true)

    this.cookie = cookie

    if (cookie != null) {
      http.setDefaultRequestProperties(mapOf("Cookie" to cookie))
    }

    val source = DefaultMediaSourceFactory(DefaultDataSource.Factory(context, http))
      .createMediaSource(MediaItem.Builder().setUri(Uri.parse(url)).setMediaMetadata(theMetadata()).build())

    hasSaidReady = false
    player.setMediaSource(source)
    player.prepare()
    send("waiting")
  }

  /** Plays, starting the service first so it carries on in the background. */
  private fun play() {
    val context = context ?: return
    val player = thePlayer() ?: return

    runCatching { context.startService(Intent(context, ValenceMusicService::class.java)) }
    player.play()
  }

  /** Reports what the player does, in the events a browser's audio element would send. */
  private val watching = object : Player.Listener {
    override fun onPlaybackStateChanged(playbackState: Int) {
      when (playbackState) {
        Player.STATE_BUFFERING -> send("waiting")
        Player.STATE_READY ->
          if (!hasSaidReady) {
            hasSaidReady = true
            send("loadedmetadata")
            send("canplay")
          }
        Player.STATE_ENDED -> send("ended")
        else -> Unit
      }
    }

    override fun onIsPlayingChanged(isPlaying: Boolean) {
      if (isPlaying) {
        send("playing")
      } else if (player?.playWhenReady == false) {
        send("pause")
      }
    }

    override fun onPlayerError(error: PlaybackException) {
      send("error")
    }

    override fun onPositionDiscontinuity(
      oldPosition: Player.PositionInfo,
      newPosition: Player.PositionInfo,
      reason: Int,
    ) {
      if (reason == Player.DISCONTINUITY_REASON_SEEK) {
        send("seeked")
      }
    }
  }

  /** Tells the app what just happened, with where the player is. */
  private fun send(type: String) {
    val player = player ?: return
    val duration = player.duration

    sendEvent(
      "onAudio",
      mapOf(
        "type" to type,
        "currentTime" to player.currentPosition.coerceAtLeast(0) / 1000.0,
        "duration" to if (duration == C.TIME_UNSET) -1.0 else duration / 1000.0,
        "paused" to !player.playWhenReady,
      ),
    )
  }

  /** What the lock screen shows about the track, with its cover where that has arrived. */
  private fun theMetadata(): MediaMetadata {
    val metadata = MediaMetadata.Builder()
      .setTitle(described.title)
      .setArtist(described.artist)
      .setAlbumTitle(described.album)

    artwork?.let { metadata.setArtworkData(it, MediaMetadata.PICTURE_TYPE_FRONT_COVER) }

    return metadata.build()
  }

  /** Puts what is playing on the lock screen, over whatever it said before. */
  private fun tellTheLockScreen() {
    val player = player ?: return
    val current = player.currentMediaItem ?: return

    runCatching {
      player.replaceMediaItem(0, current.buildUpon().setMediaMetadata(theMetadata()).build())
    }
  }

  /** Fetches the album's cover for the lock screen, with the same session the track came with. */
  private fun fetchTheArtwork() {
    val wanted = described.artwork ?: return
    val withCookie = cookie

    fetching.execute {
      val bytes = runCatching {
        val asking = URL(wanted).openConnection() as HttpURLConnection

        withCookie?.let { asking.setRequestProperty("Cookie", it) }
        asking.connectTimeout = 10_000
        asking.readTimeout = 10_000
        asking.inputStream.use { it.readBytes() }
      }.getOrNull() ?: return@execute

      main.post {
        if (described.artwork == wanted) {
          artwork = bytes
          tellTheLockScreen()
        }
      }
    }
  }

  /** Stops playing, and takes Valence off the lock screen. */
  private fun stopEverything() {
    player?.stop()
    player?.clearMediaItems()
  }
}
