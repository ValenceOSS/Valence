import { Text } from 'react-native';
import { render, userEvent } from '@testing-library/react-native';
import { AReaderChrome } from './AReaderChrome';

const aChrome = (isShown: boolean, onBack = jest.fn(), onPanel = jest.fn()) => (
  <AReaderChrome
    title="Dune"
    place="Book One"
    paper="#161619"
    ink="#d8d4cc"
    isDarkPage
    isShown={isShown}
    onBack={onBack}
    onPanel={onPanel}
    footer={<Text>42% read</Text>}
  >
    <Text>The page</Text>
  </AReaderChrome>
);

describe('AReaderChrome', () => {
  it('holds the page, with what is being read and how far through', async () => {
    const drawn = await render(aChrome(true));

    expect(drawn.getByText('The page')).toBeTruthy();
    expect(drawn.getByText('Dune')).toBeTruthy();
    expect(drawn.getByText('Book One')).toBeTruthy();
    expect(drawn.getByText('42% read')).toBeTruthy();
  });

  it('goes back, and brings out the panel', async () => {
    const onBack = jest.fn();
    const onPanel = jest.fn();
    const drawn = await render(aChrome(true, onBack, onPanel));

    await userEvent.press(drawn.getByRole('button', { name: 'Back' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Contents and settings' }));

    expect(onBack).toHaveBeenCalled();
    expect(onPanel).toHaveBeenCalled();
  });
});
