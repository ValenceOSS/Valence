import { swapTheHandBack } from '@ValenceClient/phone/swapTheHandBack';
import { aSecretAndItsChallenge } from '@ValencePhone/platform/aSecretAndItsChallenge';
import { signInOnTheWeb } from '@ValencePhone/platform/signInOnTheWeb';
import { signInThroughTheBrowser } from './signInThroughTheBrowser';

jest.mock('@ValenceClient/phone/swapTheHandBack', () => ({ swapTheHandBack: jest.fn() }));

jest.mock('@ValencePhone/platform/aSecretAndItsChallenge', () => ({
  aSecretAndItsChallenge: jest.fn(),
}));

jest.mock('@ValencePhone/platform/signInOnTheWeb', () => ({ signInOnTheWeb: jest.fn() }));

beforeEach(() => {
  jest
    .mocked(aSecretAndItsChallenge)
    .mockReset()
    .mockResolvedValue({ secret: 'the-secret', challenge: 'the-challenge' });
  jest.mocked(signInOnTheWeb).mockReset().mockResolvedValue('valence://signed-in?code=abc');
  jest.mocked(swapTheHandBack).mockReset().mockResolvedValue(true);
});

describe('signInThroughTheBrowser', () => {
  it('opens the sign-in page on this server with the challenge and not the secret', async () => {
    await signInThroughTheBrowser();

    const opened = jest.mocked(signInOnTheWeb).mock.calls[0]?.[0] ?? '';

    expect(opened).toMatch(/\/phone-sign-in\?challenge=the-challenge$/u);
    expect(opened).not.toContain('the-secret');
  });

  it('swaps the code that came back with the secret it kept', async () => {
    expect(await signInThroughTheBrowser()).toBe('in');
    expect(swapTheHandBack).toHaveBeenCalledWith('abc', 'the-secret');
  });

  it('says somebody gave up where they closed the sheet', async () => {
    jest.mocked(signInOnTheWeb).mockResolvedValue(null);

    expect(await signInThroughTheBrowser()).toBe('cancelled');
    expect(swapTheHandBack).not.toHaveBeenCalled();
  });

  it('says it failed where the sheet would not open', async () => {
    jest.mocked(signInOnTheWeb).mockRejectedValue(new Error('no sheet'));

    expect(await signInThroughTheBrowser()).toBe('failed');
  });

  it('says it failed where the page came back with no code', async () => {
    jest.mocked(signInOnTheWeb).mockResolvedValue('valence://signed-in');

    expect(await signInThroughTheBrowser()).toBe('failed');
    expect(swapTheHandBack).not.toHaveBeenCalled();
  });

  it('says it failed where the server would not swap it', async () => {
    jest.mocked(swapTheHandBack).mockResolvedValue(false);

    expect(await signInThroughTheBrowser()).toBe('failed');
  });
});
