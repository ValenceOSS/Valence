import { thePhonesVolume } from '@ValenceMobile/platform/thePhonesVolume';

describe('thePhonesVolume', () => {
  it('is nothing where the phone has no volume module of its own', () => {
    expect(thePhonesVolume).toBeNull();
  });
});
