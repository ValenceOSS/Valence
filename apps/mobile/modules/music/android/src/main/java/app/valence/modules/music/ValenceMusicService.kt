package app.valence.modules.music

import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService

/**
 * Keeps music playing with the app closed and the phone locked, and shows what is playing on the
 * lock screen and in the notification shade with its buttons.
 *
 * The session it serves is the music module's own, so there is only ever one player; the service
 * is just what Android needs to be running for that player to carry on in the background.
 */
class ValenceMusicService : MediaSessionService() {
  override fun onCreate() {
    super.onCreate()
    TheSession.session?.let { addSession(it) }
  }

  override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = TheSession.session

  override fun onTaskRemoved(rootIntent: android.content.Intent?) {
    val player = TheSession.session?.player

    if (player == null || !player.playWhenReady) {
      stopSelf()
    }
  }
}
