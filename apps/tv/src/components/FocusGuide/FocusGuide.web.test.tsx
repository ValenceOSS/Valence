import { render } from '@testing-library/react';
import { Text } from 'react-native';
import { FocusGuide } from '@ValenceTv/components/FocusGuide/FocusGuide';
import { guideRules } from '@ValenceTv/focus/guideRules';

describe('FocusGuide in a browser', () => {
  it('tells the focus engine how it shapes where the remote goes', () => {
    const drawn = render(
      <FocusGuide isRemembering trapsUp trapsLeft>
        <Text>Inside</Text>
      </FocusGuide>,
    );
    const element = drawn.getByText('Inside').parentElement;
    const rule = element === null ? undefined : guideRules.get(element);

    expect(rule?.isRemembering).toBe(true);
    expect([...(rule?.trapped ?? [])].sort()).toEqual(['left', 'up']);
    expect(rule?.isShut).toBe(false);
  });

  it('tells of the remote landing on anything inside', () => {
    const onFocusInside = jest.fn();
    const drawn = render(
      <FocusGuide onFocusInside={onFocusInside}>
        <Text>Inside</Text>
      </FocusGuide>,
    );

    drawn.getByText('Inside').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    expect(onFocusInside).toHaveBeenCalledTimes(1);
  });
});
