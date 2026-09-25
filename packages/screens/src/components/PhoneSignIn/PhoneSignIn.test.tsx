import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signedInOnThisPage } from '@ValenceScreens/phone/signedInOnThisPage';
import { PhoneSignIn } from './PhoneSignIn';

const handBackToThePhone = vi.hoisted(() => vi.fn());
const fetchSession = vi.hoisted(() => vi.fn());
const useSearch = vi.hoisted(() => vi.fn());
const assign = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/phone/handBackToThePhone', () => ({ handBackToThePhone }));

vi.mock('@ValenceClient/session/auth', () => ({ fetchSession }));

vi.mock('@tanstack/react-router', () => ({ useSearch }));

const CHALLENGE = 'a'.repeat(64);

/**
 * Draws the page for somebody signed in as Marques.
 */
const drawIt = async () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PhoneSignIn name="Valence" />
    </QueryClientProvider>,
  );

  await screen.findByText('The Valence app on your phone asked to sign in as Marques.');
};

beforeEach(() => {
  useSearch.mockReset().mockReturnValue({ challenge: CHALLENGE });
  fetchSession.mockReset().mockResolvedValue({ id: 'user-1', name: 'Marques' });
  handBackToThePhone.mockReset().mockResolvedValue('valence://signed-in?code=abc');
  vi.stubGlobal('location', { ...window.location, assign });
  assign.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  signedInOnThisPage.forget();
});

describe('handing a sign-in back to the phone', () => {
  it('hands nothing back until somebody says to', async () => {
    await drawIt();

    expect(handBackToThePhone).not.toHaveBeenCalled();
  });

  it('hands it back against the challenge the phone sent', async () => {
    await drawIt();
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(handBackToThePhone).toHaveBeenCalledWith(CHALLENGE);
  });

  it('sends the browser back to the app with the code', async () => {
    await drawIt();
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith('valence://signed-in?code=abc');
    });
  });

  it('says so where the server would not hand it back', async () => {
    handBackToThePhone.mockResolvedValue(null);

    await drawIt();
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      await screen.findByText('That did not work. Close this and sign in from the app again.'),
    ).toBeInTheDocument();
  });

  it('offers nothing where the page was not opened by the app', async () => {
    useSearch.mockReturnValue({});

    await drawIt();

    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();
  });
});

describe('handing a sign-in back to the phone, from somebody who signed in on the page', () => {
  it('hands it straight back, without asking', async () => {
    signedInOnThisPage.mark();

    await drawIt();

    await waitFor(() => {
      expect(handBackToThePhone).toHaveBeenCalledWith(CHALLENGE);
    });
    expect(assign).toHaveBeenCalledWith('valence://signed-in?code=abc');
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
    expect(signedInOnThisPage.read()).toBe(false);
  });

  it('asks first where the browser was already signed in, whatever the link says', async () => {
    useSearch.mockReturnValue({ challenge: CHALLENGE, signedInHere: 'true' });

    await drawIt();

    expect(handBackToThePhone).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy();
  });
});
