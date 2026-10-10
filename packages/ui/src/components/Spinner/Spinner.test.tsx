import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('exposes itself as a status region named by its label', () => {
    render(<Spinner label="Loading library" />);

    expect(screen.getByRole('status', { name: 'Loading library' })).toBeInTheDocument();
  });

  it('draws small enough to sit inside a badge', () => {
    render(<Spinner label="Downloading" size="xs" />);

    expect(screen.getByRole('status', { name: 'Downloading' }).firstElementChild).toHaveStyle({
      width: '12px',
    });
  });

  it('accepts a custom class', () => {
    render(<Spinner label="Loading" className="text-danger" />);

    expect(screen.getByRole('status', { name: 'Loading' })).toHaveClass('text-danger');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Spinner.displayName).toBe('Spinner');
  });

  it('draws a ring of eight segments that light one after another while it waits', () => {
    render(<Spinner label="Loading" />);

    const segments = screen
      .getByRole('status', { name: 'Loading' })
      .querySelectorAll<HTMLElement>('span.absolute > span');

    expect(segments).toHaveLength(8);
    expect([...segments].filter((segment) => segment.style.opacity === '1').length).toBeGreaterThan(
      0,
    );
  });

  it('shows how far along something is, still, as a progress bar, where that is known', () => {
    render(<Spinner label="Uploading" progress={0.42} />);

    const bar = screen.getByRole('progressbar', { name: 'Uploading' });

    expect(bar).toHaveAttribute('aria-valuenow', '42');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).not.toHaveClass('valence-spin');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('never says it is further along than done, or less than nothing', () => {
    const { rerender } = render(<Spinner label="Uploading" progress={1.4} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');

    rerender(<Spinner label="Uploading" progress={-0.2} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('waits in the middle of the page when it is all a page shows', () => {
    const { container } = render(<Spinner label="Reading" isPageCentered />);

    expect(container.firstElementChild).toHaveClass('min-h-[calc(100svh-12rem)]', 'items-center');
    expect(container.firstElementChild).toContainElement(screen.getByRole('status'));
  });

  it('stands in the middle of the space it was given when asked to be centred', () => {
    const { container } = render(<Spinner label="Reading" isCentered />);

    expect(container.firstElementChild).toHaveClass(
      'flex',
      'items-center',
      'justify-center',
      'w-full',
    );
    expect(container.firstElementChild).toContainElement(screen.getByRole('status'));
  });

  it('sits where it falls unless asked to be centred', () => {
    const { container } = render(<Spinner label="Reading" />);

    expect(container.firstElementChild).toBe(screen.getByRole('status'));
  });
});
