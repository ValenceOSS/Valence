import { Button } from '@ValenceUI/Button';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import type { TitleDetailsProps } from './TitleDetails.types';

/**
 * A card of facts about a title, each a label and what it is — its profile, library and folder, or
 * the files it has on disk — with one thing to do about them where there is one.
 *
 * @param title - What the card is.
 * @param facts - The facts.
 * @param action - What can be done about them, where anything can.
 */
const TitleDetails = ({ title, facts, action }: TitleDetailsProps) => (
  <PanelCard
    title={title}
    actions={
      action === undefined ? null : (
        <Button variant="ghost" size="xs" onClick={action.onPress}>
          {action.label}
        </Button>
      )
    }
  >
    <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-6 gap-y-2.5 text-sm">
      {facts.map((fact) => (
        <div key={fact.label} className="contents">
          <dt className="text-text-muted">{fact.label}</dt>
          <dd className="min-w-0 break-words text-text">{fact.value}</dd>
        </div>
      ))}
    </dl>
  </PanelCard>
);

TitleDetails.displayName = 'TitleDetails';

export { TitleDetails };
