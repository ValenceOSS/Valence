import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import userEvent from '@testing-library/user-event';
import { HouseholdOnboarding } from './HouseholdOnboarding';
import type { ReactElement } from 'react';

const saveHousehold = vi.hoisted(() => vi.fn(() => Promise.resolve<object | null>({})));
const uploadHouseholdPhoto = vi.hoisted(() => vi.fn(() => Promise.resolve<string | null>(null)));
const finishOnboarding = vi.hoisted(() => vi.fn(() => Promise.resolve(true)));
const registerPasskey = vi.hoisted(() => vi.fn(() => Promise.resolve({ kind: 'registered' })));

vi.mock('@ValenceClient/household/fetchHousehold', () => ({
  saveHousehold,
  uploadHouseholdPhoto,
  finishOnboarding,
  fetchOnboarding: vi.fn(),
}));

vi.mock('@ValenceClient/session/auth', () => ({ registerPasskey }));

const renderSetup = (ui: ReactElement) => render(ui, { wrapper: CacheScope });

const HOUSEHOLD = {
  name: 'Dan',
  colour: '#3ac47d' as const,
  avatar: { kind: 'initial' as const },
  updatedAt: '2026-09-18T00:00:00.000Z',
};

beforeEach(() => {
  saveHousehold.mockClear().mockResolvedValue({});
  uploadHouseholdPhoto.mockClear().mockResolvedValue(null);
  finishOnboarding.mockClear().mockResolvedValue(true);
  registerPasskey.mockClear().mockResolvedValue({ kind: 'registered' });
});

describe('setting a household up', () => {
  it('starts on the name, filled in with what the account is already called', () => {
    renderSetup(<HouseholdOnboarding household={HOUSEHOLD} onDone={vi.fn()} />);

    expect(screen.getByLabelText(/What is this household called/)).toHaveValue('Dan');
  });

  it('will not go on without a name, and says so where it is typed', async () => {
    renderSetup(<HouseholdOnboarding household={HOUSEHOLD} onDone={vi.fn()} />);

    await userEvent.clear(screen.getByLabelText(/What is this household called/));
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Give the household a name.')).toBeInTheDocument();
    expect(saveHousehold).not.toHaveBeenCalled();
  });

  it('saves the name without the spaces somebody typed around it', async () => {
    renderSetup(<HouseholdOnboarding household={HOUSEHOLD} onDone={vi.fn()} />);

    const field = screen.getByLabelText(/What is this household called/);

    await userEvent.clear(field);
    await userEvent.type(field, '  The Morgans  ');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(saveHousehold).toHaveBeenCalledWith({ name: 'The Morgans' });
    });
  });

  it('stays where it is when the name could not be saved', async () => {
    saveHousehold.mockResolvedValue(null);

    renderSetup(<HouseholdOnboarding household={HOUSEHOLD} onDone={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('That name could not be saved.')).toBeInTheDocument();
  });

  it('lets somebody past the picture without choosing one', async () => {
    renderSetup(<HouseholdOnboarding household={HOUSEHOLD} onDone={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByRole('button', { name: 'Not now' })).toBeInTheDocument();
  });

  it('says what was wrong with a picture it would not take', async () => {
    uploadHouseholdPhoto.mockResolvedValue('A picture has to be 6 MB or smaller.');

    renderSetup(<HouseholdOnboarding household={HOUSEHOLD} onDone={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('button', { name: 'Not now' });

    await userEvent.upload(
      screen.getByLabelText('Choose a picture'),
      new File(['bytes'], 'face.png', { type: 'image/png' }),
    );

    expect(await screen.findByText('A picture has to be 6 MB or smaller.')).toBeInTheDocument();
  });

  it('records nothing as finished until the last step is pressed', async () => {
    renderSetup(<HouseholdOnboarding household={HOUSEHOLD} onDone={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('button', { name: 'Not now' });

    expect(finishOnboarding).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Not now' }));
    await screen.findByRole('button', { name: 'Finish' });

    expect(finishOnboarding).not.toHaveBeenCalled();
  });

  it('welcomes somebody by the name they chose before handing them the library', async () => {
    const onDone = vi.fn();

    renderSetup(<HouseholdOnboarding household={HOUSEHOLD} onDone={onDone} />);

    const field = screen.getByLabelText(/What is this household called/);

    await userEvent.clear(field);
    await userEvent.type(field, 'The Morgans');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Finish' }));

    expect(await screen.findByText('Welcome to Valence')).toBeInTheDocument();
    expect(screen.getByText(/The Morgans is ready/)).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('is done once the welcome has said its piece', async () => {
    const onDone = vi.fn();

    renderSetup(<HouseholdOnboarding household={HOUSEHOLD} onDone={onDone} />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Finish' }));

    await screen.findByText('Welcome to Valence');

    await waitFor(
      () => {
        expect(onDone).toHaveBeenCalled();
      },
      { timeout: 5000 },
    );
  });

  it('says why a passkey cannot be offered rather than leaving the step empty', async () => {
    renderSetup(<HouseholdOnboarding household={HOUSEHOLD} onDone={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));

    expect(await screen.findByText(/Passkeys need a secure connection/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add a passkey' })).not.toBeInTheDocument();
  });

  it('holds somebody where they are if finishing did not land', async () => {
    const onDone = vi.fn();

    finishOnboarding.mockResolvedValue(false);

    renderSetup(<HouseholdOnboarding household={HOUSEHOLD} onDone={onDone} />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Finish' }));

    await waitFor(() => {
      expect(finishOnboarding).toHaveBeenCalled();
    });

    expect(onDone).not.toHaveBeenCalled();
  });
});
