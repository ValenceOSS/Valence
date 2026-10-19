import { Logo } from '@ValenceUI/Logo';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { useAppliedTheme } from '@ValenceScreens/theme/useAppliedTheme';
import type { UpdateWindowProps } from './UpdateWindow.types';
import { say } from '@ValenceI18n/say';

/**
 * The small window a desktop client shows while it installs an update, in place of its main one.
 *
 * The download runs in the window bar, where somebody can carry on watching while it does. Once it
 * is on disk the main window steps aside for this one, the client quits for the installer, and the
 * new version opens this again before anything else, so the restart reads as one piece of work
 * rather than a window that vanishes and comes back. How long either side takes is not something the
 * installer says, so the bar moves without a position rather than pretending to one.
 *
 * @param step - Whether this is the version about to quit for the installer, or the one it installed
 *   finding its feet.
 * @param version - The version being installed.
 */
const UpdateWindow = ({ step, version }: UpdateWindowProps) => {
  useAppliedTheme();

  const title =
    step === 'installing'
      ? say('screens.updateWindow.installingUpdate')
      : say('screens.updateWindow.finishingUpdate');

  return (
    <main className="flex h-dvh select-none flex-col items-center justify-between bg-surface px-9 pt-20 pb-10 text-text [-webkit-app-region:drag]">
      <Logo size={56} isAnimated />

      <div role="status" className="flex w-full flex-col items-center gap-3.5">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="text-[0.9375rem] font-semibold leading-tight">{title}</span>

          <span className="text-[0.8125rem] font-medium leading-tight text-text-muted tabular-nums">
            {say('screens.adminPage.valenceVersion', { version })}
          </span>
        </div>

        <ProgressBar label={title} value={null} isFull isThin />
      </div>
    </main>
  );
};

UpdateWindow.displayName = 'UpdateWindow';

export { UpdateWindow };
