import { theCar } from './theCar';

describe('theCar', () => {
  it('is nothing on a build that cannot draw into CarPlay', () => {
    expect(theCar()).toBeNull();
  });
});
