import { Platform } from 'react-native';
import { drawsNatively } from './drawsNatively';

describe('drawsNatively', () => {
  const was = Platform.OS;

  afterEach(() => {
    Platform.OS = was;
  });

  it('draws natively on an iPhone', () => {
    Platform.OS = 'ios';

    expect(drawsNatively()).toBe(true);
  });

  it('draws plainly on Android', () => {
    Platform.OS = 'android';

    expect(drawsNatively()).toBe(false);
  });
});
