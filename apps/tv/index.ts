import '@ValenceTv/platform/fillTheGaps';
import '@ValenceTv/platform/giveThisRuntimeCrypto';
import { registerRootComponent } from 'expo';
import { installTvPlatform } from '@ValenceTv/platform/installTvPlatform';
import { tellQueriesWhenOnScreen } from '@ValenceTv/platform/tellQueriesWhenOnScreen';
import { Television } from '@ValenceTv/Television';
import { startFocusEngine } from '@ValenceTv/focus/startFocusEngine';

installTvPlatform();
tellQueriesWhenOnScreen();
startFocusEngine();

registerRootComponent(Television);
