import { fireEvent, render } from '@testing-library/react-native';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { drawsNatively } from '@ValenceMobile/platform/drawsNatively';
import { APageColumn } from './components/APageColumn/APageColumn';
import { APageScrubber } from './APageScrubber';

jest.mock('@ValenceMobile/platform/drawsNatively', () => ({ drawsNatively: jest.fn(() => true) }));

jest.mock('./components/APageColumn/APageColumn', () => ({ APageColumn: jest.fn(() => null) }));

const PICTURES = ['http://one.local:8420/small/1', 'http://one.local:8420/small/2'];

const theColumn = () =>
  theDrawnRoot().queryAll((node) =>
    String(node.type).startsWith('ViewManagerAdapter_ValencePageScrubber'),
  );

const layOut = () =>
  fireEvent(theDrawnRoot(), 'layout', {
    nativeEvent: { layout: { width: 84, height: 400, x: 0, y: 0 } },
  });

describe('APageScrubber', () => {
  it('draws nothing until it knows the room it has', async () => {
    await render(
      <APageScrubber pictures={PICTURES} page={0} ink="#e9f3ef" onPage={jest.fn()} style={{}} />,
    );

    expect(theColumn()).toHaveLength(0);
  });

  it('lays the column inside a host, told the room it has', async () => {
    await render(
      <APageScrubber pictures={PICTURES} page={1} ink="#e9f3ef" onPage={jest.fn()} style={{}} />,
    );

    await layOut();
    const [column] = theColumn();

    expect(String(column?.parent?.type)).toMatch(/^ViewManagerAdapter_ExpoUI/);
    expect(column).toHaveProp('breadth', 84);
    expect(column).toHaveProp('tall', 400);
    expect(column).toHaveProp('pictures', PICTURES);
    expect(column).toHaveProp('page', 1);
  });

  it('says which page was left in the middle', async () => {
    const onPage = jest.fn();
    await render(
      <APageScrubber pictures={PICTURES} page={0} ink="#e9f3ef" onPage={onPage} style={{}} />,
    );

    await layOut();
    const [column] = theColumn();

    if (column === undefined) {
      throw new Error('The column was not drawn.');
    }

    await fireEvent(column, 'page', { nativeEvent: { page: 1 } });

    expect(onPage).toHaveBeenCalledWith(1);
  });
});

describe('APageScrubber on a phone with no SwiftUI', () => {
  it('draws the column in React Native instead, handed the same', async () => {
    jest.mocked(drawsNatively).mockReturnValueOnce(false);

    await render(
      <APageScrubber pictures={PICTURES} page={1} ink="#e9f3ef" onPage={jest.fn()} style={{}} />,
    );

    expect(jest.mocked(APageColumn).mock.calls[0]?.[0]).toMatchObject({
      pictures: PICTURES,
      page: 1,
      ink: '#e9f3ef',
    });
  });
});
