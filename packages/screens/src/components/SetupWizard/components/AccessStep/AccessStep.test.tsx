import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AccessStep } from './AccessStep';
import type { AccessStepProps } from './AccessStep.types';

const DETECTED = 'http://192.168.1.40:8420';

const SUGGESTED = [DETECTED, 'http://192.168.1.40:5173'];

type HeldProps = Partial<Omit<AccessStepProps, 'origins' | 'cookieSecure'>> & {
  origins?: string[];
  cookieSecure?: boolean;
};

const Held = ({
  origins: start = [DETECTED],
  cookieSecure: secure = false,
  ...rest
}: HeldProps) => {
  const [origins, setOrigins] = useState(start);
  const [cookieSecure, setCookieSecure] = useState(secure);

  return (
    <AccessStep
      detectedOrigin={DETECTED}
      suggestedOrigins={SUGGESTED}
      origins={origins}
      onOriginsChange={setOrigins}
      cookieSecure={cookieSecure}
      onCookieSecureChange={setCookieSecure}
      isCreating={false}
      problem={null}
      onBack={vi.fn()}
      onCreate={vi.fn()}
      {...rest}
    />
  );
};

describe('AccessStep', () => {
  it('lists the trusted addresses, marking the one this browser came in on', () => {
    render(<Held />);

    const list = screen.getByRole('list');

    expect(list).toHaveTextContent(DETECTED);
    expect(list).toHaveTextContent('This browser');
  });

  it('offers the suggested addresses not already trusted, and adds one when chosen', async () => {
    render(<Held />);

    await userEvent.click(screen.getByRole('button', { name: 'http://192.168.1.40:5173' }));

    expect(screen.getByRole('list')).toHaveTextContent('http://192.168.1.40:5173');
    expect(screen.queryByText('Suggested:')).not.toBeInTheDocument();
  });

  it('stops trusting an address, and will not make the account with none', async () => {
    render(<Held />);

    await userEvent.click(screen.getByRole('button', { name: `Stop trusting ${DETECTED}` }));

    expect(screen.getByText('Enter at least one origin.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create my account' })).toBeDisabled();
  });

  it('adds a typed address as the origin a browser sends', async () => {
    render(<Held />);

    await userEvent.type(
      screen.getByLabelText('Add another address'),
      'https://valence.example.com/home',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByRole('list')).toHaveTextContent('https://valence.example.com');
    expect(screen.getByLabelText('Add another address')).toHaveValue('');
  });

  it('does not list an address twice', async () => {
    render(<Held />);

    await userEvent.type(screen.getByLabelText('Add another address'), `${DETECTED}/{Enter}`);

    expect(screen.getAllByRole('button', { name: `Stop trusting ${DETECTED}` })).toHaveLength(1);
  });

  it('says what is wrong with something that is not an address, until it is changed', async () => {
    render(<Held />);

    const field = screen.getByLabelText('Add another address');

    await userEvent.type(field, 'valence.local{Enter}');

    expect(
      screen.getByText('Each origin must be a full URL, such as http://192.168.1.40:8420.'),
    ).toBeInTheDocument();

    await userEvent.type(field, 'x');

    expect(
      screen.queryByText('Each origin must be a full URL, such as http://192.168.1.40:8420.'),
    ).not.toBeInTheDocument();
  });

  it('cannot add nothing', () => {
    render(<Held />);

    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });

  it('explains what secure cookies mean either way', async () => {
    render(<Held />);

    expect(screen.getByText(/Cookies will not be marked secure/)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('switch', { name: 'This server is reached over HTTPS' }),
    );

    expect(screen.getByText(/Secure cookies will be used/)).toBeInTheDocument();
  });

  it('warns that secure cookies stop signing in here over plain HTTP', async () => {
    render(<Held />);

    expect(screen.queryByText('This browser reached Valence over plain HTTP')).toBeNull();

    await userEvent.click(
      screen.getByRole('switch', { name: 'This server is reached over HTTPS' }),
    );

    expect(screen.getByText('This browser reached Valence over plain HTTP')).toBeInTheDocument();
  });

  it('does not warn about plain HTTP to a browser that came in over HTTPS', () => {
    render(<Held cookieSecure detectedOrigin="https://valence.example.com" />);

    expect(screen.queryByText('This browser reached Valence over plain HTTP')).toBeNull();
  });

  it('makes the account, and goes back, when asked', async () => {
    const onCreate = vi.fn();
    const onBack = vi.fn();

    render(<Held onCreate={onCreate} onBack={onBack} />);

    await userEvent.click(screen.getByRole('button', { name: 'Create my account' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(onCreate).toHaveBeenCalledOnce();
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('holds the way back while the account is being made', () => {
    render(<Held isCreating />);

    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
  });

  it('says why making the account failed', () => {
    render(<Held problem="Setup could not be completed." />);

    expect(screen.getByRole('alert')).toHaveTextContent('Setup could not be completed.');
  });
});
