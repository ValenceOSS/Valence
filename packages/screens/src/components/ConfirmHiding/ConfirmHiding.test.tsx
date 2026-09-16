import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmHiding } from './ConfirmHiding';
import type { Hiding } from '@ValenceClient/library/useHidden';

const hiding = (overrides: Partial<Hiding> = {}): Hiding => ({
  entries: [],
  isHidden: () => false,
  asking: null,
  ask: vi.fn(),
  dismiss: vi.fn(),
  confirm: vi.fn(),
  show: vi.fn(),
  ...overrides,
});

describe('ConfirmHiding', () => {
  it('asks nothing while nothing has been pressed', () => {
    render(<ConfirmHiding hiding={hiding()} />);

    expect(screen.queryByRole('button', { name: 'Hide it' })).not.toBeInTheDocument();
  });

  it('names the film it is about to hide', async () => {
    render(
      <ConfirmHiding
        hiding={hiding({ asking: { kind: 'item', subjectId: 'media-1', title: 'Arrival' } })}
      />,
    );

    expect(await screen.findByText('Hide Arrival?')).toBeInTheDocument();
  });

  it('names the programme, not the episode standing for it', async () => {
    render(
      <ConfirmHiding
        hiding={hiding({
          asking: { kind: 'series', subjectId: 'series-1', title: 'Curb Your Enthusiasm' },
        })}
      />,
    );

    expect(await screen.findByText('Hide Curb Your Enthusiasm?')).toBeInTheDocument();
    expect(await screen.findByText(/Every episode of it disappears/i)).toBeInTheDocument();
  });

  it('says it affects nobody else on the account', async () => {
    render(
      <ConfirmHiding
        hiding={hiding({ asking: { kind: 'item', subjectId: 'media-1', title: 'Arrival' } })}
      />,
    );

    expect(await screen.findByText(/not for anybody else on this account/i)).toBeInTheDocument();
  });

  it('says where the way back is, which is what makes it an easy yes', async () => {
    render(
      <ConfirmHiding
        hiding={hiding({ asking: { kind: 'item', subjectId: 'media-1', title: 'Arrival' } })}
      />,
    );

    expect(
      await screen.findByText(/Bring it back from Hidden on your profile/i),
    ).toBeInTheDocument();
  });

  it('hides it when somebody agrees, and says so to whoever was showing it', async () => {
    const user = userEvent.setup();
    const confirm = vi.fn();
    const onHidden = vi.fn();

    render(
      <ConfirmHiding
        hiding={hiding({
          asking: { kind: 'item', subjectId: 'media-1', title: 'Arrival' },
          confirm,
        })}
        onHidden={onHidden}
      />,
    );

    await user.click(await screen.findByRole('button', { name: 'Hide it' }));

    expect(confirm).toHaveBeenCalled();
    expect(onHidden).toHaveBeenCalled();
  });

  it('hides nothing when somebody thinks better of it', async () => {
    const user = userEvent.setup();
    const confirm = vi.fn();
    const dismiss = vi.fn();

    render(
      <ConfirmHiding
        hiding={hiding({
          asking: { kind: 'item', subjectId: 'media-1', title: 'Arrival' },
          confirm,
          dismiss,
        })}
      />,
    );

    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(dismiss).toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });
});
