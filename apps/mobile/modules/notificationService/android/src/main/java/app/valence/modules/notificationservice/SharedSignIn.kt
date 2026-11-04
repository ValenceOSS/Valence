package app.valence.modules.notificationservice

import android.content.Context

/**
 * The server the phone is signed in to and the session it holds there, kept in the app's own
 * private preferences so the messaging service can read what a push woke the phone to say, as the
 * Apple side keeps them in a shared keychain group for its notification service extension.
 */
object SharedSignIn {
  data class Held(val address: String, val cookie: String)

  private const val FILE = "app.valence.signIn"

  private const val ADDRESS = "address"

  private const val COOKIE = "cookie"

  /** Keeps the server and session, in place of whatever was kept before. */
  fun write(context: Context, held: Held): Boolean =
    context.getSharedPreferences(FILE, Context.MODE_PRIVATE)
      .edit()
      .putString(ADDRESS, held.address)
      .putString(COOKIE, held.cookie)
      .commit()

  /** The server and session kept, or nothing where the phone is signed out. */
  fun read(context: Context): Held? {
    val kept = context.getSharedPreferences(FILE, Context.MODE_PRIVATE)
    val address = kept.getString(ADDRESS, null) ?: return null
    val cookie = kept.getString(COOKIE, null) ?: return null

    return Held(address, cookie)
  }

  /** Forgets the server and session, as the phone signs out. */
  fun forget(context: Context) {
    context.getSharedPreferences(FILE, Context.MODE_PRIVATE).edit().clear().commit()
  }
}
