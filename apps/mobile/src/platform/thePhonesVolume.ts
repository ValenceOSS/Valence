import { requireOptionalNativeModule } from 'expo';
import type { VolumeModule } from './thePhonesVolume.types';

const thePhonesVolume = requireOptionalNativeModule<VolumeModule>('ValenceVolume');

export { thePhonesVolume };
