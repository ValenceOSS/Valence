import { render } from '@testing-library/react-native';
import { WashLayer } from './WashLayer';

describe('WashLayer', () => {
  it('lays each light as a glow where it came from, stronger near the top', async () => {
    const drawn = await render(
      <WashLayer
        lights={[
          { colour: 'rgb(200, 80, 40)', at: '8% 10%' },
          { colour: 'rgb(200, 80, 40)', at: '36% 10%' },
          { colour: 'rgb(200, 80, 40)', at: '64% 10%' },
          { colour: 'rgb(200, 80, 40)', at: '92% 10%' },
          { colour: 'rgb(10, 20, 30)', at: '8% 48%' },
        ]}
        isArriving={false}
      />,
    );
    const drawnAs = JSON.stringify(drawn.toJSON());

    expect(drawnAs).toContain('at 8% 10%, rgba(200, 80, 40, 0.75)');
    expect(drawnAs).toContain('at 8% 48%, rgba(10, 20, 30, 0.6)');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(WashLayer.displayName).toBe('WashLayer');
  });
});
