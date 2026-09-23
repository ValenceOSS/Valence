import { fireEvent, render } from '@testing-library/react-native';
import { theDrawnRoot } from '@ValencePhone/testing/theDrawnRoot';
import { SystemTabBar } from './SystemTabBar';

const TABS = [
  { id: 'library', title: 'Library', symbol: 'play.rectangle' },
  { id: 'search', title: 'Search', symbol: 'magnifyingglass' },
];

describe('SystemTabBar', () => {
  it('says which tab was picked, and how tall the bar is', async () => {
    const onSelect = jest.fn();
    const onMeasure = jest.fn();
    await render(
      <SystemTabBar
        tabs={TABS}
        selected="library"
        accent="#e9f3ef"
        onSelect={onSelect}
        onMeasure={onMeasure}
        style={{}}
      />,
    );
    const bar = theDrawnRoot();

    await fireEvent(bar, 'select', { nativeEvent: { id: 'search' } });
    await fireEvent(bar, 'measure', { nativeEvent: { height: 83 } });

    expect(onSelect).toHaveBeenCalledWith('search');
    expect(onMeasure).toHaveBeenCalledWith(83);
  });
});
