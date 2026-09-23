import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { AFadedEdge } from './AFadedEdge';

describe('AFadedEdge', () => {
  it('fades what it holds at its sides', async () => {
    const drawn = await render(
      <AFadedEdge leading={0} trailing={24}>
        <Text>Row</Text>
      </AFadedEdge>,
    );

    expect(drawn.getByText('Row')).toBeTruthy();
    expect(drawn.toJSON()).toMatchObject({ props: { trailing: 24, isUpright: false } });
  });

  it('fades at its top and bottom where it stands upright, filling its room', async () => {
    const drawn = await render(
      <AFadedEdge leading={16} trailing={48} isUpright>
        <Text>Words</Text>
      </AFadedEdge>,
    );

    expect(drawn.toJSON()).toMatchObject({ props: { isUpright: true, style: { flex: 1 } } });
  });
});
