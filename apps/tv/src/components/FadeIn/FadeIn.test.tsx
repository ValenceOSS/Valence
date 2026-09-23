import { Animated, Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';

describe('FadeIn', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the page it brings in', async () => {
    const drawn = await render(
      <FadeIn>
        <Text>Home</Text>
      </FadeIn>,
    );

    expect(drawn.getByText('Home')).toBeTruthy();
  });

  it('starts all but invisible and fades all the way up', async () => {
    const timing = jest.spyOn(Animated, 'timing');
    const drawn = await render(
      <FadeIn>
        <Text>Home</Text>
      </FadeIn>,
    );

    expect(drawn.toJSON()).toHaveStyle({ opacity: 0.1 });
    expect(timing).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 1, delay: 0 }),
    );
  });

  it('waits before fading in where it is told to', async () => {
    const timing = jest.spyOn(Animated, 'timing');

    await render(
      <FadeIn delayMs={2000}>
        <Text>Home</Text>
      </FadeIn>,
    );

    expect(timing).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 1, delay: 2000 }),
    );
  });

  it('does not fade in while it is hidden, and does once it is shown', async () => {
    const timing = jest.spyOn(Animated, 'timing');
    const drawn = await render(
      <FadeIn isShown={false}>
        <Text>Home</Text>
      </FadeIn>,
    );

    expect(timing).not.toHaveBeenCalled();

    await drawn.rerender(
      <FadeIn isShown>
        <Text>Home</Text>
      </FadeIn>,
    );

    expect(timing).toHaveBeenCalledTimes(1);
  });

  it('fills the space it is in only where it is a page', async () => {
    const page = await render(
      <FadeIn>
        <Text>Home</Text>
      </FadeIn>,
    );

    expect(page.toJSON()).toHaveStyle({ flex: 1 });

    const piece = await render(
      <FadeIn isFilling={false}>
        <Text>Home</Text>
      </FadeIn>,
    );

    expect(piece.toJSON()).not.toHaveStyle({ flex: 1 });
  });
});
