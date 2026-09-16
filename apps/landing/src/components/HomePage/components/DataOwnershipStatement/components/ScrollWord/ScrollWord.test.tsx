import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMotionValue } from 'motion/react';
import { ScrollWord } from './ScrollWord';

const Harness = () => {
  const progress = useMotionValue(0);

  return (
    <ScrollWord index={0} total={4} progress={progress}>
      Yours
    </ScrollWord>
  );
};

describe('ScrollWord', () => {
  it('starts dim before its place in the statement has been scrolled to', () => {
    render(<Harness />);

    expect(screen.getByText('Yours')).toHaveStyle({ opacity: '0.25' });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ScrollWord.displayName).toBe('ScrollWord');
  });
});
