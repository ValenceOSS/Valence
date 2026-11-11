import { Linking } from 'react-native';
import { render, userEvent } from '@testing-library/react-native';
import { APersonFacts } from './APersonFacts';

const FACTS = [
  { label: 'Known for', value: 'Acting' },
  { label: 'Place of birth', value: 'Vicenza, Italy' },
];

let openURL: jest.SpiedFunction<typeof Linking.openURL>;

beforeEach(() => {
  openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue();
});

describe('APersonFacts', () => {
  it('lists each fact under a heading, named above its value', async () => {
    const drawn = await render(<APersonFacts facts={FACTS} instagram={null} />);

    expect(drawn.getByText('Personal info')).toBeTruthy();
    expect(drawn.getByText('Known for')).toBeTruthy();
    expect(drawn.getByText('Acting')).toBeTruthy();
    expect(drawn.getByText('Place of birth')).toBeTruthy();
    expect(drawn.getByText('Vicenza, Italy')).toBeTruthy();
  });

  it('opens their Instagram', async () => {
    const drawn = await render(<APersonFacts facts={FACTS} instagram="amyadams" />);

    await userEvent.press(drawn.getByRole('button', { name: 'Instagram' }));

    expect(openURL).toHaveBeenCalledWith('https://www.instagram.com/amyadams');
  });

  it('keeps an Instagram name to the one part of the address', async () => {
    const drawn = await render(<APersonFacts facts={[]} instagram="amy/adams?x" />);

    await userEvent.press(drawn.getByRole('button', { name: 'Instagram' }));

    expect(openURL).toHaveBeenCalledWith('https://www.instagram.com/amy%2Fadams%3Fx');
  });

  it('offers no Instagram where the catalogue knows none', async () => {
    const drawn = await render(<APersonFacts facts={FACTS} instagram={null} />);

    expect(drawn.queryByRole('button', { name: 'Instagram' })).toBeNull();
  });

  it('draws nothing where the catalogue says nothing', async () => {
    const drawn = await render(<APersonFacts facts={[]} instagram={null} />);

    expect(drawn.toJSON()).toBeNull();
  });
});
