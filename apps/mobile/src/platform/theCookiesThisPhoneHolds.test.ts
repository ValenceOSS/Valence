import { get } from '@react-native-cookies/cookies';
import { theCookiesThisPhoneHolds } from './theCookiesThisPhoneHolds';

beforeEach(() => {
  jest.mocked(get).mockReset();
});

describe('theCookiesThisPhoneHolds', () => {
  it('hands over what it holds, as a server would be sent it', async () => {
    jest.mocked(get).mockResolvedValue({
      'valence.session_token': { name: 'valence.session_token', value: 'abc' },
    });

    expect(await theCookiesThisPhoneHolds('https://valence.example')).toBe(
      'valence.session_token=abc',
    );
  });

  it('joins several, since a session is rarely only one', async () => {
    jest.mocked(get).mockResolvedValue({
      one: { name: 'one', value: '1' },
      two: { name: 'two', value: '2' },
    });

    expect(await theCookiesThisPhoneHolds('https://valence.example')).toBe('one=1; two=2');
  });

  it('says it holds none rather than sending an empty header', async () => {
    jest.mocked(get).mockResolvedValue({});

    expect(await theCookiesThisPhoneHolds('https://valence.example')).toBeNull();
  });

  it('says it holds none where the jar could not be read', async () => {
    jest.mocked(get).mockRejectedValue(new Error('no jar'));

    expect(await theCookiesThisPhoneHolds('https://valence.example')).toBeNull();
  });
});
