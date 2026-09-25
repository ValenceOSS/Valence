package app.valence.modules.music

import android.content.Context
import android.net.Uri
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

/**
 * One of the module's speakers: a player of its own, what it was last told to play, and how fast,
 * so a song and a book can each be loaded, paused and carried on without the other losing its
 * place.
 */
@OptIn(UnstableApi::class)
internal class ValenceSpeaker(
  val channel: String,
  private val context: Context,
  private val say: (ValenceSpeaker, String) -> Unit,
) {
  val player: ExoPlayer = ExoPlayer.Builder(context)
    .setAudioAttributes(
      AudioAttributes.Builder()
        .setUsage(C.USAGE_MEDIA)
        .setContentType(if (channel == "book") C.AUDIO_CONTENT_TYPE_SPEECH else C.AUDIO_CONTENT_TYPE_MUSIC)
        .build(),
      true,
    )
    .setHandleAudioBecomingNoisy(true)
    .setWakeMode(C.WAKE_MODE_NETWORK)
    .setSeekBackIncrementMs(15_000)
    .setSeekForwardIncrementMs(30_000)
    .build()

  var described = ATrackDescribed()
  var artwork: ByteArray? = null
  var cookie: String? = null
  private var loudness = 1f
  private var isMuted = false
  private var hasSaidReady = false

  /** Reports what the player does, in the events a browser's audio element would send. */
  private val watching = object : Player.Listener {
    override fun onPlaybackStateChanged(playbackState: Int) {
      when (playbackState) {
        Player.STATE_BUFFERING -> say(this@ValenceSpeaker, "waiting")
        Player.STATE_READY ->
          if (!hasSaidReady) {
            hasSaidReady = true
            say(this@ValenceSpeaker, "loadedmetadata")
            say(this@ValenceSpeaker, "canplay")
          }
        Player.STATE_ENDED -> say(this@ValenceSpeaker, "ended")
        else -> Unit
      }
    }

    override fun onIsPlayingChanged(isPlaying: Boolean) {
      if (isPlaying) {
        say(this@ValenceSpeaker, "playing")
      } else if (!player.playWhenReady) {
        say(this@ValenceSpeaker, "pause")
      }
    }

    override fun onPlayerError(error: PlaybackException) {
      say(this@ValenceSpeaker, "error")
    }

    override fun onPositionDiscontinuity(
      oldPosition: Player.PositionInfo,
      newPosition: Player.PositionInfo,
      reason: Int,
    ) {
      if (reason == Player.DISCONTINUITY_REASON_SEEK) {
        say(this@ValenceSpeaker, "seeked")
      }
    }
  }

  init {
    player.addListener(watching)
  }

  /** Starts on a new file, forgetting the last one. */
  fun load(url: String, cookie: String?) {
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
    say(this, "waiting")
  }

  /** Moves to a place in the file. */
  fun seek(seconds: Double) {
    player.seekTo((seconds.coerceAtLeast(0.0) * 1000).toLong())
  }

  /** Sets how fast it plays, keeping the voice at its own pitch. */
  fun setRate(rate: Double) {
    player.setPlaybackSpeed(rate.coerceIn(0.5, 3.0).toFloat())
  }

  /** Sets how loud it plays. */
  fun setVolume(volume: Double) {
    loudness = volume.coerceIn(0.0, 1.0).toFloat()
    player.volume = if (isMuted) 0f else loudness
  }

  /** Silences it, or lets it be heard again at its own volume. */
  fun setMuted(muted: Boolean) {
    isMuted = muted
    player.volume = if (isMuted) 0f else loudness
  }

  /** What the lock screen shows about what it plays, with its cover where that has arrived. */
  fun theMetadata(): MediaMetadata {
    val metadata = MediaMetadata.Builder()
      .setTitle(described.title)
      .setArtist(described.artist)
      .setAlbumTitle(described.album)

    artwork?.let { metadata.setArtworkData(it, MediaMetadata.PICTURE_TYPE_FRONT_COVER) }

    return metadata.build()
  }

  /** Puts what it plays on the lock screen, over whatever it said before. */
  fun tellTheLockScreen() {
    val current = player.currentMediaItem ?: return

    runCatching {
      player.replaceMediaItem(0, current.buildUpon().setMediaMetadata(theMetadata()).build())
    }
  }

  /** Stops, and forgets the file. */
  fun stop() {
    player.stop()
    player.clearMediaItems()
  }
}
