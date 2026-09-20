import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Rail } from './Rail';

/**
 * jsdom lays nothing out, so how much a row overflows has to be described: how wide it looks, how
 * wide it really is, and how wide one card in it is.
 *
 * The gap is set as a real style rather than by standing in for `getComputedStyle`. Everything that
 * reads an element's accessible name asks that same function, so a stand-in returning only the one
 * property it was asked for takes every `getByRole` in the file down with it.
 */
const overflowing = (element: HTMLElement, options: { scrollLeft?: number }) => {
  Object.defineProperty(element, 'scrollWidth', { configurable: true, value: 3000 });
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: 1000 });
  Object.defineProperty(element, 'scrollLeft', {
    configurable: true,
    writable: true,
    value: options.scrollLeft ?? 0,
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 300 });

  element.style.columnGap = '16px';
};

const items = ['One', 'Two', 'Three'].map((name) => <li key={name}>{name}</li>);

describe('Rail', () => {
  it('names itself so the row can be found', () => {
    render(<Rail title="Recently added">{items}</Rail>);

    expect(screen.getByRole('region', { name: 'Recently added' })).toBeInTheDocument();
  });

  it('shows what it was given', () => {
    render(<Rail title="Recently added">{items}</Rail>);

    expect(screen.getByText('Two')).toBeInTheDocument();
  });

  it('offers nowhere to go before anything overflows', () => {
    render(<Rail title="Recently added">{items}</Rail>);

    expect(screen.queryByRole('button', { name: /a page of/ })).not.toBeInTheDocument();
  });

  it('offers no arrow before the row runs off the edge', () => {
    render(<Rail title="Recently added">{items}</Rail>);

    expect(screen.queryByRole('button', { name: /a page of/ })).not.toBeInTheDocument();
  });

  it('offers a way on, and dims the way back, while the row is at its start', () => {
    const { container } = render(<Rail title="Recently added">{items}</Rail>);
    const track = container.querySelector('ul');

    if (track !== null) {
      overflowing(track, {});
      fireEvent.scroll(track);
    }

    expect(screen.getByRole('button', { name: 'Forward a page of Recently added' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Back a page of Recently added' })).toBeDisabled();
  });

  it('offers a way back once the row has been moved on', () => {
    const { container } = render(<Rail title="Recently added">{items}</Rail>);
    const track = container.querySelector('ul');

    if (track !== null) {
      overflowing(track, { scrollLeft: 3 * 316 });
      fireEvent.scroll(track);
    }

    expect(screen.getByRole('button', { name: 'Back a page of Recently added' })).toBeEnabled();
  });

  it('turns the page by whole cards', async () => {
    const user = userEvent.setup();
    const { container } = render(<Rail title="Recently added">{items}</Rail>);
    const track = container.querySelector('ul');
    const scrollTo = vi.fn();

    if (track !== null) {
      overflowing(track, {});
      track.scrollTo = scrollTo;
      fireEvent.scroll(track);
    }

    await user.click(screen.getByRole('button', { name: 'Forward a page of Recently added' }));

    expect(scrollTo).toHaveBeenCalledWith({ left: 3 * 316, behavior: 'smooth' });
  });

  it('sizes a row of cards standing tall the same as one lying wide', () => {
    const { container } = render(
      <Rail title="Cast" sizesCards cards="portrait">
        {items}
      </Rail>,
    );

    expect(container.querySelector('section')).toHaveClass('[--rail-per:2]');
  });

  it('sizes cards for a film row unless told they stand tall', () => {
    const { container } = render(
      <Rail title="Recently added" sizesCards>
        {items}
      </Rail>,
    );

    expect(container.querySelector('section')).toHaveClass('[--rail-per:2]');
  });

  it('shows an action beside the heading when one is given', () => {
    render(
      <Rail title="Recently added" action={<span>See all</span>}>
        {items}
      </Rail>,
    );

    expect(screen.getByText('See all')).toBeInTheDocument();
  });

  it('leaves the heading as plain text when it leads nowhere', () => {
    render(<Rail title="Continue watching">{items}</Rail>);

    expect(screen.queryByRole('button', { name: 'Continue watching' })).not.toBeInTheDocument();
  });

  it('makes the heading a control when it names something to open', async () => {
    const onOpenTitle = vi.fn();
    const user = userEvent.setup();
    render(
      <Rail title="A Sign of Affection · Season 1" onOpenTitle={onOpenTitle}>
        {items}
      </Rail>,
    );

    await user.click(screen.getByRole('button', { name: 'A Sign of Affection · Season 1' }));

    expect(onOpenTitle).toHaveBeenCalledOnce();
  });

  it('keeps the heading a heading, so the row is still found by its name', () => {
    render(
      <Rail title="A Sign of Affection · Season 1" onOpenTitle={vi.fn()}>
        {items}
      </Rail>,
    );

    expect(
      screen.getByRole('heading', { name: 'A Sign of Affection · Season 1' }),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Rail.displayName).toBe('Rail');
  });

  it('says how many there are, beside the title, when told to', () => {
    render(
      <Rail title="Cast" count={14}>
        {items}
      </Rail>,
    );

    expect(screen.getByRole('heading', { name: 'Cast 14' })).toBeInTheDocument();
  });

  it('names itself by the title alone when nobody counted', () => {
    render(<Rail title="Recently added">{items}</Rail>);

    expect(screen.getByRole('heading', { name: 'Recently added' })).toBeInTheDocument();
  });

  it('still offers the arrows where the row keeps clear of the page gutters, since it has no other way to turn', () => {
    const { container } = render(
      <Rail title="Cast" hasArrows={false}>
        {items}
      </Rail>,
    );
    const track = container.querySelector('ul');

    if (track !== null) {
      overflowing(track, {});
      fireEvent.scroll(track);
    }

    expect(screen.getByRole('button', { name: 'Forward a page of Cast' })).toBeInTheDocument();
  });

  it('holds no lane open where it was told to keep clear of the gutters', () => {
    const { container } = render(
      <Rail title="Cast" sizesCards hasArrows={false} className="px-0">
        {items}
      </Rail>,
    );

    const header = container.querySelector('header');
    const track = container.querySelector('ul');

    expect(header?.className).not.toContain('rail-lane');
    expect(track?.className).not.toContain('rail-lane');
  });

  it('draws the arrows in the header rather than over the cards', () => {
    const { container } = render(<Rail title="Recently added">{items}</Rail>);
    const track = container.querySelector('ul');

    if (track !== null) {
      overflowing(track, {});
      fireEvent.scroll(track);
    }

    const forward = screen.getByRole('button', { name: 'Forward a page of Recently added' });

    expect(container.querySelector('header')).toContainElement(forward);
    expect(forward.className).not.toMatch(/absolute/);
  });

  it('offers no dots, since the arrows are the way through', () => {
    const { container } = render(<Rail title="Recently added">{items}</Rail>);
    const track = container.querySelector('ul');

    if (track !== null) {
      overflowing(track, {});
      fireEvent.scroll(track);
    }

    expect(screen.queryByRole('button', { name: /Show page/ })).not.toBeInTheDocument();
  });

  it('dims the way on once the row has reached its end', () => {
    const { container } = render(<Rail title="Recently added">{items}</Rail>);
    const track = container.querySelector('ul');

    if (track !== null) {
      overflowing(track, { scrollLeft: 3000 });
      fireEvent.scroll(track);
    }

    expect(screen.getByRole('button', { name: 'Forward a page of Recently added' })).toBeDisabled();
  });

  it('stands its cards larger, showing fewer to a row at every size', () => {
    const { container } = render(
      <Rail title="Recently added" sizesCards>
        {items}
      </Rail>,
    );

    expect(container.querySelector('section')).toHaveClass(
      'xl:[--rail-per:5]',
      'lg:[--rail-per:4]',
    );
  });

  it('lines the row up with the page gutter rather than a lane held open for arrows', () => {
    const { container } = render(
      <Rail title="Recently added" sizesCards>
        {items}
      </Rail>,
    );

    expect(container.querySelector('section')).toHaveClass(
      '[--rail-lane:1.25rem]',
      'sm:[--rail-lane:2.5rem]',
    );
  });

  it('lets the row be turned back at its end, even where the end falls partway through a page', () => {
    const { container } = render(<Rail title="Recently added">{items}</Rail>);
    const track = container.querySelector('ul');

    if (track !== null) {
      overflowing(track, { scrollLeft: 2000 });
      fireEvent.scroll(track);
    }

    expect(screen.getByRole('button', { name: 'Back a page of Recently added' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Forward a page of Recently added' })).toBeDisabled();
  });

  it('stands the header above the row, so the whole of an arrow can be pressed', () => {
    const { container } = render(<Rail title="Recently added">{items}</Rail>);

    expect(container.querySelector('header')).toHaveClass('relative', 'z-10');
  });

  it('paints the arrows as every other default button is painted', () => {
    const { container } = render(<Rail title="Recently added">{items}</Rail>);
    const track = container.querySelector('ul');

    if (track !== null) {
      overflowing(track, {});
      fireEvent.scroll(track);
    }

    expect(screen.getByRole('button', { name: 'Forward a page of Recently added' })).toHaveClass(
      'bg-[var(--surface-hover)]',
    );
  });
});
