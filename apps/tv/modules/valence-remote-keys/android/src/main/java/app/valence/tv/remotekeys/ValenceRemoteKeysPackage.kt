package app.valence.tv.remotekeys

import android.app.Activity
import android.content.Context
import android.os.Bundle
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityLifecycleListener

/** Has the television's window hear the remote even while nothing in it has the remote's focus. */
class ValenceRemoteKeysPackage : Package {
  override fun createReactActivityLifecycleListeners(
    activityContext: Context,
  ): List<ReactActivityLifecycleListener> =
    listOf(
      object : ReactActivityLifecycleListener {
        override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
          HeardWithoutFocus.keep(activity)
        }
      },
    )
}
