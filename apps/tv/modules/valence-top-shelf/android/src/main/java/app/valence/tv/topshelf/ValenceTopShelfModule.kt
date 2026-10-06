package app.valence.tv.topshelf

import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.media.tv.TvContract
import android.net.Uri
import android.os.Build
import androidx.annotation.RequiresApi
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

private const val TIMEOUT_MS = 10_000

private const val KEPT = "valence-top-shelf"

private const val CHANNEL = "channel"

private const val LOGO_SIZE = 320

private const val FIRE_TV = "amazon.hardware.fire_tv"

/** A title for the home screen, as JavaScript hands it over. */
class ShelfEntry : Record {
  @Field var id: String = ""
  @Field var title: String = ""
  @Field var kind: String = ""
  @Field var imageUrl: String = ""
}

/** A title somebody is part-way through, as JavaScript hands it over. */
class WatchingEntry : Record {
  @Field var id: String = ""
  @Field var title: String = ""
  @Field var kind: String = ""
  @Field var imageUrl: String = ""
  @Field var positionSeconds: Double = 0.0
  @Field var durationSeconds: Double = 0.0
  @Field var watchedAt: Double = 0.0
}

/**
 * Puts Valence's titles on the Android TV home screen, as the Top Shelf does on tvOS: the newest to
 * arrive in a row of Valence's own, and what somebody is part-way through in the system's Continue
 * Watching row, each opening its title in Valence when chosen.
 *
 * Each picture is fetched here, signed as whoever is watching, and kept in the app's files, where
 * the home screen reads it through the shelf's own read-only provider, since the home screen cannot
 * sign in to the server itself. Each time, what was there before is cleared and the rows written
 * again, so a title that has gone, or been finished, leaves the home screen too.
 *
 * A Fire TV's home screen shows an app's rows only once Amazon has certified it, and an Android TV
 * older than Android 8 has neither row, so on either nothing is written.
 */
class ValenceTopShelfModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ValenceTopShelf")

    AsyncFunction("publish") { entries: List<ShelfEntry>, headers: Map<String, String> ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
        return@AsyncFunction
      }

      val context = appContext.reactContext?.takeUnless { isFireTv(it) } ?: return@AsyncFunction
      val channel = channelOf(context) ?: return@AsyncFunction

      context.contentResolver.delete(TvContract.buildPreviewProgramsUriForChannel(channel), null, null)

      for (entry in entries) {
        val picture = fetched(context, entry.id, entry.imageUrl, headers) ?: continue
        val values = ContentValues().apply {
          put(TvContract.PreviewPrograms.COLUMN_CHANNEL_ID, channel)
          put(TvContract.PreviewPrograms.COLUMN_TYPE, typeOf(entry.kind))
          put(TvContract.PreviewPrograms.COLUMN_TITLE, entry.title)
          put(TvContract.PreviewPrograms.COLUMN_POSTER_ART_URI, picture.toString())
          put(
            TvContract.PreviewPrograms.COLUMN_POSTER_ART_ASPECT_RATIO,
            TvContract.PreviewPrograms.ASPECT_RATIO_16_9,
          )
          put(TvContract.PreviewPrograms.COLUMN_INTENT_URI, openingOf(entry.kind, entry.id))
          put(TvContract.PreviewPrograms.COLUMN_INTERNAL_PROVIDER_ID, entry.id)
        }

        context.contentResolver.insert(TvContract.PreviewPrograms.CONTENT_URI, values)
      }
    }

    AsyncFunction("continueWatching") { entries: List<WatchingEntry>, headers: Map<String, String> ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
        return@AsyncFunction
      }

      val context = appContext.reactContext?.takeUnless { isFireTv(it) } ?: return@AsyncFunction

      context.contentResolver.delete(TvContract.WatchNextPrograms.CONTENT_URI, null, null)

      for (entry in entries) {
        val picture = fetched(context, entry.id, entry.imageUrl, headers) ?: continue
        val values = ContentValues().apply {
          put(
            TvContract.WatchNextPrograms.COLUMN_WATCH_NEXT_TYPE,
            TvContract.WatchNextPrograms.WATCH_NEXT_TYPE_CONTINUE,
          )
          put(TvContract.WatchNextPrograms.COLUMN_TYPE, typeOf(entry.kind))
          put(TvContract.WatchNextPrograms.COLUMN_TITLE, entry.title)
          put(TvContract.WatchNextPrograms.COLUMN_POSTER_ART_URI, picture.toString())
          put(
            TvContract.WatchNextPrograms.COLUMN_POSTER_ART_ASPECT_RATIO,
            TvContract.WatchNextPrograms.ASPECT_RATIO_16_9,
          )
          put(
            TvContract.WatchNextPrograms.COLUMN_LAST_PLAYBACK_POSITION_MILLIS,
            (entry.positionSeconds * 1000).toInt(),
          )
          put(TvContract.WatchNextPrograms.COLUMN_DURATION_MILLIS, (entry.durationSeconds * 1000).toInt())
          put(
            TvContract.WatchNextPrograms.COLUMN_LAST_ENGAGEMENT_TIME_UTC_MILLIS,
            entry.watchedAt.toLong(),
          )
          put(TvContract.WatchNextPrograms.COLUMN_INTENT_URI, openingOf(entry.kind, entry.id))
          put(TvContract.WatchNextPrograms.COLUMN_INTERNAL_PROVIDER_ID, entry.id)
        }

        context.contentResolver.insert(TvContract.WatchNextPrograms.CONTENT_URI, values)
      }
    }
  }

  /** Whether this is a Fire TV, whose home screen takes no rows from an app Amazon has not certified. */
  private fun isFireTv(context: Context): Boolean = context.packageManager.hasSystemFeature(FIRE_TV)

  /** Valence's own row on the home screen, made the first time it is asked for, or nothing where the television keeps no rows. */
  @RequiresApi(Build.VERSION_CODES.O)
  private fun channelOf(context: Context): Long? {
    val kept = context.getSharedPreferences(KEPT, Context.MODE_PRIVATE)
    val known = kept.getLong(CHANNEL, -1L)

    if (known != -1L && exists(context, known)) {
      return known
    }

    val values = ContentValues().apply {
      put(TvContract.Channels.COLUMN_TYPE, TvContract.Channels.TYPE_PREVIEW)
      put(TvContract.Channels.COLUMN_DISPLAY_NAME, context.applicationInfo.loadLabel(context.packageManager).toString())
      put(TvContract.Channels.COLUMN_APP_LINK_INTENT_URI, "valence://open")
    }
    val made = runCatching { context.contentResolver.insert(TvContract.Channels.CONTENT_URI, values) }.getOrNull()
      ?: return null
    val channel = ContentUris.parseId(made)

    kept.edit().putLong(CHANNEL, channel).apply()
    storeTheLogo(context, channel)
    runCatching { TvContract.requestChannelBrowsable(context, channel) }

    return channel
  }

  /** Whether the home screen still has the row it was given. */
  private fun exists(context: Context, channel: Long): Boolean =
    runCatching {
      context.contentResolver.query(TvContract.buildChannelUri(channel), null, null, null, null)
        ?.use { it.moveToFirst() } ?: false
    }.getOrDefault(false)

  /** Gives the row Valence's icon. */
  private fun storeTheLogo(context: Context, channel: Long) {
    val icon = context.packageManager.getApplicationIcon(context.applicationInfo)
    val logo = Bitmap.createBitmap(LOGO_SIZE, LOGO_SIZE, Bitmap.Config.ARGB_8888)

    icon.setBounds(0, 0, LOGO_SIZE, LOGO_SIZE)
    icon.draw(Canvas(logo))
    runCatching {
      context.contentResolver.openOutputStream(TvContract.buildChannelLogoUri(channel))?.use {
        logo.compress(Bitmap.CompressFormat.PNG, 100, it)
      }
    }
  }

  /** Fetches a title's picture as whoever is watching, keeps it, and says where the home screen reads it. */
  private fun fetched(context: Context, id: String, address: String, headers: Map<String, String>): Uri? {
    val name = "${id.filter { it.isLetterOrDigit() || it == '-' }}.jpg"
    val kept = File(ShelfPictures.shelfIn(context.filesDir), name)

    return runCatching {
      val connection = URL(address).openConnection() as HttpURLConnection

      connection.connectTimeout = TIMEOUT_MS
      connection.readTimeout = TIMEOUT_MS
      headers.forEach { (header, value) -> connection.setRequestProperty(header, value) }

      try {
        if (connection.responseCode != HttpURLConnection.HTTP_OK) {
          return@runCatching null
        }

        connection.inputStream.use { body -> kept.outputStream().use { body.copyTo(it) } }
      } finally {
        connection.disconnect()
      }

      Uri.parse("content://${context.packageName}.topshelf/$name")
    }.getOrNull()
  }

  /** The kind of programme the home screen is told a title is. */
  private fun typeOf(kind: String): Int =
    if (kind == "show") TvContract.PreviewPrograms.TYPE_TV_SERIES else TvContract.PreviewPrograms.TYPE_MOVIE

  /** The link that opens a title in Valence, as the Top Shelf's does. */
  private fun openingOf(kind: String, id: String): String = "valence://open/$kind/$id"
}
