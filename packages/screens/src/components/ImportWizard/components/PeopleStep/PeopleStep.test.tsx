import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Answer } from '@ValenceClient/admin/sendToServer';
import type { MediaImportPerson, PlexPin } from '@ValenceContracts/schemas/MediaImport';
import { PeopleStep } from './PeopleStep';

const fetchImportPeople =
  vi.fn<(sourceId: string) => Promise<Answer<{ people: MediaImportPerson[] }>>>();
const givePlexPin = vi.fn<(sourceId: string, pin: PlexPin) => Promise<Answer<{ done: boolean }>>>();

vi.mock('@ValenceClient/imports/fetchImportPeople', () => ({
  fetchImportPeople: (sourceId: string) => fetchImportPeople(sourceId),
}));

vi.mock('@ValenceClient/imports/givePlexPin', () => ({
  givePlexPin: (sourceId: string, pin: PlexPin) => givePlexPin(sourceId, pin),
}));

const SOURCE = {
  id: 'shed',
  kind: 'plex' as const,
  name: 'Shed',
  url: 'http://shed:32400',
  version: '1.41',
  createdAt: '2026-10-02T00:00:00.000Z',
};

const PEOPLE: MediaImportPerson[] = [
  { id: '1111', name: 'Lee', isAdministrator: true, isDisabled: false, access: 'readable' },
  { id: '2222', name: 'Ash', isAdministrator: false, isDisabled: true, access: 'needsPin' },
  { id: '4444', name: 'Fran', isAdministrator: false, isDisabled: false, access: 'unreadable' },
];

beforeEach(() => {
  fetchImportPeople.mockReset().mockResolvedValue({ kind: 'answered', value: { people: PEOPLE } });
  givePlexPin.mockReset();
});

describe('PeopleStep', () => {
  it('lists everybody, takes the administrator to be the one importing, and passes on who is left out', async () => {
    const onContinue = vi.fn();

    render(<PeopleStep source={SOURCE} onContinue={onContinue} onBack={vi.fn()} />);

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Fran' }));
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('button', { name: 'Which of them is you?' })).toHaveTextContent('Lee');
    expect(screen.getByText('Disabled')).toBeVisible();
    expect(screen.getByText(/Plex doesn’t share this user’s watch data/)).toBeVisible();
    expect(onContinue).toHaveBeenCalledWith({ skipUserIds: ['4444'], meUserId: '1111' });
  });

  it('can name nobody as the administrator, and bring somebody back in', async () => {
    const onContinue = vi.fn();

    render(<PeopleStep source={SOURCE} onContinue={onContinue} onBack={vi.fn()} />);

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Fran' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Fran' }));
    await userEvent.click(screen.getByRole('button', { name: 'Which of them is you?' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: /None of them/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onContinue).toHaveBeenCalledWith({ skipUserIds: [], meUserId: null });
  });

  it('takes a Home member’s PIN, reading everybody again once it worked', async () => {
    givePlexPin
      .mockResolvedValueOnce({ kind: 'refused', refusal: { message: 'That PIN is incorrect.' } })
      .mockResolvedValue({ kind: 'answered', value: { done: true } });
    render(<PeopleStep source={SOURCE} onContinue={vi.fn()} onBack={vi.fn()} />);

    const pin = await screen.findByLabelText('Their PIN');

    expect(screen.getByRole('button', { name: 'Use PIN' })).toBeDisabled();

    await userEvent.type(pin, '0000');
    await userEvent.click(screen.getByRole('button', { name: 'Use PIN' }));

    expect(await screen.findByText('That PIN is incorrect.')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Use PIN' }));

    await waitFor(() => {
      expect(fetchImportPeople).toHaveBeenCalledTimes(2);
    });
    expect(givePlexPin).toHaveBeenLastCalledWith('shed', { userId: '2222', pin: '0000' });
  });

  it('says why the people could not be read, and reads them again when asked', async () => {
    const onBack = vi.fn();

    fetchImportPeople.mockResolvedValueOnce({
      kind: 'refused',
      refusal: { message: 'Couldn’t connect to plex.tv.' },
    });
    render(<PeopleStep source={SOURCE} onContinue={vi.fn()} onBack={onBack} />);

    expect(await screen.findByText(/Couldn’t connect to plex\.tv\./)).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: /Try again/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalledOnce();
  });
});
