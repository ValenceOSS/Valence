package app.valence.tv.screen

import android.app.Activity
import android.app.Application
import android.content.Context
import android.content.res.Configuration
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityLifecycleListener

/**
 * Keeps React Native told the television's sized screen: as the app starts, as it comes back to the
 * front, and as the configuration changes, each of which may have had it measure the display again.
 */
class ValenceTvScreenPackage : Package {
  override fun createApplicationLifecycleListeners(
    context: Context,
  ): List<ApplicationLifecycleListener> =
    listOf(
      object : ApplicationLifecycleListener {
        private var application: Application? = null

        override fun onCreate(application: Application) {
          this.application = application
          TelevisionScreen.tellReactNative(application)
        }

        override fun onConfigurationChanged(newConfig: Configuration) {
          application?.let { TelevisionScreen.tellReactNative(it) }
        }
      },
    )

  override fun createReactActivityLifecycleListeners(
    activityContext: Context,
  ): List<ReactActivityLifecycleListener> =
    listOf(
      object : ReactActivityLifecycleListener {
        override fun onResume(activity: Activity) {
          TelevisionScreen.tellReactNative(activity.application)
        }
      },
    )
}
