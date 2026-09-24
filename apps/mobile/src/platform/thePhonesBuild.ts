import { Platform } from 'react-native';
import { modelName } from 'expo-device';
import { z } from 'zod';
import type { BuildInfo } from '@ValenceClient/platform/Platform.types';

/**
 * What this phone's copy of Valence is, for the line somebody pastes into a bug report: the version
 * it was built from, and the iOS and the phone it is running on.
 *
 * It cannot say which commit it came from, and so leaves that out rather than guessing.
 *
 * @returns The build.
 */
const thePhonesBuild = (): BuildInfo => ({
  version: z.string().catch('0.0.0').parse(process.env.EXPO_PUBLIC_VALENCE_VERSION),
  commit: null,
  runsOn: `iOS ${String(Platform.Version)} · ${modelName ?? 'iPhone'}`,
});

export { thePhonesBuild };
