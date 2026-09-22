import ExpoModulesCore
import UIKit

/// The part of the search screen beneath the keyboard, which says how much room it has whenever that changes.
final class SearchResultsController: UIViewController {
  var onLayout: ((CGSize) -> Void)?

  private var reported = CGSize.zero

  override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()

    let size = view.bounds.size

    guard size != reported else {
      return
    }

    reported = size
    onLayout?(size)
  }
}

/// The search screen every app on the television shares — the keyboard across the top, dictation,
/// the Remote app's typing — with whatever React draws inside it put in the space beneath, where
/// that screen shows its results.
///
/// What is typed is told to JavaScript as it changes, and so is the size of the space beneath the
/// keyboard, since React lays its views out without knowing the keyboard is there.
///
/// Pressing up from the keyboard goes to the view it is told to go up to, through a focus guide
/// along the top of the search screen, since the search screen knows nothing of the rest of the app
/// and would otherwise keep the remote in the keyboard for good.
final class ValenceSearchView: ExpoView, UISearchResultsUpdating {
  let onChangeText = EventDispatcher()
  let onResultsLayout = EventDispatcher()

  private let results = SearchResultsController()
  private lazy var search = UISearchController(searchResultsController: results)
  private lazy var container = UISearchContainerViewController(searchController: search)
  private var lastText = ""
  private let upward = UIFocusGuide()

  weak var upTo: UIView? {
    didSet {
      upward.preferredFocusEnvironments = upTo.map { [$0] } ?? []
      upward.isEnabled = upTo != nil
    }
  }

  var placeholder = "" {
    didSet {
      search.searchBar.placeholder = placeholder
    }
  }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    clipsToBounds = true
    search.searchResultsUpdater = self
    search.obscuresBackgroundDuringPresentation = false
    results.onLayout = { [weak self] size in
      self?.onResultsLayout(["width": size.width, "height": size.height])
    }
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()

    if window == nil {
      detach()

      return
    }

    guard container.parent == nil, let parent = owningViewController() else {
      return
    }

    parent.addChild(container)
    container.view.frame = bounds
    container.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    addSubview(container.view)
    container.didMove(toParent: parent)
    guideUpwards()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    container.view.frame = bounds
  }

  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    results.view.insertSubview(childComponentView, at: index)
  }

  override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    childComponentView.removeFromSuperview()
  }

  func updateSearchResults(for searchController: UISearchController) {
    let text = searchController.searchBar.text ?? ""

    guard text != lastText else {
      return
    }

    lastText = text
    onChangeText(["text": text])
  }

  /// Lays the focus guide along the very top of the search screen, above the keyboard, where pressing up lands.
  private func guideUpwards() {
    guard upward.owningView == nil else {
      return
    }

    container.view.addLayoutGuide(upward)
    NSLayoutConstraint.activate([
      upward.topAnchor.constraint(equalTo: container.view.topAnchor),
      upward.leadingAnchor.constraint(equalTo: container.view.leadingAnchor),
      upward.trailingAnchor.constraint(equalTo: container.view.trailingAnchor),
      upward.heightAnchor.constraint(equalToConstant: 1),
    ])
  }

  /// Takes the search screen back out of the view controller it was put in, when this leaves the screen.
  private func detach() {
    guard container.parent != nil else {
      return
    }

    container.willMove(toParent: nil)
    container.view.removeFromSuperview()
    container.removeFromParent()
  }

  /// The view controller this view is drawn inside, which the search screen has to become a child of.
  private func owningViewController() -> UIViewController? {
    var responder: UIResponder? = self

    while let next = responder?.next {
      if let controller = next as? UIViewController {
        return controller
      }

      responder = next
    }

    return nil
  }
}
