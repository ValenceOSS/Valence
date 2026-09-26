import { fireEvent, render } from '@testing-library/react-native';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { APageScrubber } from './APageScrubber';

const PICTURES = ['http://one.local:8420/small/1', 'http://one.local:8420/small/2'];

const theColumn = () =>
  theDrawnRoot().queryAll((node) => node.type === 'ViewManagerAdapter_ValencePageScrubber');

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

    expect(column?.parent?.type).toBe('ViewManagerAdapter_ExpoUI');
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
