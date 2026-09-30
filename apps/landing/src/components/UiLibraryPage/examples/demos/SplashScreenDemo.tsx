import { useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { SplashScreen } from '@ValenceUI/SplashScreen';

const READY_AFTER_MS = 1800;

/**
 * The screen shown while Valence starts, held in a frame of its own instead of over the whole page,
 * finishing after a moment and ready to be played again.
 */
const SplashScreenDemo = () => {
  const [run, setRun] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(false);

    const timer = setTimeout(() => {
      setIsReady(true);
    }, READY_AFTER_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [run]);

  return (
    <div className="flex w-full flex-col items-start gap-3">
      <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-[var(--surface-line)] [transform:translateZ(0)]">
        <SplashScreen key={run} label="Starting Valence" isReady={isReady} />
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setRun((was) => was + 1);
        }}
      >
        Replay
      </Button>
    </div>
  );
};

SplashScreenDemo.displayName = 'SplashScreenDemo';

export { SplashScreenDemo };
