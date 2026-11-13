import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ATextLook } from './ATextLook';

describe('ATextLook', () => {
  it("draws the look's own controls inside the sheet", async () => {
    await render(
      <ATextLook>
        <Text>Themes</Text>
      </ATextLook>,
    );

    expect(screen.getByText('Themes')).toBeTruthy();
  });
});
