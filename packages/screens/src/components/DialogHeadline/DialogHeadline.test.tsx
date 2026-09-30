import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DialogHeadlinePart } from '@ValenceScreens/components/DialogHeadlinePart/DialogHeadlinePart';
import { DialogHeadline } from './DialogHeadline';

describe('DialogHeadline', () => {
  it('draws the parts it is given, in order', () => {
    render(
      <DialogHeadline>
        <DialogHeadlinePart>Episode 1</DialogHeadlinePart>
        <DialogHeadlinePart as="h2" isTitle>
          Yuki&apos;s World
        </DialogHeadlinePart>
      </DialogHeadline>,
    );

    expect(screen.getByText('Episode 1')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "Yuki's World" })).toBeInTheDocument();
  });

  it('takes the caller layout', () => {
    const { container } = render(<DialogHeadline className="flex gap-2">Words</DialogHeadline>);

    expect(container.firstElementChild).toHaveClass('flex', 'gap-2');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DialogHeadline.displayName).toBe('DialogHeadline');
  });
});
