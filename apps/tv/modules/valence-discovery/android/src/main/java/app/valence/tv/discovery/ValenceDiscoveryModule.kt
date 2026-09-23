package app.valence.tv.discovery

import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.Inet4Address

private const val SERVICE = "_valence._tcp."

/**
 * Hears the Valence servers that announce themselves on the local network, and says where each one
 * answers.
 *
 * A server announces `_valence._tcp` over DNS-SD. This browses for that and nothing else — it never
 * goes knocking on machines — and resolves each service it hears to an address and a port, preferring
 * IPv4, since that is the address a person would recognise and type. Android resolves one service at a
 * time, so services heard together wait their turn. What to do with a server once it is heard is left
 * to TypeScript.
 */
class ValenceDiscoveryModule : Module() {
  private var nsd: NsdManager? = null
  private var browsing: NsdManager.DiscoveryListener? = null
  private val waiting = ArrayDeque<NsdServiceInfo>()
  private var isResolving = false
  private val main = Handler(Looper.getMainLooper())

  override fun definition() = ModuleDefinition {
    Name("ValenceDiscovery")

    Events("onFound", "onLost")

    Function("start") { main.post { start() } }

    Function("stop") { main.post { stop() } }

    OnDestroy { stop() }
  }

  /** Starts browsing, once; asking again while it is already browsing does nothing. */
  private fun start() {
    if (browsing != null) {
      return
    }

    val context = appContext.reactContext ?: return
    val manager = context.getSystemService(Context.NSD_SERVICE) as? NsdManager ?: return
    val listener = object : NsdManager.DiscoveryListener {
      override fun onServiceFound(service: NsdServiceInfo) {
        main.post { resolveLater(service) }
      }

      override fun onServiceLost(service: NsdServiceInfo) {
        main.post { sendEvent("onLost", mapOf("name" to service.serviceName)) }
      }

      override fun onDiscoveryStarted(serviceType: String) = Unit

      override fun onDiscoveryStopped(serviceType: String) = Unit

      override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) {
        main.post { browsing = null }
      }

      override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) = Unit
    }

    nsd = manager
    browsing = listener
    manager.discoverServices(SERVICE, NsdManager.PROTOCOL_DNS_SD, listener)
  }

  /** Stops browsing and forgets anything still waiting to be resolved. */
  private fun stop() {
    val listener = browsing ?: return

    browsing = null
    waiting.clear()
    runCatching { nsd?.stopServiceDiscovery(listener) }
  }

  /** Puts a heard service in line to be resolved, and starts on the line if nothing is resolving. */
  private fun resolveLater(service: NsdServiceInfo) {
    waiting.addLast(service)
    resolveNext()
  }

  /** Resolves the next service in line to where it answers, and says so. */
  @Suppress("DEPRECATION")
  private fun resolveNext() {
    val manager = nsd ?: return

    if (isResolving || browsing == null) {
      return
    }

    val service = waiting.removeFirstOrNull() ?: return

    isResolving = true
    manager.resolveService(
      service,
      object : NsdManager.ResolveListener {
        override fun onServiceResolved(resolved: NsdServiceInfo) {
          main.post {
            val host = resolved.host

            if (host != null) {
              sendEvent(
                "onFound",
                mapOf(
                  "name" to resolved.serviceName,
                  "host" to (host.takeIf { it is Inet4Address } ?: host).hostAddress,
                  "port" to resolved.port,
                ),
              )
            }

            isResolving = false
            resolveNext()
          }
        }

        override fun onResolveFailed(failed: NsdServiceInfo, errorCode: Int) {
          main.post {
            isResolving = false
            resolveNext()
          }
        }
      },
    )
  }
}
