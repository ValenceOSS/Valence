import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import type { ConfirmHidingProps } from './ConfirmHiding.types';

/**
 * Asks before taking something out of somebody's own browsing, and says what will actually go.
 *
 * Hiding is quiet and wide: the thing leaves every row, every search, the randomiser and the
 * part-watched row at once. Somebody who meant to press the control beside it would have no idea
 * what became of it, so it is worth one question.
 *
 * The question names the programme rather than the episode wherever there is one, because agreeing
 * to hide one thing and losing another is worse than not having asked.
 *
 * It says where the way back is in the same breath, which is what makes the answer an easy yes. It
 * is not drawn as a destructive act, because it is not one — nothing is deleted and a position in
 * something half-watched is kept.
 *
 * @param hiding - What is being hidden, and how to agree or think better of it.
 * @param onHidden - Told once something has been hidden, so a dialog showing it can close.
 */
const ConfirmHiding = ({ hiding, onHidden }: ConfirmHidingProps) => (
  <ConfirmDialog
    title={hiding.asking === null ? 'Hide this?' : `Hide ${hiding.asking.title}?`}
    detail={
      hiding.asking === null
        ? ''
        : `${
            hiding.asking.kind === 'series' ? 'Every episode of it disappears' : 'It disappears'
          } from your rows, your searches and the randomiser — for you, not for anybody else on this account. Bring it back from Hidden on your profile at any time.`
    }
    confirmLabel="Hide it"
    isOpen={hiding.asking !== null}
    onClose={() => {
      hiding.dismiss();
    }}
    onConfirm={() => {
      hiding.confirm();
      onHidden?.();
    }}
  />
);

ConfirmHiding.displayName = 'ConfirmHiding';

export { ConfirmHiding };
