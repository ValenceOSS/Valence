import { render, screen } from '@testing-library/react';
import { Animated, Text } from 'react-native';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';

describe('FadeIn in a browser', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the page at once rather than fading it in', () => {
    const timing = jest.spyOn(Animated, 'timing');

    render(
      <FadeIn>
        <Text>the page</Text>
      </FadeIn>,
    );

    expect(screen.getByText('the page')).toBeTruthy();
    expect(timing).not.toHaveBeenCalled();
  });
});
