import { useCallback, useState } from 'react';

type FitHeight = {
  measureRef: (element: HTMLElement | null) => (() => void) | undefined;
  height: number | null;
};

/**
 * Measures how tall an element is for as long as it is mounted, so a panel can spring to exactly the
 * height of whatever it holds. Hands back a ref rather than taking one, so an element that mounts
 * later, or is swapped for another, is measured the moment it arrives.
 *
 * @returns The ref to attach, and the height in pixels or null until something has been measured.
 */
const useFitHeight = (): FitHeight => {
  const [height, setHeight] = useState<number | null>(null);

  const measureRef = useCallback((element: HTMLElement | null) => {
    if (element === null) {
      return undefined;
    }

    const measure = () => {
      setHeight(Math.ceil(element.scrollHeight));
    };

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return { measureRef, height };
};

export { useFitHeight };
