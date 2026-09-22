import '@ValenceTv/platform/giveThisRuntimeCrypto';
import { registerRootComponent } from 'expo';
import { installTvPlatform } from '@ValenceTv/platform/installTvPlatform';
import { Television } from '@ValenceTv/Television';

installTvPlatform();

registerRootComponent(Television);
