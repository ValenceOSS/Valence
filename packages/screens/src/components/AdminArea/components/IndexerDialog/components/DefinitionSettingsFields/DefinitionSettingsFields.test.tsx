import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { DefinitionSettingsFields } from './DefinitionSettingsFields';
import type { IndexerDefinitionSetting } from '@ValenceContracts/schemas/IndexerDefinition';

const SETTINGS: IndexerDefinitionSetting[] = [
  {
    name: 'username',
    kind: 'text',
    label: 'Username',
    detail: null,
    default: null,
    options: [],
    isSecret: false,
  },
  {
    name: 'password',
    kind: 'password',
    label: 'Password',
    detail: null,
    default: null,
    options: [],
    isSecret: true,
  },
  {
    name: 'apikey',
    kind: 'text',
    label: 'API key',
    detail: null,
    default: null,
    options: [],
    isSecret: true,
  },
  {
    name: 'freeleech',
    kind: 'checkbox',
    label: 'Freeleech only',
    detail: null,
    default: true,
    options: [],
    isSecret: false,
  },
  {
    name: 'sort',
    kind: 'select',
    label: 'Sort by',
    detail: null,
    default: 'time',
    options: [
      { value: 'time', label: 'Created' },
      { value: 'size', label: 'Size' },
    ],
    isSecret: false,
  },
  {
    name: 'note',
    kind: 'info',
    label: 'About',
    detail: 'Find your key in your profile.',
    default: null,
    options: [],
    isSecret: false,
  },
  {
    name: 'info_cookie',
    kind: 'info',
    label: 'info_cookie',
    detail: 'Copy the cookie.',
    default: null,
    options: [],
    isSecret: false,
  },
  {
    name: 'empty',
    kind: 'info',
    label: 'Empty',
    detail: '',
    default: null,
    options: [],
    isSecret: false,
  },
];

/**
 * Draws the fields.
 */
const draw = (values = {}, secretsSet: string[] = []) => {
  const onChange = vi.fn();

  renderInAnAddress(
    <DefinitionSettingsFields
      settings={SETTINGS}
      values={values}
      secretsSet={secretsSet}
      onChange={onChange}
    />,
  );

  return onChange;
};

describe('DefinitionSettingsFields', () => {
  it('draws each setting as what it is', () => {
    draw({ username: 'ada' });

    expect(screen.getByRole('textbox', { name: /Username/ })).toHaveValue('ada');
    expect(screen.getByLabelText(/Password/)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/API key/)).toHaveAttribute('type', 'password');
    expect(screen.getByRole('checkbox', { name: 'Freeleech only' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Sort by' })).toHaveTextContent('Created');
    expect(screen.getByText('Find your key in your profile.')).toBeInTheDocument();
    expect(screen.getByText('Copy the cookie.')).toBeInTheDocument();
  });

  it('says a kept secret is kept, rather than showing it', () => {
    draw({}, ['password']);

    expect(screen.getByText(/Kept. Type a new one to replace it/)).toBeInTheDocument();
  });

  it('says what changed', async () => {
    const user = userEvent.setup();
    const onChange = draw({ freeleech: false, sort: 'size' });

    await user.type(screen.getByRole('textbox', { name: /Username/ }), 'g');
    await user.click(screen.getByRole('checkbox', { name: 'Freeleech only' }));
    await user.click(screen.getByRole('button', { name: 'Sort by' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Created' }));

    expect(onChange).toHaveBeenCalledWith('username', 'g');
    expect(onChange).toHaveBeenCalledWith('freeleech', true);
    expect(onChange).toHaveBeenCalledWith('sort', 'time');
  });

  it('shows a choice it has no label for by its value', () => {
    draw({ sort: 'relevance' });

    expect(screen.getByRole('button', { name: 'Sort by' })).toHaveTextContent('relevance');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DefinitionSettingsFields.displayName).toBe('DefinitionSettingsFields');
  });
});
