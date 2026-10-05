import { render } from '@testing-library/react-native';
import { ALeaf } from './components/ALeaf/ALeaf';
import { ASpread } from './ASpread';

jest.mock('./components/ALeaf/ALeaf', () => ({ ALeaf: jest.fn(() => null) }));

const aSpread = () =>
  render(
    <ASpread
      leaves={['http://one.local/p/1', null]}
      fit="width"
      breadth={400}
      tall={600}
      isRightToLeft={false}
      onTap={jest.fn()}
      onZoomed={jest.fn()}
    />,
  );

describe('ASpread', () => {
  it('lays each page on a leaf of its share of the width, a blank one included', async () => {
    await aSpread();

    const leaves = jest.mocked(ALeaf).mock.calls.map(([props]) => props);

    expect(leaves).toEqual([
      { uri: 'http://one.local/p/1', fit: 'width', breadth: 200, tall: 600 },
      { uri: null, fit: 'width', breadth: 200, tall: 600 },
    ]);
  });
});
