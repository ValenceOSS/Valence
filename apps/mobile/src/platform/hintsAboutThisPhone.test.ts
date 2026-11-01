import { hintsAboutThisPhone } from './hintsAboutThisPhone';

const AN_IPHONE = {
  system: 'ios',
  isPad: false,
  isDevice: true,
  isTablet: false,
  name: 'Dan’s iPhone',
  model: 'iPhone 17 Pro Max',
} as const;

describe('hintsAboutThisPhone', () => {
  it('describes an iPhone as Valence’s own app on iOS, by its model and its name', () => {
    expect(hintsAboutThisPhone(AN_IPHONE)).toEqual({
      app: 'phone',
      system: 'ios',
      form: 'phone',
      model: 'iPhone 17 Pro Max',
      name: 'Dan’s iPhone',
    });
  });

  it('describes an iPad as a tablet on iPadOS', () => {
    expect(
      hintsAboutThisPhone({ ...AN_IPHONE, isPad: true, isTablet: true, model: 'iPad Pro' }),
    ).toMatchObject({ app: 'phone', system: 'ipados', form: 'tablet', model: 'iPad Pro' });
  });

  it('describes an Android phone', () => {
    expect(
      hintsAboutThisPhone({ ...AN_IPHONE, system: 'android', name: 'Pixel', model: 'Pixel 9' }),
    ).toEqual({ app: 'phone', system: 'android', form: 'phone', model: 'Pixel 9', name: 'Pixel' });
  });

  it('describes an Android tablet as a tablet', () => {
    expect(
      hintsAboutThisPhone({
        ...AN_IPHONE,
        system: 'android',
        isTablet: true,
        model: 'Pixel Tablet',
      }),
    ).toMatchObject({ system: 'android', form: 'tablet' });
  });

  it('says nothing of the model or name of a simulator', () => {
    expect(
      hintsAboutThisPhone({ ...AN_IPHONE, isDevice: false, name: 'iPhone 17', model: 'Simulator' }),
    ).toEqual({ app: 'phone', system: 'ios', form: 'phone' });
  });

  it('says nothing of the model or name of an emulator', () => {
    expect(
      hintsAboutThisPhone({
        ...AN_IPHONE,
        system: 'android',
        isDevice: false,
        name: 'sdk_gphone64_arm64',
        model: 'sdk_gphone64_arm64',
      }),
    ).toEqual({ app: 'phone', system: 'android', form: 'phone' });
  });

  it('leaves out what the system will not say', () => {
    expect(hintsAboutThisPhone({ ...AN_IPHONE, name: null, model: null })).toEqual({
      app: 'phone',
      system: 'ios',
      form: 'phone',
    });
  });
});
