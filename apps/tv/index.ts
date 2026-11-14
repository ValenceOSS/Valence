import '@ValenceTv/platform/fillTheGaps';
import '@ValenceTv/platform/giveThisRuntimeCrypto';
import { registerRootComponent } from 'expo';
import { installTvPlatform } from '@ValenceTv/platform/installTvPlatform';
import { tellQueriesWhenOnScreen } from '@ValenceTv/platform/tellQueriesWhenOnScreen';
import { Television } from '@ValenceTv/Television';
import { startFocusEngine } from '@ValenceTv/focus/startFocusEngine';
import { fitTheScreen } from '@ValenceTv/platform/fitTheScreen';
import { followTheController } from '@ValenceTv/remote/followTheController';
import { answerAlertsOnScreen } from '@ValenceTv/platform/answerAlertsOnScreen';
import { speakTheKeptWords } from '@ValenceClient/language/speakTheKeptWords';
import { thisDevicesLanguages } from '@ValenceClient/language/thisDevicesLanguages';
import { layOutFor } from '@ValenceNative/language/layOutFor';

installTvPlatform();
layOutFor(speakTheKeptWords(thisDevicesLanguages()));
tellQueriesWhenOnScreen();
fitTheScreen();
startFocusEngine();
followTheController();
answerAlertsOnScreen();

registerRootComponent(Television);
