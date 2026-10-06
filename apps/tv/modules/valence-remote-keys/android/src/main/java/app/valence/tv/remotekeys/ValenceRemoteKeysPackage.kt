package app.valence.tv.remotekeys

import android.app.Activity
import android.content.Context
import android.os.Bundle
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityLifecycleListener

/**
 * Has the television's window hear the remote as tvOS does: even while nothing has the remote,
 * never on a list rather than what it holds, and back where it was when what had it goes away.
 */
class ValenceRemoteKeysPackage : Package {
  override fun createReactActivityLifecycleListeners(
    activityContext: Context,
  ): List<ReactActivityLifecycleListener> =
    listOf(
      object : ReactActivityLifecycleListener {
        override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
          HeardWithoutFocus.keep(activity)
          ScrollsPassFocusOn.keep(activity)
          FocusComesBack.keep(activity)
        }
      },
    )
}
