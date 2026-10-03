import { ChoicePanel } from '@ValenceTv/components/ChoicePanel/ChoicePanel';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';
import type { WherePanelProps } from './WherePanel.types';
import { say } from '@ValenceI18n/say';

/**
 * Which server's titles a wall of films or programmes shows — everywhere, only this server's own,
 * or only one linked server's — in the panel down the right. Choosing puts it away, as Menu does.
 *
 * @param options - The choices.
 * @param chosen - The one chosen now.
 * @param onChoose - Told the one chosen.
 * @param onClose - Told to put the panel away.
 */
const WherePanel = ({ options, chosen, onChoose, onClose }: WherePanelProps) => {
  useMenuButton(onClose, true);

  return (
    <ChoicePanel
      title={say('common.where')}
      choices={options.map((option) => ({
        id: option.id,
        label: option.label,
        isCurrent: option.id === chosen,
      }))}
      onChoose={(id) => {
        onChoose(id);
        onClose();
      }}
    />
  );
};

WherePanel.displayName = 'WherePanel';

export { WherePanel };
