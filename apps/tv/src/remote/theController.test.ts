import { theController } from '@ValenceTv/remote/theController';

describe('theController', () => {
  it('is one for the whole page', () => {
    expect(theController()).toBe(theController());
  });

  it('says once that the page has heard a controller, and keeps saying it has', () => {
    const told = jest.fn();
    const stop = theController().whenHeard(told);

    expect(theController().isHeard()).toBe(false);

    theController().hear();
    theController().hear();
    stop();

    expect(told).toHaveBeenCalledTimes(1);
    expect(theController().isHeard()).toBe(true);
  });
});
