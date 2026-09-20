import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';

const badgeOf = (text: string): HTMLElement => screen.getByText(text);

describe('Badge', () => {
  it('states what it was given', () => {
    render(<Badge>4K</Badge>);

    expect(screen.getByText('4K')).toBeInTheDocument();
  });

  it('is not something anyone can press', () => {
    render(<Badge>4K</Badge>);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('states a fact quietly by default', () => {
    render(<Badge>HDR10</Badge>);

    expect(badgeOf('HDR10')).toHaveClass('text-text-muted');
  });

  it('speaks up when something matters', () => {
    render(<Badge tone="accent">New</Badge>);

    expect(screen.getByText('New')).not.toHaveClass('text-text-muted');
  });

  it('stays readable on artwork rather than dissolving into it', () => {
    render(<Badge tone="solid">TV-14</Badge>);

    expect(badgeOf('TV-14')).toHaveClass('bg-shade');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Badge.displayName).toBe('Badge');
  });

  it('paints a fact that is wrong differently from one that is merely notable', () => {
    render(<Badge tone="danger">NVENC</Badge>);

    expect(badgeOf('NVENC')).toHaveClass('bg-danger');
  });

  it('is a solid fill rather than glass over whatever is behind it', () => {
    render(
      <>
        <Badge tone="quiet">One</Badge>
        <Badge tone="accent">Two</Badge>
        <Badge tone="danger">Three</Badge>
      </>,
    );

    for (const text of ['One', 'Two', 'Three']) {
      expect(badgeOf(text).className).not.toMatch(/backdrop-blur|bg-[a-z]+\/\d+/);
    }
  });

  it('sets its text in semibold', () => {
    render(<Badge>4K</Badge>);

    expect(badgeOf('4K')).toHaveClass('font-semibold');
  });

  it('spins while something is in progress, and not once it has settled', () => {
    render(
      <>
        <Badge tone="busy">Running</Badge>
        <Badge tone="success">Done</Badge>
      </>,
    );

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(badgeOf('Running')).toContainElement(screen.getByRole('status'));
    expect(badgeOf('Running').lastElementChild).toBe(screen.getByRole('status'));
  });

  it('is not text anybody drags a cursor through', () => {
    render(<Badge>4K</Badge>);

    expect(badgeOf('4K')).toHaveClass('select-none');
  });

  it('paints a costly choice differently from a broken one', () => {
    render(<Badge tone="warning">Software only</Badge>);

    expect(badgeOf('Software only')).toHaveClass('bg-highlight');
  });

  it('paints a good outcome in its own colour rather than borrowing the one for attention', () => {
    render(<Badge tone="success">Finished</Badge>);

    expect(badgeOf('Finished')).toHaveClass('bg-success');
    expect(badgeOf('Finished')).not.toHaveClass('bg-accent');
  });

  it('paints something under way in its own colour, apart from a warning', () => {
    render(<Badge tone="busy">Downloading</Badge>);

    expect(badgeOf('Downloading')).toHaveClass('bg-busy');
    expect(badgeOf('Downloading')).not.toHaveClass('bg-highlight');
  });
});
