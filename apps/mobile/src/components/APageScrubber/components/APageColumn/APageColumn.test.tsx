import { fireEvent, render, screen } from '@testing-library/react-native';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { APageColumn } from './APageColumn';

jest.mock('@ValenceMobile/components/ARemotePicture/ARemotePicture', () => ({
  ARemotePicture: jest.fn(() => null),
}));

const PICTURES = [
  'http://one.local:8420/small/1',
  'http://one.local:8420/small/2',
  'http://one.local:8420/small/3',
];

const aColumn = async (onPage = jest.fn()) => {
  await render(
    <APageColumn pictures={PICTURES} page={0} ink="#e9f3ef" onPage={onPage} style={{}} />,
  );

  await fireEvent(theDrawnRoot(), 'layout', {
    nativeEvent: { layout: { width: 84, height: 400, x: 0, y: 0 } },
  });

  return onPage;
};

describe('APageColumn', () => {
  it('draws nothing until it knows the room it has', async () => {
    await render(
      <APageColumn pictures={PICTURES} page={0} ink="#e9f3ef" onPage={jest.fn()} style={{}} />,
    );

    expect(screen.queryByLabelText('Page 1')).toBeNull();
  });

  it('lays out every page, each named for somebody who cannot see it', async () => {
    await aColumn();

    expect(screen.getByLabelText('Page 1')).toBeTruthy();
    expect(screen.getByLabelText('Page 3')).toBeTruthy();
  });

  it('turns the book to a page tapped in the column', async () => {
    const onPage = await aColumn();

    await fireEvent.press(screen.getByLabelText('Page 3'));

    expect(onPage).toHaveBeenCalledWith(2);
  });

  it('says nothing for a tap on the page already showing', async () => {
    const onPage = await aColumn();

    await fireEvent.press(screen.getByLabelText('Page 1'));

    expect(onPage).not.toHaveBeenCalled();
  });
});
