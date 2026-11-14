import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StageCue } from './StageCue';

describe('StageCue', () => {
  it('draws nothing until something is pressed', () => {
    const { container } = render(<StageCue cue={null} isPlaying />);

    expect(container).toBeEmptyDOMElement();
  });

  it('blinks in the middle for a play or pause', () => {
    const { container } = render(<StageCue cue={{ kind: 'toggle', at: 1 }} isPlaying={false} />);

    expect(container.firstElementChild).toHaveClass('left-1/2');
  });

  it('blinks to the side it skipped towards', () => {
    const back = render(<StageCue cue={{ kind: 'back', at: 1 }} isPlaying />);
    const forward = render(<StageCue cue={{ kind: 'forward', at: 2 }} isPlaying />);

    expect(back.container.firstElementChild).toHaveClass('start-[20%]');
    expect(forward.container.firstElementChild).toHaveClass('end-[20%]');
  });
});
