import { get } from '@react-native-cookies/cookies';
import { uploadAsync } from 'expo-file-system/legacy';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { sendAPhoto } from './sendAPhoto';

jest.mock('expo-file-system/legacy', () => ({
  FileSystemUploadType: { BINARY_CONTENT: 0 },
  uploadAsync: jest.fn(),
}));

const SERVER = 'http://192.168.1.36:8420';

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => SERVER }));
  jest.mocked(get).mockResolvedValue({ session: { name: 'session', value: 'abc' } });
});

afterEach(() => {
  forgetPlatform();
  jest.mocked(uploadAsync).mockReset();
});

describe('sendAPhoto', () => {
  it('sends the file itself to the server, signed in and saying what it is', async () => {
    jest
      .mocked(uploadAsync)
      .mockResolvedValue({ status: 204, body: '', headers: {}, mimeType: null });

    expect(await sendAPhoto('/api/profiles/one/photo', 'file:///phone/face.png')).toBeNull();
    expect(uploadAsync).toHaveBeenCalledWith(
      `${SERVER}/api/profiles/one/photo`,
      'file:///phone/face.png',
      expect.objectContaining({
        httpMethod: 'PUT',
        headers: { 'content-type': 'image/png', origin: SERVER, cookie: 'session=abc' },
      }),
    );
  });

  it('says why the server turned it down', async () => {
    jest.mocked(uploadAsync).mockResolvedValue({
      status: 413,
      body: JSON.stringify({ error: 'That picture is too large.' }),
      headers: {},
      mimeType: null,
    });

    expect(await sendAPhoto('/api/profiles/one/photo', 'file:///phone/face.jpg')).toBe(
      'That picture is too large.',
    );
  });

  it('says it could not be sent where it never reached the server', async () => {
    jest.mocked(uploadAsync).mockRejectedValue(new Error('offline'));

    expect(await sendAPhoto('/api/profiles/one/photo', 'file:///phone/face.jpg')).toBe(
      'That photo could not be sent.',
    );
  });
});
