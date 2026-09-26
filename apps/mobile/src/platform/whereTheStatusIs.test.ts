import { requireOptionalNativeModule } from 'expo';
import { whereTheStatusIs } from './whereTheStatusIs';

jest.mock('expo', () => ({
  ...jest.requireActual<object>('expo'),
  requireOptionalNativeModule: jest.fn(),
}));

const FRAME = { x: 787, y: 12, width: 84, height: 24 };

beforeEach(() => {
  jest.mocked(requireOptionalNativeModule).mockReset();
});

describe('whereTheStatusIs', () => {
  it('cannot say in a build without the Swift that knows', async () => {
    jest.mocked(requireOptionalNativeModule).mockReturnValue(null);

    expect(await whereTheStatusIs()).toBeNull();
  });

  it('answers with where the system draws its status', async () => {
    jest
      .mocked(requireOptionalNativeModule)
      .mockReturnValue({ statusFrame: () => Promise.resolve(FRAME) });

    expect(await whereTheStatusIs()).toEqual(FRAME);
    expect(requireOptionalNativeModule).toHaveBeenCalledWith('ValenceSideStrip');
  });
});
