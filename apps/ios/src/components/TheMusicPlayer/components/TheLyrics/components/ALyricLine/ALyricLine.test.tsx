import { render } from '@testing-library/react-native';
import { ALyricLine } from './ALyricLine';

describe('ALyricLine', () => {
  it('draws the line being sung sharp and bright', async () => {
    const drawn = await render(
      <ALyricLine
        words="Will not stop crying"
        standing={{ opacity: 1, scale: 1, blur: 0 }}
        isStill={false}
      />,
    );

    expect(drawn.getByText('Will not stop crying')).toBeTruthy();
  });

  it('keeps every line sharp for somebody who has asked for less movement', async () => {
    const drawn = await render(
      <ALyricLine words="Far away" standing={{ opacity: 0.35, scale: 0.96, blur: 6 }} isStill />,
    );

    expect(JSON.stringify(drawn.toJSON())).toContain('"radius":0');
  });
});
