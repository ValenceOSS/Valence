import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { ConfirmHiding } from './ConfirmHiding';
import type { Hiding } from '@ValenceClient/library/useHidden';

const fetchProfiles = vi.hoisted(() => vi.fn<() => Promise<ViewerProfile[]>>());

vi.mock('@ValenceClient/profiles/fetchProfiles', () => ({ fetchProfiles }));

const aFace = (id: string): ViewerProfile => ({
  id,
  name: id,
  colour: '#e8503a',
  avatar: { kind: 'initial' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

beforeEach(() => {
  fetchProfiles.mockReset().mockResolvedValue([aFace('dan')]);
});

const hiding = (overrides: Partial<Hiding> = {}): Hiding => ({
  entries: [],
  isHidden: () => false,
  asking: null,
  ask: vi.fn(),
  askLibrary: vi.fn(),
  dismiss: vi.fn(),
  confirm: vi.fn(),
  show: vi.fn(),
  ...overrides,
});

describe('ConfirmHiding', () => {
  it('asks nothing while nothing has been pressed', () => {
    renderInAnAddress(<ConfirmHiding hiding={hiding()} />);

    expect(screen.queryByRole('button', { name: 'Hide it' })).not.toBeInTheDocument();
  });

  it('names the film it is about to hide', async () => {
    renderInAnAddress(
      <ConfirmHiding
        hiding={hiding({ asking: { kind: 'item', subjectId: 'media-1', title: 'Arrival' } })}
      />,
    );

    expect(await screen.findByText('Hide Arrival?')).toBeInTheDocument();
  });

  it('names the programme, not the episode standing for it', async () => {
    renderInAnAddress(
      <ConfirmHiding
        hiding={hiding({
          asking: { kind: 'series', subjectId: 'series-1', title: 'Curb Your Enthusiasm' },
        })}
      />,
    );

    expect(await screen.findByText('Hide Curb Your Enthusiasm?')).toBeInTheDocument();
    expect(await screen.findByText(/Every episode of it disappears/i)).toBeInTheDocument();
  });

  it('says it affects nobody else, where there is somebody else', async () => {
    fetchProfiles.mockResolvedValue([aFace('dan'), aFace('kid')]);

    renderInAnAddress(
      <ConfirmHiding
        hiding={hiding({ asking: { kind: 'item', subjectId: 'media-1', title: 'Arrival' } })}
      />,
    );

    expect(
      await screen.findByText(/for you and for nobody else on this account/i),
    ).toBeInTheDocument();
  });

  it('says no such thing on an account with one face, there being nobody to reassure about', async () => {
    renderInAnAddress(
      <ConfirmHiding
        hiding={hiding({ asking: { kind: 'item', subjectId: 'media-1', title: 'Arrival' } })}
      />,
    );

    await screen.findByText('Hide Arrival?');

    expect(screen.queryByText(/nobody else on this account/i)).not.toBeInTheDocument();
  });

  it('says where the way back is, which is what makes it an easy yes', async () => {
    renderInAnAddress(
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

    renderInAnAddress(
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

    renderInAnAddress(
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
