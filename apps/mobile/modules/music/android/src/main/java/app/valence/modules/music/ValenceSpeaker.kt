package app.valence.modules.music

import android.content.Context
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
import androidx.media3.exoplayer.source.MediaSource

/**
 * One of the module's speakers: a player of its own, what it was last told to play, and how fast,
 * so a song and a book can each be loaded, paused and carried on without the other losing its
 * place.
 *
 * The file to play next can be lined up behind the one playing, and the player runs straight on
 * into it without a gap, saying it has advanced rather than that the last one ended. It is lined up
 * with the volume it plays at, so a song levelled quieter than the last is turned down as it starts.
 *
 * Where songs are to fade into each other, the last seconds of the one playing are heard from a
 * second player made ready at the place the fade starts, while the speaker itself moves on into the
 * next song and comes up as the other goes down. The speaker the lock screen reads never changes,
 * so it keeps telling and answering for whatever plays.
 */
@OptIn(UnstableApi::class)
internal class ValenceSpeaker(
  val channel: String,
  private val context: Context,
  private val say: (ValenceSpeaker, String) -> Unit,
) {
  val player: ExoPlayer = ExoPlayer.Builder(context)
    .setAudioAttributes(theAttributes(), true)
    .setHandleAudioBecomingNoisy(true)
    .setWakeMode(C.WAKE_MODE_NETWORK)
    .setSeekBackIncrementMs(15_000)
    .setSeekForwardIncrementMs(30_000)
    .build()

  private val main = Handler(Looper.getMainLooper())
  private var currentUrl = ""
  private var linedUrl = ""
  private var linedCookie: String? = null
  private var linedLoudness: Float? = null
  private var crossfadeMs = 0L
  private var tail: ExoPlayer? = null
  private var tailLoudness = 1f
  private var fadeStartMs = -1L
  private var fadeLengthMs = 0L
  private var isFadingOver = false
  private var fadeBeganAt = 0L

  private val watchingForTheFade = object : Runnable {
    override fun run() {
      if (fadeStartMs < 0) {
        return
      }

      val left = fadeStartMs - player.currentPosition

      if (left <= 20 && player.isPlaying) {
        beginTheFade()
      } else {
        main.postDelayed(this, if (left > 1_000) left - 500 else 20)
      }
    }
  }

  private val fadingOver = object : Runnable {
    override fun run() {
      val along = ((System.currentTimeMillis() - fadeBeganAt).toDouble() / fadeLengthMs).coerceIn(0.0, 1.0)

      player.volume = if (isMuted) 0f else loudness * Math.sin(along * Math.PI / 2).toFloat()
      tail?.volume = if (isMuted) 0f else tailLoudness * Math.cos(along * Math.PI / 2).toFloat()

      if (along >= 1.0) {
        finishTheFade()
      } else {
        main.postDelayed(this, 50)
      }
    }
  }

  var described = ATrackDescribed()
  var artwork: ByteArray? = null
  var cookie: String? = null
  private var loudness = 1f
  private var isMuted = false
  private var hasSaidReady = false
  private var isLinedUp = false

  /** Reports what the player does, in the events a browser's audio element would send. */
  private val watching = object : Player.Listener {
    override fun onPlaybackStateChanged(playbackState: Int) {
      when (playbackState) {
        Player.STATE_BUFFERING -> say(this@ValenceSpeaker, "waiting")
        Player.STATE_READY -> {
          if (!hasSaidReady) {
            hasSaidReady = true
            say(this@ValenceSpeaker, "loadedmetadata")
            say(this@ValenceSpeaker, "canplay")
          }

          armTheFade()
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

    override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
      val isOurs = reason == Player.MEDIA_ITEM_TRANSITION_REASON_AUTO ||
        (isFadingOver && reason == Player.MEDIA_ITEM_TRANSITION_REASON_SEEK)

      if (!isOurs || !isLinedUp) {
        return
      }

      isLinedUp = false
      currentUrl = linedUrl
      cookie = linedCookie ?: cookie
      linedLoudness?.let { loudness = it }
      linedLoudness = null

      if (!isFadingOver) {
        player.volume = if (isMuted) 0f else loudness
      }

      player.removeMediaItems(0, player.currentMediaItemIndex)
      say(this@ValenceSpeaker, "advanced")

      if (player.playbackState == Player.STATE_READY) {
        say(this@ValenceSpeaker, "loadedmetadata")
        say(this@ValenceSpeaker, "canplay")
      } else {
        hasSaidReady = false
      }
    }

    override fun onPositionDiscontinuity(
      oldPosition: Player.PositionInfo,
      newPosition: Player.PositionInfo,
      reason: Int,
    ) {
      if (reason == Player.DISCONTINUITY_REASON_SEEK && !isFadingOver) {
        say(this@ValenceSpeaker, "seeked")
        disarmTheFade()
        armTheFade()
      }
    }
  }

  init {
    player.addListener(watching)
  }

  /** Starts on a new file, forgetting the last one and any lined up after it. */
  fun load(url: String, cookie: String?) {
    finishTheFade()
    disarmTheFade()
    this.cookie = cookie
    currentUrl = url
    hasSaidReady = false
    isLinedUp = false
    player.setMediaSource(sourceFor(url, cookie))
    player.prepare()
    say(this, "waiting")
  }

  /**
   * Lines up the file to play once this one ends, in place of any lined up before, or none, and how
   * loud it plays. The same file lined up again only changes how loud it plays.
   */
  fun lineUp(url: String, cookie: String?, volume: Double?) {
    if (isLinedUp && url.isNotEmpty() && url == linedUrl) {
      linedLoudness = volume?.coerceIn(0.0, 1.0)?.toFloat()
      return
    }

    disarmTheFade()
    linedUrl = url
    linedCookie = cookie
    linedLoudness = volume?.coerceIn(0.0, 1.0)?.toFloat()

    val after = player.currentMediaItemIndex + 1

    if (after < player.mediaItemCount) {
      player.removeMediaItems(after, player.mediaItemCount)
    }

    isLinedUp = false

    if (url.isEmpty() || player.mediaItemCount == 0) {
      return
    }

    player.addMediaSource(sourceFor(url, cookie))
    isLinedUp = true
    armTheFade()
  }

  /** Sets how many seconds one song fades into the next, none playing them straight on. */
  fun setCrossfade(seconds: Double) {
    crossfadeMs = (seconds.coerceIn(0.0, 12.0) * 1000).toLong()
    disarmTheFade()
    armTheFade()
  }

  /** Pauses, cutting any fade short so the song before does not play on by itself. */
  fun pause() {
    finishTheFade()
    player.pause()
  }

  /** The way this speaker's sound is described to the phone: speech for a book, music otherwise. */
  private fun theAttributes(): AudioAttributes =
    AudioAttributes.Builder()
      .setUsage(C.USAGE_MEDIA)
      .setContentType(if (channel == "book") C.AUDIO_CONTENT_TYPE_SPEECH else C.AUDIO_CONTENT_TYPE_MUSIC)
      .build()

  /**
   * Makes the end of the song playing ready to fade out from a second player, and watches for the
   * moment the fade starts — where songs fade into each other, the next is lined up, the song is long
   * enough and has not already passed that moment. The second player never takes the phone's audio
   * from the first.
   */
  private fun armTheFade() {
    val duration = player.duration

    if (crossfadeMs <= 0 || fadeStartMs >= 0 || !isLinedUp || currentUrl.isEmpty() || duration == C.TIME_UNSET || duration <= 0) {
      return
    }

    val length = minOf(crossfadeMs, duration / 3)
    val start = duration - length

    if (player.currentPosition >= start - 500) {
      return
    }

    val made = tail ?: ExoPlayer.Builder(context).setAudioAttributes(theAttributes(), false).build()

    made.setMediaSource(sourceFor(currentUrl, cookie))
    made.prepare()
    made.seekTo(start)
    made.volume = 0f
    made.playWhenReady = false
    tail = made
    fadeStartMs = start
    fadeLengthMs = length
    main.post(watchingForTheFade)
  }

  /** Stops watching for a fade, and lets go of the end made ready for it. */
  private fun disarmTheFade() {
    main.removeCallbacks(watchingForTheFade)
    fadeStartMs = -1

    if (!isFadingOver) {
      tail?.stop()
    }
  }

  /**
   * Fades the song playing out from the second player while the speaker moves on into the next and
   * comes up, each along a quarter of a circle so the two together stay as loud as one.
   */
  private fun beginTheFade() {
    val playing = tail

    fadeStartMs = -1

    if (playing == null || !isLinedUp) {
      return
    }

    tailLoudness = loudness
    playing.volume = if (isMuted) 0f else tailLoudness
    playing.setPlaybackSpeed(player.playbackParameters.speed)
    playing.play()
    isFadingOver = true
    player.volume = 0f
    player.seekToNextMediaItem()
    fadeBeganAt = System.currentTimeMillis()
    main.post(fadingOver)
  }

  /** Ends a fade at once: the song before stops, and the one playing is heard at its own volume. */
  private fun finishTheFade() {
    main.removeCallbacks(fadingOver)

    if (isFadingOver) {
      isFadingOver = false
      tail?.stop()
    }

    player.volume = if (isMuted) 0f else loudness
  }

  /** A file to play, asked for with the session it was given. */
  private fun sourceFor(url: String, cookie: String?): MediaSource {
    val http = DefaultHttpDataSource.Factory().setAllowCrossProtocolRedirects(true)

    if (cookie != null) {
      http.setDefaultRequestProperties(mapOf("Cookie" to cookie))
    }

    return DefaultMediaSourceFactory(DefaultDataSource.Factory(context, http))
      .createMediaSource(MediaItem.Builder().setUri(Uri.parse(url)).setMediaMetadata(theMetadata()).build())
  }

  /** Moves to a place in the file, cutting short any fade. */
  fun seek(seconds: Double) {
    finishTheFade()
    player.seekTo((seconds.coerceAtLeast(0.0) * 1000).toLong())
  }

  /** Sets how fast it plays, keeping the voice at its own pitch. */
  fun setRate(rate: Double) {
    player.setPlaybackSpeed(rate.coerceIn(0.5, 3.0).toFloat())
  }

  /** Sets how loud it plays. */
  fun setVolume(volume: Double) {
    loudness = volume.coerceIn(0.0, 1.0).toFloat()

    if (!isFadingOver) {
      player.volume = if (isMuted) 0f else loudness
    }
  }

  /** Silences it, or lets it be heard again at its own volume. */
  fun setMuted(muted: Boolean) {
    isMuted = muted

    if (!isFadingOver) {
      player.volume = if (isMuted) 0f else loudness
    }
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
      player.replaceMediaItem(
        player.currentMediaItemIndex,
        current.buildUpon().setMediaMetadata(theMetadata()).build(),
      )
    }
  }

  /** Stops, and forgets the file. */
  fun stop() {
    finishTheFade()
    disarmTheFade()
    isLinedUp = false
    player.stop()
    player.clearMediaItems()
  }
}
