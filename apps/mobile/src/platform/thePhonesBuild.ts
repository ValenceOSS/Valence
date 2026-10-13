import { Platform } from 'react-native';
import { isDevice, modelName } from 'expo-device';
import { z } from 'zod';
import type { BuildInfo } from '@ValenceClient/platform/Platform.types';
import { say } from '@ValenceI18n/say';

/**
 * What this phone's copy of Valence is, for the line somebody pastes into a bug report: the version
 * it was built from, and the system and the phone it is running on, where it is running on a phone
 * rather than in a simulator, which names itself as though it were one.
 *
 * It cannot say which commit it came from, and so leaves that out rather than guessing.
 *
 * @returns The build.
 */
const thePhonesBuild = (): BuildInfo => {
  const model = isDevice ? modelName : null;

  return {
    version: z.string().catch('0.0.0').parse(process.env.EXPO_PUBLIC_VALENCE_VERSION),
    commit: null,
    runsOn:
      Platform.OS === 'ios'
        ? model === null
          ? `iOS ${String(Platform.Version)}`
          : `iOS ${String(Platform.Version)} · ${model}`
        : model === null
          ? say('phone.platform.thePhonesBuild.androidVersionAndroidPhone', {
              version: String(Platform.Version),
            })
          : say('phone.platform.thePhonesBuild.androidVersionModel', {
              version: String(Platform.Version),
              model,
            }),
  };
};

export { thePhonesBuild };
