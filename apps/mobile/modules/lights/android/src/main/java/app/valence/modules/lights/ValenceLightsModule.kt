package app.valence.modules.lights

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.HttpURLConnection
import java.net.URL
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Reads the colour round the edge of a book's page, for the paper it is laid on.
 *
 * The picture is fetched with whatever cookie it was handed, since the server only shows artwork
 * to somebody signed in, and decoded no larger than it needs to be to be read.
 */
class ValenceLightsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ValenceLights")

    AsyncFunction("readEdge") { url: String, cookie: String? ->
      fetched(url, cookie)?.let { edgeColour(it) }
    }
  }

  /** Fetches a picture and decodes it, shrunk by powers of two to something near the size read. */
  private fun fetched(url: String, cookie: String?): Bitmap? =
    try {
      val connection = URL(url).openConnection() as HttpURLConnection

      connection.connectTimeout = TIMEOUT
      connection.readTimeout = TIMEOUT
      cookie?.let { connection.setRequestProperty("Cookie", it) }

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

  /**
   * The colour most of the outermost pixels share — the paper a printed page is on, or the ink of
   * one that bleeds to its edge — rather than their average, which panel lines and gutters along the
   * edge would pull towards grey: the rim of the picture drawn small is sorted into buckets of like
   * colour, and the fullest bucket's pixels averaged.
   */
  private fun edgeColour(picture: Bitmap): String? {
    val side = EDGE_AT
    val small = Bitmap.createScaledBitmap(picture, side, side, false)
    val buckets = HashMap<Int, IntArray>()

    for (y in 0 until side) {
      for (x in 0 until side) {
        if (x < RIM || y < RIM || x >= side - RIM || y >= side - RIM) {
          val pixel = small.getPixel(x, y)
          val red = Color.red(pixel)
          val green = Color.green(pixel)
          val blue = Color.blue(pixel)
          val bucket = (red shr 4) shl 8 or ((green shr 4) shl 4) or (blue shr 4)
          val held = buckets.getOrPut(bucket) { IntArray(4) }

          held[0] += red
          held[1] += green
          held[2] += blue
          held[3] += 1
        }
      }
    }

    val fullest = buckets.values.maxByOrNull { it[3] } ?: return null

    return String.format(
      "#%02x%02x%02x",
      (fullest[0].toDouble() / fullest[3]).roundToInt(),
      (fullest[1].toDouble() / fullest[3]).roundToInt(),
      (fullest[2].toDouble() / fullest[3]).roundToInt(),
    )
  }

  private companion object {
    const val TIMEOUT = 15_000
    const val DECODED_AT_LEAST = 128
    const val EDGE_AT = 64
    const val RIM = 2
  }
}
