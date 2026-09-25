package app.valence.modules.nearby

import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.os.Build
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.Inet4Address

/**
 * Browses the local network for Valence servers announcing themselves over DNS-SD, and says where
 * each one answers, as the Apple side does with Bonjour.
 *
 * An announcement names a service rather than an address, so each one is resolved, one at a time
 * since older Androids refuse a second resolve while one is running, and only its IPv4 address is
 * reported, as that is what somebody would type.
 */
class ValenceNearbyModule : Module() {
  private val main = Handler(Looper.getMainLooper())
  private var manager: NsdManager? = null
  private var listening: NsdManager.DiscoveryListener? = null
  private val found = mutableMapOf<String, Map<String, Any>>()
  private val waiting = ArrayDeque<NsdServiceInfo>()
  private var isResolving = false

  override fun definition() = ModuleDefinition {
    Name("ValenceNearby")

    Events("onChange")

    Function("start") { type: String ->
      main.post { start(type) }
    }

    Function("stop") {
      main.post { stop() }
    }

    OnDestroy {
      main.post { stop() }
    }
  }

  /** Starts browsing for one kind of service, forgetting anything found before. */
  private fun start(type: String) {
    stop()

    val context = appContext.reactContext ?: return
    val nsd = context.getSystemService(Context.NSD_SERVICE) as NsdManager
    val discovery = object : NsdManager.DiscoveryListener {
      override fun onDiscoveryStarted(serviceType: String) = Unit

      override fun onDiscoveryStopped(serviceType: String) = Unit

      override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) = Unit

      override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) = Unit

      override fun onServiceFound(service: NsdServiceInfo) {
        main.post { queue(service) }
      }

      override fun onServiceLost(service: NsdServiceInfo) {
        main.post {
          found.remove(service.serviceName)
          tell()
        }
      }
    }

    manager = nsd
    listening = discovery
    nsd.discoverServices("_$type._tcp", NsdManager.PROTOCOL_DNS_SD, discovery)
  }

  /** Stops browsing, and forgets what was found. */
  private fun stop() {
    listening?.let { discovery -> runCatching { manager?.stopServiceDiscovery(discovery) } }
    listening = null
    manager = null
    waiting.clear()
    isResolving = false
    found.clear()
  }

  /** Puts a newly heard service in line to be resolved, unless it already has been. */
  private fun queue(service: NsdServiceInfo) {
    if (found.containsKey(service.serviceName) || waiting.any { it.serviceName == service.serviceName }) {
      return
    }

    waiting.addLast(service)
    resolveNext()
  }

  /** Resolves the next service in line, where none is being resolved already. */
  @Suppress("DEPRECATION")
  private fun resolveNext() {
    val nsd = manager ?: return

    if (isResolving) {
      return
    }

    val service = waiting.removeFirstOrNull() ?: return

    isResolving = true
    nsd.resolveService(service, object : NsdManager.ResolveListener {
      override fun onResolveFailed(serviceInfo: NsdServiceInfo, errorCode: Int) {
        main.post {
          isResolving = false
          resolveNext()
        }
      }

      override fun onServiceResolved(serviceInfo: NsdServiceInfo) {
        main.post {
          isResolving = false
          addressOf(serviceInfo)?.let { host ->
            found[serviceInfo.serviceName] =
              mapOf("name" to serviceInfo.serviceName, "host" to host, "port" to serviceInfo.port)
            tell()
          }
          resolveNext()
        }
      }
    })
  }

  /** The IPv4 address a resolved service answers on. */
  @Suppress("DEPRECATION")
  private fun addressOf(service: NsdServiceInfo): String? {
    val addresses =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) service.hostAddresses
      else listOfNotNull(service.host)

    return addresses.firstOrNull { it is Inet4Address }?.hostAddress
  }

  /** Tells the app what is on the network now. */
  private fun tell() {
    sendEvent("onChange", mapOf("nearby" to found.values.toList()))
  }
}
