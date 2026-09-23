import ExpoModulesCore
import UIKit

/// Keeps the remote out of whatever it holds while it is shut, for a page kept mounted but hidden
/// beneath another. Being see-through and unpressable does not stop the television's focus engine
/// landing on a view, so without this, moving about the page on top can wander onto buttons nobody
/// can see. A move out of it is always allowed, so the page on top can take the remote from it.
final class ValenceFocusFenceView: ExpoView {
  var isShut = false

  override func shouldUpdateFocus(in context: UIFocusUpdateContext) -> Bool {
    if isShut, let next = context.nextFocusedView, next.isDescendant(of: self) {
      return false
    }

    return super.shouldUpdateFocus(in: context)
  }
}
