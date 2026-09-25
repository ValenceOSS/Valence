package app.valence.modules.music

import androidx.media3.session.MediaSession

/** The one media session this app has, shared by the music module and its service. */
internal object TheSession {
  var session: MediaSession? = null
}
