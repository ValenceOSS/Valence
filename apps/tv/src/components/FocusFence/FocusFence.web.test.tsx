import { render } from '@testing-library/react';
import { Pressable, Text } from 'react-native';
import { FocusFence } from '@ValenceTv/components/FocusFence/FocusFence';
import { guideRules } from '@ValenceTv/focus/guideRules';

describe('FocusFence in a browser', () => {
  it('tells the focus engine whether it is shut', () => {
    const drawn = render(
      <FocusFence isShut>
        <Text>Fenced</Text>
      </FocusFence>,
    );
    const element = drawn.getByText('Fenced').parentElement;

    expect(element === null ? undefined : guideRules.get(element)?.isShut).toBe(true);
  });

  it('moves the remote out of what it shuts', () => {
    const drawn = render(
      <FocusFence isShut={false}>
        <Pressable accessibilityLabel="Inside" onPress={jest.fn()}>
          <Text>Inside</Text>
        </Pressable>
      </FocusFence>,
    );

    drawn.getByLabelText('Inside').focus();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Inside');

    drawn.rerender(
      <FocusFence isShut>
        <Pressable accessibilityLabel="Inside" onPress={jest.fn()}>
          <Text>Inside</Text>
        </Pressable>
      </FocusFence>,
    );

    expect(document.activeElement).toBe(document.body);
  });
});
