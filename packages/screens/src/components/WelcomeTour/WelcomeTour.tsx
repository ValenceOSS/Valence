import { useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Icon } from '@ValenceUI/Icon';
import { TOUR_STOPS } from '@ValenceScreens/tour/tourStops';
import type { WelcomeTourProps } from './WelcomeTour.types';
import { say } from '@ValenceI18n/say';

/**
 * A short walk through the places a new account can go, one at a time, with the page behind the
 * dialog changing to match so what is described is what is in view.
 *
 * It can be skipped from any step, and skipping counts as having seen it: a tour that came back
 * every time it was refused would teach nothing but how to close it.
 *
 * @param isOpen - Whether the tour is showing.
 * @param name - What this Valence is called, for the greeting.
 * @param onGoTo - Told which place to show behind the dialog as the tour reaches it.
 * @param onFinished - Told when it was finished or skipped.
 */
const WelcomeTour = ({ isOpen, name, onGoTo, onFinished }: WelcomeTourProps) => {
  const [step, setStep] = useState(0);
  const stop = TOUR_STOPS[step];
  const isLast = step === TOUR_STOPS.length - 1;

  useEffect(() => {
    if (isOpen && stop !== undefined) {
      onGoTo(stop.section);
    }
  }, [isOpen, stop, onGoTo]);

  if (stop === undefined) {
    return null;
  }

  const finish = () => {
    onGoTo('home');
    setStep(0);
    onFinished();
  };

  return (
    <Dialog label={say('screens.welcomeTour.welcome', { name })} isOpen={isOpen} onClose={finish}>
      <DialogTitle
        title={step === 0 ? say('screens.welcomeTour.welcome', { name }) : stop.title}
        detail={say('screens.welcomeTour.stepOfTotal', {
          step: (step + 1).toString(),
          total: TOUR_STOPS.length.toString(),
        })}
      />

      <DialogContent>
        <div className="flex items-start gap-4">
          <span className="valence-card-shell shrink-0">
            <span className="valence-card-face flex size-14 items-center justify-center">
              <Icon of={stop.icon} size={26} />
            </span>
          </span>

          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="text-base font-semibold text-text">{stop.title}</h3>
            <p className="text-sm text-text-muted">{stop.detail}</p>
          </div>
        </div>
      </DialogContent>

      <DialogFooter
        dismiss={{ label: say('screens.welcomeTour.skip'), onChoose: finish }}
        confirm={{
          label: isLast ? say('screens.welcomeTour.done') : say('screens.welcomeTour.next'),
          onChoose: () => {
            if (isLast) {
              finish();

              return;
            }

            setStep((was) => was + 1);
          },
        }}
      >
        {step === 0 ? null : (
          <Button
            variant="glossy"
            onClick={() => {
              setStep((was) => was - 1);
            }}
          >
            {say('common.back')}
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
};

WelcomeTour.displayName = 'WelcomeTour';

export { WelcomeTour };
