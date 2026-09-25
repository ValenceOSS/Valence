import { useQuery } from '@tanstack/react-query';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { describeHiding } from '@ValenceClient/library/describeHiding';
import type { ConfirmHidingProps } from './ConfirmHiding.types';
import { say } from '@ValenceI18n/say';

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
 * That hiding belongs to one face and not to the account is said only where the account has more
 * than one, since on an account with a single face it names a distinction that does not exist there
 * and reads as a warning about somebody who is not real.
 *
 * @param hiding - What is being hidden, and how to agree or think better of it.
 * @param onHidden - Told once something has been hidden, so a dialog showing it can close.
 */
const ConfirmHiding = ({ hiding, onHidden }: ConfirmHidingProps) => {
  const faces = useQuery(profileQueries.all()).data ?? [];
  const shared = faces.length > 1;

  return (
    <ConfirmDialog
      title={
        hiding.asking === null
          ? say('screens.confirmHiding.title')
          : describeHiding(hiding.asking, shared).title
      }
      detail={hiding.asking === null ? '' : describeHiding(hiding.asking, shared).detail}
      confirmLabel={say('screens.confirmHiding.confirm')}
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
};

ConfirmHiding.displayName = 'ConfirmHiding';

export { ConfirmHiding };
