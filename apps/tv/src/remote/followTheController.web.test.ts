import { followTheController } from '@ValenceTv/remote/followTheController';
import { theController } from '@ValenceTv/remote/theController';

const pressed = new Set<number>();

/**
 * Waits long enough for the controller to be read a few times.
 *
 * @returns When it has been.
 */
const aFewReadings = (): Promise<void> =>
  new Promise((done) => {
    setTimeout(done, 70);
  });

/**
 * One controller, with whatever buttons the test holds down.
 *
 * @returns What the browser says is connected.
 */
const theControllers = () => [
  {
    buttons: Array.from({ length: 17 }, (_, button) => ({ pressed: pressed.has(button) })),
    axes: [0, 0, 0, 0],
  },
];

describe('followTheController in a browser', () => {
  const heard: string[] = [];

  beforeAll(() => {
    Object.defineProperty(window.navigator, 'getGamepads', {
      value: theControllers,
      configurable: true,
    });
    Object.defineProperty(window.navigator, 'gamepadInputEmulation', {
      value: 'mouse',
      writable: true,
      configurable: true,
    });
    jest.spyOn(document, 'hasFocus').mockReturnValue(true);
    document.addEventListener('keydown', (event) => {
      heard.push(`down ${event.key}${event.repeat ? ' again' : ''}`);
    });
    document.addEventListener('keyup', (event) => {
      heard.push(`up ${event.key}`);
    });
    followTheController();
  });

  beforeEach(() => {
    heard.length = 0;
    pressed.clear();
  });

  it('asks Microsoft’s older Edge for the controller rather than its pointer', () => {
    expect(Reflect.get(window.navigator, 'gamepadInputEmulation')).toBe('gamepad');
  });

  it('presses the remote’s keys for the controller’s buttons, and lets them up', async () => {
    pressed.add(15);
    await aFewReadings();
    pressed.clear();
    pressed.add(0);
    await aFewReadings();
    pressed.clear();
    await aFewReadings();

    expect(heard).toEqual(['down ArrowRight', 'up ArrowRight', 'down Enter', 'up Enter']);
    expect(theController().isHeard()).toBe(true);
  });

  it('lets every held key up when the page loses the focus', async () => {
    pressed.add(13);
    await aFewReadings();
    window.dispatchEvent(new Event('blur'));
    await aFewReadings();

    expect(heard).toEqual(['down ArrowDown', 'up ArrowDown']);
  });

  it('clicks a button with A, as a real Enter would, once a press', async () => {
    const button = document.createElement('button');
    const clicked = jest.fn();

    button.addEventListener('click', clicked);
    document.body.append(button);
    button.focus();
    window.dispatchEvent(new Event('focus'));
    pressed.add(0);
    await new Promise((done) => {
      setTimeout(done, 300);
    });
    pressed.clear();
    await aFewReadings();
    button.remove();

    expect(clicked).toHaveBeenCalledTimes(1);
  });
});
