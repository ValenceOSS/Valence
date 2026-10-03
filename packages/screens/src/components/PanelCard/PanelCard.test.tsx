import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { waitForArrivals } from '@ValenceScreens/testing/waitForArrivals';
import { PanelCard } from './PanelCard';

describe('PanelCard', () => {
  it('names the block it holds, so it reads as one piece rather than a loose panel', () => {
    render(
      <PanelCard title="Libraries">
        <p>Films</p>
      </PanelCard>,
    );

    const card = screen.getByRole('heading', { name: 'Libraries' }).closest('section');

    expect(card).not.toBeNull();
    expect(within(card ?? document.body).getByText('Films')).toBeInTheDocument();
  });

  it('sets its controls in the shell beside the name, not on the panel', () => {
    render(
      <PanelCard title="Webhooks" actions={<span>Add a webhook</span>}>
        <p>Nothing is being told about anything.</p>
      </PanelCard>,
    );

    const heading = screen.getByRole('heading', { name: 'Webhooks' });
    const strip = heading.closest('header');

    expect(strip).not.toBeNull();
    expect(within(strip ?? document.body).getByText('Add a webhook')).toBeInTheDocument();
    expect(
      within(strip ?? document.body).queryByText('Nothing is being told about anything.'),
    ).not.toBeInTheDocument();
  });

  it('holds its content in a panel set into the shell', () => {
    const { container } = render(
      <PanelCard title="Roles">
        <p>Administrator</p>
      </PanelCard>,
    );

    const shell = container.querySelector('section');
    const face = screen.getByText('Administrator').parentElement;

    expect(shell).toHaveClass('valence-card-shell');
    expect(face).toHaveClass('valence-card-face');
    expect(face).toHaveClass('p-4');
  });

  it('lets a table run to the panel edges when asked to', () => {
    render(
      <PanelCard title="Logs" isFlush>
        <p>A line</p>
      </PanelCard>,
    );

    expect(screen.getByText('A line').parentElement).not.toHaveClass('p-4');
  });

  it('takes the caller layout classes on its shell', () => {
    const { container } = render(
      <PanelCard title="Recent jobs" className="lg:col-span-4">
        <p>Making a preview</p>
      </PanelCard>,
    );

    expect(container.querySelector('section')).toHaveClass('lg:col-span-4');
  });

  it('rings the block in the accent only when it is highlighted', () => {
    const { container, rerender } = render(<PanelCard title="Plain">x</PanelCard>);

    expect(container.firstElementChild).not.toHaveClass('ring-1');

    rerender(
      <PanelCard title="New" isHighlighted>
        x
      </PanelCard>,
    );

    expect(container.firstElementChild).toHaveClass('ring-1', 'ring-accent/40');
  });

  it('draws its heading smaller only when asked to be compact', () => {
    const { rerender } = render(
      <PanelCard title="Friday">
        <p>Two episodes.</p>
      </PanelCard>,
    );

    expect(screen.getByRole('heading', { name: 'Friday' })).toHaveClass('text-[0.6875rem]');

    rerender(
      <PanelCard title="Friday" isCompact>
        <p>Two episodes.</p>
      </PanelCard>,
    );

    expect(screen.getByRole('heading', { name: 'Friday' })).toHaveClass('text-[0.625rem]');
    expect(screen.getByRole('heading', { name: 'Friday' }).parentElement).toHaveClass('min-h-7');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PanelCard.displayName).toBe('PanelCard');
  });

  it('names itself in quiet capitals, as every card title does', () => {
    render(
      <PanelCard title="Storage">
        <p>Inside</p>
      </PanelCard>,
    );

    expect(screen.getByRole('heading', { name: 'Storage' })).toHaveClass(
      'uppercase',
      'text-text/50',
    );
  });

  it('rises in as it arrives, rather than being there at once', async () => {
    render(
      <PanelCard title="Storage">
        <p>Inside</p>
      </PanelCard>,
    );

    const card = screen.getByText('Inside').closest('section');

    expect(card).not.toBeVisible();

    await waitForArrivals();

    expect(card).toBeVisible();
  });
});
