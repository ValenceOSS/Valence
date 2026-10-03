import { CircleCheck as CircleCheckIcon } from '@keyline-icons/react/fill';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';

const badgeOf = (text: string): HTMLElement => screen.getByText(text);

describe('Badge', () => {
  it('draws a quiet badge in the same gray as a selector track', () => {
    render(<Badge>Books</Badge>);

    expect(badgeOf('Books')).toHaveClass('bg-[var(--surface-hover)]');
  });

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

    expect(badgeOf('TV-14')).toHaveClass('bg-overlay');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Badge.displayName).toBe('Badge');
  });

  it('paints a fact that is wrong differently from one that is merely notable', () => {
    render(<Badge tone="danger">NVENC</Badge>);

    expect(badgeOf('NVENC')).toHaveClass('bg-danger/15', 'text-danger');
  });

  it('is a tint of its tone rather than glass over whatever is behind it', () => {
    render(
      <>
        <Badge tone="quiet">One</Badge>
        <Badge tone="accent">Two</Badge>
        <Badge tone="danger">Three</Badge>
      </>,
    );

    for (const text of ['One', 'Two', 'Three']) {
      expect(badgeOf(text).className).not.toMatch(/backdrop-blur/);
    }

    expect(badgeOf('Two')).toHaveClass('bg-accent/15', 'text-accent');
  });

  it('sets its text in medium weight', () => {
    render(<Badge>4K</Badge>);

    expect(badgeOf('4K')).toHaveClass('font-medium');
  });

  it('says how a settled outcome went with a solid mark after its words', () => {
    const { container } = render(
      <>
        <Badge tone="success">Done</Badge>
        <Badge tone="warning">Slow</Badge>
        <Badge tone="danger">Failed</Badge>
        <Badge tone="waiting">Queued</Badge>
      </>,
    );

    for (const text of ['Done', 'Slow', 'Failed', 'Queued']) {
      expect(badgeOf(text).firstChild?.textContent).toBe(text);
      expect(badgeOf(text).lastElementChild?.tagName.toLowerCase()).toBe('svg');
    }

    expect(container.querySelectorAll('svg')).toHaveLength(4);
  });

  it('draws no mark for a tone that is only a fact', () => {
    render(<Badge tone="quiet">4K</Badge>);

    expect(badgeOf('4K').querySelector('svg')).toBeNull();
  });

  it('draws the mark it is given in place of the one its tone carries', () => {
    render(
      <Badge tone="quiet" icon={CircleCheckIcon}>
        Live
      </Badge>,
    );

    expect(badgeOf('Live').querySelector('svg')).not.toBeNull();
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

    expect(badgeOf('Software only')).toHaveClass('bg-highlight/15', 'text-highlight');
  });

  it('paints a good outcome in its own colour rather than borrowing the one for attention', () => {
    render(<Badge tone="success">Finished</Badge>);

    expect(badgeOf('Finished')).toHaveClass('bg-success/15', 'text-success');
    expect(badgeOf('Finished')).not.toHaveClass('bg-accent');
  });

  it('paints something under way in its own colour, apart from a warning', () => {
    render(<Badge tone="busy">Downloading</Badge>);

    expect(badgeOf('Downloading')).toHaveClass('bg-busy/15', 'text-busy');
    expect(badgeOf('Downloading')).not.toHaveClass('bg-highlight');
  });

  it('takes a colour of its own in place of a tone', () => {
    render(<Badge colour="#F1C40F">Manager</Badge>);

    expect(badgeOf('Manager')).toHaveStyle({ backgroundColor: 'rgb(241, 196, 15)' });
    expect(badgeOf('Manager').className).not.toContain('bg-muted');
  });

  it('sets its words in an ink that reads on the colour it was given', () => {
    render(
      <>
        <Badge colour="#F1C40F">Light</Badge>
        <Badge colour="#206694">Dark</Badge>
      </>,
    );

    expect(badgeOf('Light')).toHaveStyle({ color: 'rgb(17, 17, 17)' });
    expect(badgeOf('Dark')).toHaveStyle({ color: 'rgb(255, 255, 255)' });
  });

  it('keeps its tone where it has no colour of its own', () => {
    render(
      <Badge colour={null} tone="danger">
        Down
      </Badge>,
    );

    expect(badgeOf('Down')).toHaveClass('bg-danger/15', 'text-danger');
  });

  it('paints something waiting in the colour of work under way, without the spinner', () => {
    render(<Badge tone="waiting">Queued</Badge>);

    expect(badgeOf('Queued')).toHaveClass('bg-busy/15', 'text-busy');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('outlines a badge in the colour of the words around it', () => {
    render(<Badge tone="outline">HD</Badge>);

    expect(badgeOf('HD')).toHaveClass('border', 'border-current/60', 'bg-transparent');
  });
});
