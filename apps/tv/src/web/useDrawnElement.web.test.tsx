import { render } from '@testing-library/react';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useDrawnElement } from '@ValenceTv/web/useDrawnElement';

describe('useDrawnElement', () => {
  it('hands back the page element a view is drawn as, once it is drawn', () => {
    const seen: (HTMLElement | null)[] = [];

    /**
     * A view that says what it was drawn as.
     *
     * @returns The view.
     */
    const Drawn = () => {
      const [element, drawn] = useDrawnElement();

      useEffect(() => {
        seen.push(element);
      }, [element]);

      return <View ref={drawn} testID="drawn" />;
    };

    const page = render(<Drawn />);

    expect(seen[0]).toBeNull();
    expect(seen[seen.length - 1]).toBe(page.getByTestId('drawn'));
  });
});
