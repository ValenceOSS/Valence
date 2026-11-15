import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';
import { heldCookies } from './heldCookies';

const SERVER = 'https://valence.example';

beforeEach(() => {
  heldCookies.forget();
  jest.mocked(theCookiesThisPhoneHolds).mockReset().mockResolvedValue('valence.session_token=abc');
  jest.useRealTimers();
});

describe('heldCookies', () => {
  it('knows nothing of a server until its jar has been read', () => {
    expect(heldCookies.now(`${SERVER}/poster`)).toBeUndefined();
  });

  it('holds what the jar said for every address on that server, without asking again', async () => {
    expect(await heldCookies.ask(`${SERVER}/one`)).toBe('valence.session_token=abc');
    expect(await heldCookies.ask(`${SERVER}/two`)).toBe('valence.session_token=abc');

    expect(heldCookies.now(`${SERVER}/three`)).toBe('valence.session_token=abc');
    expect(theCookiesThisPhoneHolds).toHaveBeenCalledTimes(1);
  });

  it('asks once for pictures drawn together, before the first answer arrives', async () => {
    await Promise.all([heldCookies.ask(`${SERVER}/one`), heldCookies.ask(`${SERVER}/two`)]);

    expect(theCookiesThisPhoneHolds).toHaveBeenCalledTimes(1);
  });

  it('keeps each server apart', async () => {
    await heldCookies.ask(`${SERVER}/one`);

    expect(heldCookies.now('https://other.example/one')).toBeUndefined();
  });

  it('needs nothing for a file the phone keeps itself', async () => {
    expect(heldCookies.now('file:///thumbnails/one.jpg')).toBeNull();
    expect(await heldCookies.ask('file:///thumbnails/one.jpg')).toBeNull();
    expect(theCookiesThisPhoneHolds).not.toHaveBeenCalled();
  });

  it('holds nothing where the phone holds no cookies, so the next picture reads the jar again', async () => {
    jest.mocked(theCookiesThisPhoneHolds).mockResolvedValue(null);

    expect(await heldCookies.ask(`${SERVER}/one`)).toBeNull();
    expect(heldCookies.now(`${SERVER}/one`)).toBeUndefined();

    await heldCookies.ask(`${SERVER}/two`);

    expect(theCookiesThisPhoneHolds).toHaveBeenCalledTimes(2);
  });

  it('reads the jar again once what it holds may have gone stale, and says where it changed', async () => {
    jest.useFakeTimers({ now: 0 });

    const told = jest.fn();
    const stop = heldCookies.listen(told);

    await heldCookies.ask(`${SERVER}/one`);
    told.mockClear();
    jest.mocked(theCookiesThisPhoneHolds).mockResolvedValue('valence.session_token=def');
    jest.setSystemTime(61_000);

    expect(await heldCookies.ask(`${SERVER}/two`)).toBe('valence.session_token=def');
    expect(heldCookies.now(SERVER)).toBe('valence.session_token=def');
    expect(told).toHaveBeenCalledTimes(1);

    stop();
  });

  it('lets go of everything held on signing out, and says so', async () => {
    const told = jest.fn();
    const stop = heldCookies.listen(told);

    await heldCookies.ask(`${SERVER}/one`);
    told.mockClear();
    heldCookies.forget();

    expect(heldCookies.now(`${SERVER}/one`)).toBeUndefined();
    expect(told).toHaveBeenCalledTimes(1);

    stop();
  });

  it('does not keep an answer read before everything was let go of', async () => {
    const reading = heldCookies.ask(`${SERVER}/one`);

    heldCookies.forget();
    await reading;

    expect(heldCookies.now(`${SERVER}/one`)).toBeUndefined();
  });

  it('stops telling a listener that has stopped listening', async () => {
    const told = jest.fn();

    heldCookies.listen(told)();
    await heldCookies.ask(`${SERVER}/one`);

    expect(told).not.toHaveBeenCalled();
  });
});
