import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { usePortalContainer } from '@ValenceUI/usePortalContainer';
import { useActiveSection } from './useActiveSection';
import type { VersionSliderProps } from './VersionSlider.types';

const BAR_WIDTHS_PX = [48, 36, 30, 26, 22, 19, 17, 15, 13, 12] as const;

const MIN_OPACITY = 0.15;

const OPACITY_STEP = 0.12;

const CLEARANCE_PX = 32;

/**
 * Scrolls a release's own heading into view, so a bar in the slider is also a way to get there.
 *
 * @param version - The release to jump to.
 */
const scrollToVersion = (version: string): void => {
  document.getElementById(version)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * Watches the page's own footer and reports its height once it has scrolled into view, so a fixed
 * control can stop tracking the viewport and settle just above it instead of riding over it.
 *
 * @returns The footer's height once it's in view, or nothing while it's still off-screen.
 */
const useFooterHeight = (): number | null => {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const footer = document.querySelector('footer');

    if (footer === null || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setHeight(entry?.isIntersecting === true ? footer.getBoundingClientRect().height : null);
    });

    observer.observe(footer);

    return () => {
      observer.disconnect();
    };
  }, []);

  return height;
};

/**
 * A rail of every release down the side of the changelog, the one closest to what the reader is
 * looking at drawn widest and brightest, the rest receding the further they sit from it — and a
 * shortcut to any of them.
 *
 * Drawn outside the page rather than within it, the same way `BackToTop` is: the route it sits on
 * animates in with a transform, and anything held inside something moved is fixed against that
 * thing rather than against the window.
 *
 * @param versions - Every release's tag, in the order they appear on the page.
 */
const VersionSlider = ({ versions }: VersionSliderProps) => {
  const activeVersion = useActiveSection(versions);
  const activeIndex = Math.max(activeVersion === null ? 0 : versions.indexOf(activeVersion), 0);
  const portalContainer = usePortalContainer();
  const footerHeight = useFooterHeight();

  if (versions.length === 0) {
    return null;
  }

  const slider = (
    <div
      style={
        footerHeight === null
          ? { position: 'fixed', bottom: CLEARANCE_PX, right: CLEARANCE_PX }
          : { position: 'absolute', bottom: footerHeight + CLEARANCE_PX, right: CLEARANCE_PX }
      }
      className="z-10 hidden flex-col items-end gap-3 sm:flex"
    >
      <span className="font-mono text-xs text-text-muted">{versions[activeIndex]}</span>

      <div className="flex flex-col items-end gap-1.5">
        {versions.map((version, index) => {
          const distance = Math.abs(index - activeIndex);
          const width = BAR_WIDTHS_PX[Math.min(distance, BAR_WIDTHS_PX.length - 1)] ?? 12;
          const opacity = Math.max(1 - distance * OPACITY_STEP, MIN_OPACITY);
          const isActive = distance === 0;

          return (
            <Button
              key={version}
              variant="bare"
              isIconOnly
              size="none"
              label={`Jump to ${version}`}
              hasTooltip={false}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => {
                scrollToVersion(version);
              }}
              style={{ width: `${width.toString()}px`, opacity }}
              className={cn(
                'h-1.5 rounded-full transition-[width,opacity] duration-300 motion-reduce:transition-none',
                isActive ? 'bg-accent' : 'bg-text-muted/50',
              )}
            />
          );
        })}
      </div>
    </div>
  );

  return createPortal(slider, portalContainer ?? document.body);
};

VersionSlider.displayName = 'VersionSlider';

export { VersionSlider };
