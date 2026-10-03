import type { NativeCarPlay } from '@ValenceMobile/carPlay/NativeCarPlay.types';

/**
 * A stand-in for CarPlay that records what it is told and can have a row chosen in it.
 *
 * @returns The car, and a way to choose a row as a driver would.
 */
const aFakeCar = () => {
  const heard: ((said: object) => void)[] = [];
  const car = {
    setShelves: jest.fn<undefined, Parameters<NativeCarPlay['setShelves']>>(),
    push: jest.fn<undefined, Parameters<NativeCarPlay['push']>>(),
    showNowPlaying: jest.fn<undefined, []>(),
    showMessage: jest.fn<undefined, [string]>(),
    addListener: jest.fn((_event: 'onChoose' | 'onCar', listener: (said: object) => void) => {
      heard.push(listener);

      return { remove: jest.fn() };
    }),
  } satisfies NativeCarPlay;

  return {
    car,
    choose: (said: object) => {
      heard.forEach((listener) => {
        listener(said);
      });
    },
  };
};

export { aFakeCar };
