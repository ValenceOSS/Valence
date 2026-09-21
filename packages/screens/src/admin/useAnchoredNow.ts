import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A moment that ranges are counted back from, held still so that reading the same question twice asks
 * it the same way, and moved to the present when the question changes or on request.
 *
 * A range like "the last hour" means an hour back from somewhere. If that were always the present
 * moment every read would be a different question and nothing could be kept between them.
 *
 * @param question - What the moment answers; when it changes, the moment moves to the present.
 * @returns The moment, and the way to move it to the present.
 */
const useAnchoredNow = (question: string | undefined): [number, () => void] => {
  const [now, setNow] = useState(() => Date.now());
  const asked = useRef(question);

  useEffect(() => {
    if (asked.current !== question) {
      asked.current = question;
      setNow(Date.now());
    }
  }, [question]);

  const refresh = useCallback(() => {
    setNow(Date.now());
  }, []);

  return [now, refresh];
};

export { useAnchoredNow };
