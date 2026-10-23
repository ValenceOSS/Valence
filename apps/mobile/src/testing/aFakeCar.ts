import type { NativeCarPlay } from '@ValenceMobile/carPlay/NativeCarPlay.types';

/**
 * A stand-in for CarPlay that records what it is told and can have a row chosen in it. It says a
 * car is connected unless told otherwise.
 *
 * @returns The car, and a way to choose a row as a driver would, or to say a car came or went.
 */
const aFakeCar = () => {
  const heard: ((said: object) => void)[] = [];
  const car = {
    setShelves: jest.fn<undefined, Parameters<NativeCarPlay['setShelves']>>(),
    push: jest.fn<undefined, Parameters<NativeCarPlay['push']>>(),
    showNowPlaying: jest.fn<undefined, []>(),
    showMessage: jest.fn<undefined, [string]>(),
    isConnected: jest.fn<boolean, []>(() => true),
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
    connect: (isConnected: boolean) => {
      car.isConnected.mockReturnValue(isConnected);
      heard.forEach((listener) => {
        listener({ isConnected });
      });
    },
  };
};

export { aFakeCar };
