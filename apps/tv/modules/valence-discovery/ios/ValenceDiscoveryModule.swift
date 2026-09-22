import ExpoModulesCore
import Network

/// Hears the Valence servers that announce themselves on the local network, and says where each one
/// answers.
///
/// A server announces `_valence._tcp` over Bonjour. This browses for that and nothing else — it never
/// goes knocking on machines — and resolves each service it hears to an address and a port, preferring
/// IPv4, since that is the address a person would recognise and type. What to do with a server once it
/// is heard is left to TypeScript.
public class ValenceDiscoveryModule: Module {
  private var browser: NWBrowser?
  private var resolving: [String: NWConnection] = [:]

  public func definition() -> ModuleDefinition {
    Name("ValenceDiscovery")

    Events("onFound", "onLost")

    Function("start") {
      self.start()
    }

    Function("stop") {
      self.stop()
    }

    OnDestroy {
      self.stop()
    }
  }

  /// Starts browsing, once; asking again while it is already browsing does nothing.
  private func start() {
    guard browser == nil else {
      return
    }

    let browsing = NWBrowser(for: .bonjour(type: "_valence._tcp", domain: nil), using: .tcp)

    browsing.browseResultsChangedHandler = { [weak self] _, changes in
      for change in changes {
        switch change {
        case .added(let result):
          self?.resolve(result.endpoint)
        case .removed(let result):
          if case let .service(name, _, _, _) = result.endpoint {
            self?.resolving.removeValue(forKey: name)?.cancel()
            self?.sendEvent("onLost", ["name": name])
          }
        default:
          break
        }
      }
    }

    browsing.start(queue: .main)
    browser = browsing
  }

  /// Stops browsing and gives up on anything still being resolved.
  private func stop() {
    browser?.cancel()
    browser = nil

    for connection in resolving.values {
      connection.cancel()
    }

    resolving.removeAll()
  }

  /// Works out where a heard service answers by connecting to it just long enough to learn the
  /// address the connection reached, then letting go.
  private func resolve(_ endpoint: NWEndpoint) {
    guard case let .service(name, _, _, _) = endpoint else {
      return
    }

    let parameters = NWParameters.tcp

    if let ip = parameters.defaultProtocolStack.internetProtocol as? NWProtocolIP.Options {
      ip.version = .v4
    }

    let connection = NWConnection(to: endpoint, using: parameters)

    connection.stateUpdateHandler = { [weak self, weak connection] state in
      switch state {
      case .ready:
        if case let .hostPort(host, port)? = connection?.currentPath?.remoteEndpoint {
          self?.sendEvent("onFound", [
            "name": name,
            "host": Self.describe(host),
            "port": Int(port.rawValue),
          ])
        }

        connection?.cancel()
        self?.resolving.removeValue(forKey: name)
      case .failed, .cancelled:
        self?.resolving.removeValue(forKey: name)
      default:
        break
      }
    }

    resolving[name] = connection
    connection.start(queue: .main)
  }

  /// A host as somebody would type it, without the interface an address on this network carries.
  private static func describe(_ host: NWEndpoint.Host) -> String {
    switch host {
    case .ipv4(let address):
      return "\(address)".components(separatedBy: "%")[0]
    case .ipv6(let address):
      return "[\("\(address)".components(separatedBy: "%")[0])]"
    case .name(let named, _):
      return named
    @unknown default:
      return "\(host)"
    }
  }
}
