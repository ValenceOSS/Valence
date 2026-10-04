import { render, screen, userEvent } from '@testing-library/react-native';
import { AReaderSide } from './AReaderSide';
import type { AReaderSideProps } from './AReaderSide.types';

const aSide = (overrides: Partial<AReaderSideProps> = {}) => (
  <AReaderSide
    breadth={70}
    side="left"
    top={24}
    below={20}
    ink="#ffffff"
    isRightToLeft={false}
    isMarked={false}
    isLocked={false}
    fit="both"
    place="Chapter 1"
    through={0.42}
    next={null}
    onForward={jest.fn()}
    onMark={jest.fn()}
    onLock={jest.fn()}
    onFit={jest.fn()}
    onReadOn={jest.fn()}
    {...overrides}
  />
);

describe('AReaderSide', () => {
  it('turns onwards, marks, holds and fits the pages', async () => {
    const onForward = jest.fn();
    const onMark = jest.fn();
    const onLock = jest.fn();
    const onFit = jest.fn();

    await render(aSide({ onForward, onMark, onLock, onFit }));
    await userEvent.press(screen.getByRole('button', { name: 'Next page' }));
    await userEvent.press(screen.getByRole('button', { name: 'Bookmark these pages' }));
    await userEvent.press(screen.getByRole('button', { name: 'Lock page turning' }));
    await userEvent.press(
      screen.getByRole('button', { name: 'Fit to page. Switch to fit to width' }),
    );

    expect(onForward).toHaveBeenCalled();
    expect(onMark).toHaveBeenCalled();
    expect(onLock).toHaveBeenCalled();
    expect(onFit).toHaveBeenCalled();
  });

  it('offers to unmark marked pages and let held ones turn', async () => {
    await render(aSide({ isMarked: true, isLocked: true }));

    expect(screen.getByRole('button', { name: 'Remove bookmark' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Unlock page turning' })).toBeTruthy();
  });

  it.each([
    ['width', 'Fit to width. Switch to fit to height'],
    ['height', 'Fit to height. Switch to fit to page'],
  ] as const)(
    'says the pages are %s-filled, and what pressing changes it to',
    async (fit, says) => {
      await render(aSide({ fit }));

      expect(screen.getByRole('button', { name: says })).toBeTruthy();
    },
  );

  it('says how far through the chapter is', async () => {
    await render(aSide());

    expect(screen.getByText('42%')).toBeTruthy();
    expect(screen.queryByText('Read next')).toBeNull();
  });

  it('offers the next chapter once it is near, in place of how far through', async () => {
    const onReadOn = jest.fn();

    await render(aSide({ next: { title: 'Chapter 2', cover: '/cover' }, onReadOn }));

    expect(screen.queryByText('42%')).toBeNull();

    await userEvent.press(screen.getByRole('button', { name: 'Continue reading: Chapter 2' }));

    expect(onReadOn).toHaveBeenCalled();
  });
});
