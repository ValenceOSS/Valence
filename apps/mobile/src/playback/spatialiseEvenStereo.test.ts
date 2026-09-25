import { requireOptionalNativeModule } from 'expo';
import { spatialiseEvenStereo } from './spatialiseEvenStereo';
import type { VideoPlayer } from 'expo-video';

jest.mock('expo', () => ({
  ...jest.requireActual<object>('expo'),
  requireOptionalNativeModule: jest.fn(),
}));

/* eslint-disable no-restricted-syntax -- a player is forty members of somebody else's interface and
   this hands it straight to native without reading one of them, so a stand-in is the only thing a
   test can pass and there is nothing about it to parse. */
const aPlayer = (): VideoPlayer => ({}) as unknown as VideoPlayer;
/* eslint-enable no-restricted-syntax */

const sayingItMay = jest.fn<boolean, [VideoPlayer]>();

beforeEach(() => {
  jest.mocked(requireOptionalNativeModule).mockReset();
  sayingItMay.mockReset().mockReturnValue(true);
});

describe('spatialiseEvenStereo', () => {
  it('asks the phone to place two channels as it would six', () => {
    jest.mocked(requireOptionalNativeModule).mockReturnValue({ spatialiseEvenStereo: sayingItMay });

    const player = aPlayer();

    expect(spatialiseEvenStereo(player)).toBe(true);
    expect(sayingItMay).toHaveBeenCalledWith(player);
  });

  it('asks for the one piece of Swift that knows how', () => {
    jest.mocked(requireOptionalNativeModule).mockReturnValue({ spatialiseEvenStereo: sayingItMay });

    spatialiseEvenStereo(aPlayer());

    expect(requireOptionalNativeModule).toHaveBeenCalledWith('ValenceSpatialAudio');
  });

  it('says nothing was said where there is nothing loaded to say it about', () => {
    sayingItMay.mockReturnValue(false);
    jest.mocked(requireOptionalNativeModule).mockReturnValue({ spatialiseEvenStereo: sayingItMay });

    expect(spatialiseEvenStereo(aPlayer())).toBe(false);
  });

  it('carries on where this build has no such piece of Swift in it', () => {
    jest.mocked(requireOptionalNativeModule).mockReturnValue(null);

    expect(spatialiseEvenStereo(aPlayer())).toBe(false);
  });
});
