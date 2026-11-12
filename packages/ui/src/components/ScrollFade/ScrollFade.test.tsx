import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScrollFade } from './ScrollFade';

describe('ScrollFade', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('holds what it is given in a box that scrolls', () => {
    render(
      <ScrollFade className="max-h-40">
        <p>Inside</p>
      </ScrollFade>,
    );

    const box = screen.getByText('Inside').parentElement;

    expect(box).toHaveAttribute('data-slot', 'scroll-fade');
    expect(box).toHaveClass('overflow-y-auto', 'max-h-40');
  });

  it('fades neither edge while everything fits', () => {
    render(
      <ScrollFade>
        <p>Short</p>
      </ScrollFade>,
    );

    const box = screen.getByText('Short').parentElement;

    expect(box).not.toHaveAttribute('data-more-above');
    expect(box).not.toHaveAttribute('data-more-below');
  });

  it('can be focused to scroll from the keyboard while there is more to scroll to', () => {
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(400);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(100);

    render(
      <ScrollFade className="max-h-24">
        <p>Long</p>
      </ScrollFade>,
    );

    const box = screen.getByText('Long').parentElement;

    expect(box).toHaveAttribute('data-more-below');
    expect(box).toHaveAttribute('tabindex', '0');
  });

  it('cannot be focused while everything fits', () => {
    render(
      <ScrollFade>
        <p>Short</p>
      </ScrollFade>,
    );

    expect(screen.getByText('Short').parentElement).not.toHaveAttribute('tabindex');
  });

  it('is a region named for what it holds, where it is given a name', () => {
    render(
      <ScrollFade label="What has arrived">
        <p>Film</p>
      </ScrollFade>,
    );

    expect(screen.getByRole('region', { name: 'What has arrived' })).toBeInTheDocument();
  });
});
