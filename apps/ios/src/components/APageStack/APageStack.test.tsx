import { useContext } from 'react';
import { act, render } from '@testing-library/react-native';
import { Animated, Text } from 'react-native';
import { IS_ON_TOP } from '@ValencePhone/components/APageStack/IS_ON_TOP';
import { APageStack } from './APageStack';

const Named = ({ name }: { name: string }) => (
  <Text>{`${name}${useContext(IS_ON_TOP) ? ' on top' : ' covered'}`}</Text>
);

const aPage = (name: string) => ({ key: name, page: <Named name={name} /> });

describe('APageStack', () => {
  it('shows only the page on top to anybody reading the screen', async () => {
    const drawn = await render(
      <APageStack pages={[aPage('Home'), aPage('Arrival')]} onBack={jest.fn()} />,
    );

    expect(drawn.getByText('Arrival on top')).toBeTruthy();
    expect(drawn.queryByText('Home covered')).toBeNull();
  });

  it('keeps the pages beneath drawn, and tells them they are covered', async () => {
    const drawn = await render(
      <APageStack pages={[aPage('Home'), aPage('Arrival')]} onBack={jest.fn()} />,
    );

    expect(drawn.getByText('Home covered', { includeHiddenElements: true })).toBeTruthy();
  });

  it('tells the page beneath it is on top again once the one over it goes', async () => {
    const drawn = await render(
      <APageStack pages={[aPage('Home'), aPage('Arrival')]} onBack={jest.fn()} />,
    );

    await act(async () => {
      await drawn.rerender(<APageStack pages={[aPage('Home')]} onBack={jest.fn()} />);
    });

    expect(drawn.getByText('Home on top')).toBeTruthy();
  });

  it('slides what is left back into place once the page over it goes, down to the first', async () => {
    const springing = jest.spyOn(Animated, 'spring');
    const drawn = await render(
      <APageStack pages={[aPage('Home'), aPage('Arrival')]} onBack={jest.fn()} />,
    );

    springing.mockClear();

    await act(async () => {
      await drawn.rerender(<APageStack pages={[aPage('Home')]} onBack={jest.fn()} />);
    });

    expect(springing.mock.calls.map(([, config]) => config.toValue)).toEqual([0, 1]);

    springing.mockRestore();
  });
});
