import '@ValenceTv/platform/giveThisRuntimeCrypto';
import { registerRootComponent } from 'expo';
import { installTvPlatform } from '@ValenceTv/platform/installTvPlatform';
import { tellQueriesWhenOnScreen } from '@ValenceTv/platform/tellQueriesWhenOnScreen';
import { Television } from '@ValenceTv/Television';

installTvPlatform();
tellQueriesWhenOnScreen();

registerRootComponent(Television);
