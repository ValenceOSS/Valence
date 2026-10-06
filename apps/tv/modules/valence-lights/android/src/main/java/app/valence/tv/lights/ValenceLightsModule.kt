package app.valence.tv.lights

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.HttpURLConnection
import java.net.URL
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

private const val TIMEOUT_MS = 15_000

private const val DECODED_AT_LEAST = 128

private const val READ_AT = 24

private const val SPREAD = 1.9

private const val MIN_PEAK = 110.0

private val COLUMNS = listOf(8, 36, 64, 92)

private val ROWS = listOf(10, 48, 86)

/**
 * Reads the colours of a picture for the television to light a page with, as the phone's module
 * does on Android: the picture shrunk to a few pixels and cut into a grid four across and three
 * down, each part's average pushed away from grey and lifted out of the dark, with where on the page
 * it belongs. Android's own blur cannot soften a picture into a wash as tvOS's does, so the page is
 * lit with these instead.
 *
 * The picture is fetched signed as whoever is watching, since the server only shows artwork to
 * somebody signed in, and decoded no larger than it needs to be to be read.
 */
class ValenceLightsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ValenceLights")

    AsyncFunction("readLights") { url: String, headers: Map<String, String> ->
      fetched(url, headers)?.let { lights(it) } ?: emptyList()
    }
  }

  /** Fetches a picture and decodes it, shrunk by powers of two to something near the size read. */
  private fun fetched(url: String, headers: Map<String, String>): Bitmap? =
    try {
      val connection = URL(url).openConnection() as HttpURLConnection

      connection.connectTimeout = TIMEOUT_MS
      connection.readTimeout = TIMEOUT_MS
      headers.forEach { (name, value) -> connection.setRequestProperty(name, value) }

      try {
        if (connection.responseCode !in 200..299) {
          null
        } else {
          val bytes = connection.inputStream.use { it.readBytes() }
          val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }

          BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)

          var sample = 1

          while (min(bounds.outWidth, bounds.outHeight) / (sample * 2) >= DECODED_AT_LEAST) {
            sample *= 2
          }

          BitmapFactory.decodeByteArray(
            bytes,
            0,
            bytes.size,
            BitmapFactory.Options().apply { inSampleSize = sample },
          )
        }
      } finally {
        connection.disconnect()
      }
    } catch (_: Exception) {
      null
    }

  /** The lights a picture gives, each with where on the page it belongs. */
  private fun lights(picture: Bitmap): List<Map<String, String>> {
    val side = READ_AT
    val small = Bitmap.createScaledBitmap(picture, side, side, true)
    val found = mutableListOf<Map<String, String>>()

    ROWS.forEachIndexed { row, down ->
      COLUMNS.forEachIndexed { column, across ->
        val left = column * side / COLUMNS.size
        val top = row * side / ROWS.size
        val wide = max(1, side / COLUMNS.size)
        val high = max(1, side / ROWS.size)
        var red = 0.0
        var green = 0.0
        var blue = 0.0
        var counted = 0.0

        for (y in top until min(top + high, side)) {
          for (x in left until min(left + wide, side)) {
            val pixel = small.getPixel(x, y)

            if (Color.alpha(pixel) > 0) {
              red += Color.red(pixel)
              green += Color.green(pixel)
              blue += Color.blue(pixel)
              counted += 1
            }
          }
        }

        if (counted > 0) {
          val average = (red + green + blue) / (counted * 3)
          val lifted =
            listOf(red, green, blue).map { channel ->
              val pushed = (average + (channel / counted - average) * SPREAD).roundToInt()

              min(255.0, max(0.0, pushed.toDouble()))
            }
          val peak = lifted.max()
          val scale = if (peak == 0.0 || peak >= MIN_PEAK) 1.0 else MIN_PEAK / peak
          val lit = lifted.map { min(255.0, it * scale).roundToInt() }

          found.add(
            mapOf("colour" to "rgb(${lit[0]}, ${lit[1]}, ${lit[2]})", "at" to "$across% $down%"),
          )
        }
      }
    }

    return found
  }
}
