import { createRef } from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';
import { whereOnScreen } from '@ValenceTv/layout/whereOnScreen';

describe('whereOnScreen', () => {
  it('says where a view is drawn, as its corner and its size', async () => {
    const ref = createRef<View>();

    await render(<View ref={ref} />);

    const view = ref.current;

    if (view === null) {
      throw new Error('The view was not drawn');
    }

    jest.spyOn(view, 'measureInWindow').mockImplementation((told) => {
      told(10, 20, 300, 200);
    });

    await expect(whereOnScreen(view)).resolves.toEqual({ x: 10, y: 20, width: 300, height: 200 });
  });
});
