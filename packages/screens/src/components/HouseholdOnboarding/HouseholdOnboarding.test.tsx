import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HouseholdOnboarding } from './HouseholdOnboarding';

const saveHousehold = vi.hoisted(() => vi.fn(() => Promise.resolve<object | null>({})));
const uploadHouseholdPhoto = vi.hoisted(() => vi.fn(() => Promise.resolve<string | null>(null)));
const finishOnboarding = vi.hoisted(() => vi.fn(() => Promise.resolve(true)));

vi.mock('@ValenceClient/household/fetchHousehold', () => ({
  saveHousehold,
  uploadHouseholdPhoto,
  finishOnboarding,
  fetchOnboarding: vi.fn(),
}));

vi.mock('@ValenceScreens/components/PasskeySetup/PasskeySetup', () => ({
  PasskeySetup: () => <p>Passkeys go here</p>,
}));

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
});

describe('setting a household up', () => {
  it('starts on the name, filled in with what the account is already called', () => {
    render(<HouseholdOnboarding household={HOUSEHOLD} onDone={vi.fn()} />);

    expect(screen.getByLabelText(/What is this household called/)).toHaveValue('Dan');
  });

  it('will not go on without a name, and says so where it is typed', async () => {
    render(<HouseholdOnboarding household={HOUSEHOLD} onDone={vi.fn()} />);

    await userEvent.clear(screen.getByLabelText(/What is this household called/));
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Give the household a name.')).toBeInTheDocument();
    expect(saveHousehold).not.toHaveBeenCalled();
  });

  it('saves the name without the spaces somebody typed around it', async () => {
    render(<HouseholdOnboarding household={HOUSEHOLD} onDone={vi.fn()} />);

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

    render(<HouseholdOnboarding household={HOUSEHOLD} onDone={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('That name could not be saved.')).toBeInTheDocument();
  });

  it('lets somebody past the picture without choosing one', async () => {
    render(<HouseholdOnboarding household={HOUSEHOLD} onDone={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByRole('button', { name: 'Not now' })).toBeInTheDocument();
  });

  it('says what was wrong with a picture it would not take', async () => {
    uploadHouseholdPhoto.mockResolvedValue('A picture has to be 6 MB or smaller.');

    render(<HouseholdOnboarding household={HOUSEHOLD} onDone={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('button', { name: 'Not now' });

    await userEvent.upload(
      screen.getByLabelText('Choose a picture'),
      new File(['bytes'], 'face.png', { type: 'image/png' }),
    );

    expect(await screen.findByText('A picture has to be 6 MB or smaller.')).toBeInTheDocument();
  });

  it('records nothing as finished until the last step is pressed', async () => {
    render(<HouseholdOnboarding household={HOUSEHOLD} onDone={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('button', { name: 'Not now' });

    expect(finishOnboarding).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Not now' }));
    await screen.findByRole('button', { name: 'Finish' });

    expect(finishOnboarding).not.toHaveBeenCalled();
  });

  it('is done only once the server has recorded it', async () => {
    const onDone = vi.fn();

    render(<HouseholdOnboarding household={HOUSEHOLD} onDone={onDone} />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Finish' }));

    await waitFor(() => {
      expect(onDone).toHaveBeenCalled();
    });
  });

  it('holds somebody where they are if finishing did not land', async () => {
    const onDone = vi.fn();

    finishOnboarding.mockResolvedValue(false);

    render(<HouseholdOnboarding household={HOUSEHOLD} onDone={onDone} />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Finish' }));

    await waitFor(() => {
      expect(finishOnboarding).toHaveBeenCalled();
    });

    expect(onDone).not.toHaveBeenCalled();
  });
});
