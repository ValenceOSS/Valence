import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { FocusGuide } from '@ValenceTv/components/FocusGuide/FocusGuide';

describe('FocusGuide', () => {
  it('is the system’s focus guide, remembering and trapping as it is told', async () => {
    const drawn = await render(
      <FocusGuide isRemembering trapsUp>
        <Text>Inside</Text>
      </FocusGuide>,
    );
    const [guide] = drawn.container.queryAll((node) => node.props.autoFocus === true);

    expect(drawn.getByText('Inside')).toBeTruthy();
    expect(guide?.props).toMatchObject({
      trapFocusUp: true,
      trapFocusDown: false,
      trapFocusLeft: false,
      trapFocusRight: false,
    });
  });

  it('tells of the remote landing on anything inside', async () => {
    const onFocusInside = jest.fn();
    const drawn = await render(
      <FocusGuide onFocusInside={onFocusInside}>
        <Text>Inside</Text>
      </FocusGuide>,
    );

    expect(
      drawn.container.queryAll((node) => node.props.onFocusCapture === onFocusInside),
    ).not.toHaveLength(0);
  });
});
