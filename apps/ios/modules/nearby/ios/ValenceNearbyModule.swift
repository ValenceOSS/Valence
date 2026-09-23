import ExpoModulesCore
import Network

/// Browses the local network for Valence servers announcing themselves over
/// Bonjour, and says where each one answers.
///
/// An announcement names a service rather than an address, so each one is
/// connected to once, just long enough for the system to resolve it, and the
/// address it resolved to is what is reported. Only IPv4 is asked for, as the
/// desktop app only offers IPv4, since that is what somebody would type.
public class ValenceNearbyModule: Module {
  private var browser: NWBrowser?
  private var resolving: [String: NWConnection] = [:]
  private var found: [String: [String: Any]] = [:]

  public func definition() -> ModuleDefinition {
    Name("ValenceNearby")

    Events("onChange")

    Function("start") { (type: String) in
      self.start(type)
    }

    Function("stop") {
      self.stop()
    }

    OnDestroy {
      self.stop()
    }
  }

  /// Starts browsing for one kind of service, forgetting anything found before.
  private func start(_ type: String) {
    stop()

    let browser = NWBrowser(for: .bonjour(type: "_\(type)._tcp", domain: nil), using: NWParameters())

    browser.browseResultsChangedHandler = { [weak self] results, _ in
      self?.heard(results)
    }
    browser.start(queue: .main)
    self.browser = browser
  }

  /// Stops browsing and resolving, and forgets what was found.
  private func stop() {
    browser?.cancel()
    browser = nil
    resolving.values.forEach { $0.cancel() }
    resolving.removeAll()
    found.removeAll()
  }

  /// Takes what the browser can currently see: forgets what has gone and
  /// resolves what is new.
  private func heard(_ results: Set<NWBrowser.Result>) {
    let named = Dictionary(
      results.compactMap { result in nameOf(result.endpoint).map { ($0, result.endpoint) } },
      uniquingKeysWith: { first, _ in first }
    )

    for gone in found.keys where named[gone] == nil {
      found.removeValue(forKey: gone)
    }

    for (name, endpoint) in named where found[name] == nil && resolving[name] == nil {
      resolve(name, endpoint)
    }

    tell()
  }

  /// Connects to one announced service just long enough to learn its address.
  private func resolve(_ name: String, _ endpoint: NWEndpoint) {
    let parameters = NWParameters.tcp

    if let ip = parameters.defaultProtocolStack.internetProtocol as? NWProtocolIP.Options {
      ip.version = .v4
    }

    let connection = NWConnection(to: endpoint, using: parameters)

    connection.stateUpdateHandler = { [weak self, weak connection] state in
      guard let self, let connection else {
        return
      }

      switch state {
      case .ready:
        if case let .hostPort(host, port)? = connection.currentPath?.remoteEndpoint,
           case let .ipv4(address) = host {
          self.found[name] = [
            "name": name,
            "host": "\(address)".components(separatedBy: "%")[0],
            "port": Int(port.rawValue),
          ]
        }

        connection.cancel()
        self.resolving.removeValue(forKey: name)
        self.tell()
      case .failed, .cancelled:
        self.resolving.removeValue(forKey: name)
      default:
        break
      }
    }

    resolving[name] = connection
    connection.start(queue: .main)
  }

  /// The name a service announced itself under.
  private func nameOf(_ endpoint: NWEndpoint) -> String? {
    if case let .service(name, _, _, _) = endpoint {
      return name
    }

    return nil
  }

  /// Tells the app what is on the network now.
  private func tell() {
    sendEvent("onChange", ["nearby": Array(found.values)])
  }
}
