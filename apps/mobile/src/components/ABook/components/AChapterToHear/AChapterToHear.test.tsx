import { render, userEvent } from '@testing-library/react-native';
import { AChapterToHear } from './AChapterToHear';

describe('AChapterToHear', () => {
  it('says where the chapter comes, its name and how long it lasts', async () => {
    const drawn = await render(
      <AChapterToHear
        title="Servo Groove"
        at={1}
        lasts={150}
        isCurrent={false}
        onListen={jest.fn()}
      />,
    );

    expect(drawn.getByText('2')).toBeTruthy();
    expect(drawn.getByText('Servo Groove')).toBeTruthy();
    expect(drawn.getByText('2:30')).toBeTruthy();
  });

  it('marks the chapter playing, and starts the book there when pressed', async () => {
    const onListen = jest.fn();
    const drawn = await render(
      <AChapterToHear title="Servo Groove" at={1} lasts={150} isCurrent onListen={onListen} />,
    );
    const row = drawn.getByRole('button', { name: 'Listen from Servo Groove', selected: true });

    await userEvent.press(row);

    expect(onListen).toHaveBeenCalledWith(1);
  });
});
