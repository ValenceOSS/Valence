import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ASoftFocus } from './ASoftFocus';

describe('ASoftFocus', () => {
  it('blurs what it holds by as much as asked', async () => {
    const drawn = await render(
      <ASoftFocus radius={3}>
        <Text>A line</Text>
      </ASoftFocus>,
    );

    expect(drawn.getByText('A line')).toBeTruthy();
    expect(drawn.toJSON()).toMatchObject({ props: { radius: 3 } });
  });
});
