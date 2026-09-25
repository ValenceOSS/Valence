import { requireOptionalNativeModule } from 'expo';
import { scanACode } from './scanACode';

jest.mock('expo', () => ({
  ...jest.requireActual<object>('expo'),
  requireOptionalNativeModule: jest.fn(),
}));

const scanning = jest.fn<Promise<object>, []>();

beforeEach(() => {
  jest.mocked(requireOptionalNativeModule).mockReset().mockReturnValue({ scan: scanning });
  scanning.mockReset();
});

describe('scanACode', () => {
  it('answers with what the code said', async () => {
    scanning.mockResolvedValue({ kind: 'read', text: 'http://tv.local/device?user_code=ABCD' });

    expect(await scanACode()).toEqual({
      kind: 'read',
      text: 'http://tv.local/device?user_code=ABCD',
    });
  });

  it('asks for the one piece of Swift that knows how', async () => {
    scanning.mockResolvedValue({ kind: 'closed' });

    await scanACode();

    expect(requireOptionalNativeModule).toHaveBeenCalledWith('ValenceCodeScanner');
  });

  it('says so where somebody closed it first', async () => {
    scanning.mockResolvedValue({ kind: 'closed' });

    expect(await scanACode()).toEqual({ kind: 'closed' });
  });

  it('says so where the camera may not be used', async () => {
    scanning.mockResolvedValue({ kind: 'refused' });

    expect(await scanACode()).toEqual({ kind: 'refused' });
  });

  it('cannot scan in a build without it', async () => {
    jest.mocked(requireOptionalNativeModule).mockReturnValue(null);

    expect(await scanACode()).toEqual({ kind: 'unable' });
  });

  it('cannot scan where the answer makes no sense', async () => {
    scanning.mockResolvedValue({ kind: 'read' });

    expect(await scanACode()).toEqual({ kind: 'unable' });
  });
});
