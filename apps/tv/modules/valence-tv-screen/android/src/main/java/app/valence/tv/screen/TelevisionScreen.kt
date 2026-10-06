package app.valence.tv.screen

import android.content.Context
import android.content.res.Configuration
import android.util.DisplayMetrics
import com.facebook.react.uimanager.DisplayMetricsHolder

private const val ACROSS = 1920

/**
 * Makes an Android TV's screen 1920 points across, as tvOS's is, whatever its pixels.
 *
 * The television app is laid out for a screen 1920 points wide, which is what tvOS gives it. Android
 * TV instead says how dense its pixels are, so a 1080p set at the density most of them report is
 * only 960 across and draws everything twice the size, and a 4K set another size again. The app and
 * its activity each take a configuration whose density comes from the screen's width, so every part
 * of React Native — layout, text, images and what it reports to TypeScript — sees the same 1920
 * points, and one layout serves both televisions without a second set of sizes.
 *
 * React Native converts sizes with the whole screen's measurements, which it reads from the display
 * itself rather than from the configuration, so it is handed the sized ones before it first looks
 * and again whenever the configuration changes.
 */
object TelevisionScreen {
  /**
   * The configuration that sizes a screen 1920 points across, keeping everything else about it.
   *
   * @param base The context whose screen is being sized.
   * @return The configuration to apply over it.
   */
  fun sizedFor(base: Context): Configuration {
    val metrics = base.resources.displayMetrics
    val widest = maxOf(metrics.widthPixels, metrics.heightPixels)

    return Configuration(base.resources.configuration).apply {
      if (widest > 0) {
        densityDpi = widest * DisplayMetrics.DENSITY_DEFAULT / ACROSS
      }
    }
  }

  /**
   * A context like the one given, whose screen is 1920 points across, for the application to be
   * built on.
   *
   * @param base The application's own context.
   * @return The context to build it on instead.
   */
  fun sized(base: Context): Context = base.createConfigurationContext(sizedFor(base))

  /**
   * Hands React Native the sized screen, for the window and the whole screen alike.
   *
   * @param context A context built on the sized configuration.
   */
  fun tellReactNative(context: Context) {
    val sized = DisplayMetrics().apply { setTo(context.resources.displayMetrics) }

    DisplayMetricsHolder.setWindowDisplayMetrics(sized)
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics().apply { setTo(sized) })
  }
}
