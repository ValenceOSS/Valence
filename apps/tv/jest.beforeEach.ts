import { cleanup } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { letUnmountingFinish } from '@ValenceCore/testing/letUnmountingFinish';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { releaseQueryTimers } from '@ValenceClient/testing/releaseQueryTimers';

releaseQueryTimers();

beforeEach(() => {
  installPlatform(aFakePlatform({ thisClientKind: () => 'tv' }));
});

afterEach(async () => {
  await cleanup();
  await letUnmountingFinish();
});
