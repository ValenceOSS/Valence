import { useState } from 'react';
import { IconBrandWindowsFilled } from '@tabler/icons-react';
import { BrandGlyph } from '@ValenceUI/BrandGlyph';
import { SplitButton } from '@ValenceUI/SplitButton';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { downloadChoicesFor } from '@ValenceLanding/content/downloads/downloadChoicesFor';
import type { DownloadChoice } from '@ValenceLanding/content/downloads/DownloadChoice';
import type { DownloadDesktopProps } from './DownloadDesktop.types';

const FALLBACK: DownloadChoice['id'] = 'windows';

/**
 * The way to download the desktop app: one press downloads the installer for the computer the page
 * is open on, and the arrow beside it lists every other one, each with its processor and size, and
 * choosing one makes the button download that instead. A phone, or a computer that cannot be told,
 * is offered the Windows installer first.
 *
 * @param release - The newest release, whose installers are offered; with none, every choice leads
 *   to the releases page.
 * @param platform - What the page is open on.
 */
const DownloadDesktop = ({ release, platform }: DownloadDesktopProps) => {
  const { lead, others } = downloadChoicesFor(release, platform);
  const choices = lead === null ? others : [lead, ...others];
  const [chosenId, setChosenId] = useState<string>(lead?.id ?? FALLBACK);
  const chosen = choices.find((choice) => choice.id === chosenId) ?? choices[0];

  if (chosen === undefined) {
    return null;
  }

  return (
    <SplitButton
      tone="raised"
      className="[&_button]:border-transparent!"
      size="lg"
      choiceLabel="Other computers"
      choiceName="Download for"
      options={choices.map((choice) => ({
        id: choice.id,
        label: choice.system,
        detail:
          choice.sizeBytes === null
            ? choice.detail
            : `${choice.detail} · ${formatBytes(choice.sizeBytes)}`,
      }))}
      selectedId={chosen.id}
      onSelect={setChosenId}
      onClick={() => {
        window.location.assign(chosen.url);
      }}
    >
      {chosen.id === 'windows' ? (
        <IconBrandWindowsFilled size={16} aria-hidden />
      ) : (
        <BrandGlyph of={chosen.id === 'linux' ? 'linux' : 'apple'} size={16} />
      )}
      Download Desktop
    </SplitButton>
  );
};

DownloadDesktop.displayName = 'DownloadDesktop';

export { DownloadDesktop };
