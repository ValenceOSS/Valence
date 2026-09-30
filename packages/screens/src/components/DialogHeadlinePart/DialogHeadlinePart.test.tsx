import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DialogHeadlinePart } from './DialogHeadlinePart';

describe('DialogHeadlinePart', () => {
  it('is a plain block by default', () => {
    render(<DialogHeadlinePart>Episode 1</DialogHeadlinePart>);

    expect(screen.getByText('Episode 1').tagName).toBe('DIV');
  });

  it('keeps a title a heading', () => {
    render(
      <DialogHeadlinePart as="h2" isTitle>
        A Sign of Affection
      </DialogHeadlinePart>,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'A Sign of Affection' }),
    ).toBeInTheDocument();
  });

  it('can sit inline, for a part within a line', () => {
    render(<DialogHeadlinePart as="span">2024</DialogHeadlinePart>);

    expect(screen.getByText('2024').tagName).toBe('SPAN');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DialogHeadlinePart.displayName).toBe('DialogHeadlinePart');
  });
});
