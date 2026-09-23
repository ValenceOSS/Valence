import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { LiftOnFocus } from '@ValenceTv/components/LiftOnFocus/LiftOnFocus';

describe('LiftOnFocus', () => {
  it('holds what it lifts', async () => {
    const drawn = await render(
      <LiftOnFocus scale={1.1} shadowHeight={236} cornerRadius={16} isAnchoredLeft={false}>
        <Text>Dune</Text>
      </LiftOnFocus>,
    );

    expect(drawn.getByText('Dune')).toBeOnTheScreen();
  });

  it('is laid out as it is told', async () => {
    const drawn = await render(
      <LiftOnFocus
        scale={1}
        shadowHeight={0}
        cornerRadius={0}
        isAnchoredLeft
        style={{ width: 420 }}
      >
        <Text>Dune</Text>
      </LiftOnFocus>,
    );

    expect(drawn.root).toHaveStyle({ width: 420 });
  });
});
