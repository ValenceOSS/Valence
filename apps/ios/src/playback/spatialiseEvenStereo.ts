import { requireOptionalNativeModule } from 'expo';
import type { VideoPlayer } from 'expo-video';

type SpatialAudio = {
  spatialiseEvenStereo: (player: VideoPlayer) => boolean;
};

/**
 * Tells iOS it may place a two channel soundtrack around somebody, as it does a six channel one.
 *
 * Almost nothing a household owns is mixed for more than two channels, and iOS will happily fake
 * the rest — but only for a player that has said it may, and the saying is a property no React
 * Native package exposes. So a small piece of Swift says it.
 *
 * Asked of the player rather than set once for the application, because the property belongs to
 * whatever is playing and there is a new one of those for every film.
 *
 * Looked for when it is wanted rather than when this is loaded, so a build without the Swift in it
 * carries on quietly instead of failing to start.
 *
 * @param player - What is playing.
 * @returns Whether it was said, which is false where nothing is loaded to say it about.
 */
const spatialiseEvenStereo = (player: VideoPlayer): boolean =>
  requireOptionalNativeModule<SpatialAudio>('ValenceSpatialAudio')?.spatialiseEvenStereo(player) ??
  false;

export { spatialiseEvenStereo };
