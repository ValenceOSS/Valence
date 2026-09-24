import { theColours } from './theColours';

describe('theColours', () => {
  it('names the same colours in both themes, so nothing is missing from one', () => {
    expect(Object.keys(theColours.light).sort()).toEqual(Object.keys(theColours.dark).sort());
  });

  it('draws on a dark ground in the dark and a light one in the light', () => {
    expect(theColours.dark.surface).toBe('#0e0e0e');
    expect(theColours.light.surface).toBe('#f6fbf9');
  });

  it('writes in ink that is not the ground it sits on', () => {
    expect(theColours.dark.text).not.toBe(theColours.dark.surface);
    expect(theColours.light.text).not.toBe(theColours.light.surface);
  });

  it('picks things out in the ink of the page, and cuts them out of it in the ground', () => {
    for (const theme of [theColours.light, theColours.dark]) {
      expect(theme.accent).toBe(theme.text);
      expect(theme.accentContrast).toBe(theme.surface);
    }
  });
});
