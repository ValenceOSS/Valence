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

  it('hands the remote back to what last had it inside once it opens again', () => {
    const fenced = (isShut: boolean) => (
      <FocusFence isShut={isShut}>
        <Pressable accessibilityLabel="First" onPress={jest.fn()}>
          <Text>First</Text>
        </Pressable>
        <Pressable accessibilityLabel="Second" onPress={jest.fn()}>
          <Text>Second</Text>
        </Pressable>
      </FocusFence>
    );
    const drawn = render(fenced(false));

    drawn.getByLabelText('Second').focus();
    drawn.rerender(fenced(true));
    drawn.rerender(fenced(false));

    expect(document.activeElement?.getAttribute('aria-label')).toBe('Second');
  });

  it('leaves the remote where it is if something outside already has it', () => {
    const shut = (isShut: boolean) => (
      <>
        <FocusFence isShut={isShut}>
          <Pressable accessibilityLabel="Inside" onPress={jest.fn()}>
            <Text>Inside</Text>
          </Pressable>
        </FocusFence>
        <Pressable accessibilityLabel="Outside" onPress={jest.fn()}>
          <Text>Outside</Text>
        </Pressable>
      </>
    );
    const drawn = render(shut(false));

    drawn.getByLabelText('Inside').focus();
    drawn.rerender(shut(true));
    drawn.getByLabelText('Outside').focus();
    drawn.rerender(shut(false));

    expect(document.activeElement?.getAttribute('aria-label')).toBe('Outside');
  });
});
