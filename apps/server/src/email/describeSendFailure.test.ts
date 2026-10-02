import { describe, expect, it } from 'vitest';
import { describeSendFailure } from './describeSendFailure';

/**
 * An error the way nodemailer throws one, with its code and the server's reply on it.
 *
 * @param message - The error's message.
 * @param extra - The code and reply.
 * @returns The error.
 */
const mailError = (message: string, extra: { code?: string; response?: string }): Error =>
  Object.assign(new Error(message), extra);

describe('describeSendFailure', () => {
  it('says the server could not be reached', () => {
    expect(
      describeSendFailure(mailError('connect ECONNREFUSED', { code: 'ESOCKET' }), 'smtp.x').message,
    ).toBe(
      'Valence could not reach the mail server at smtp.x. Check its address, port and encryption.',
    );
    expect(describeSendFailure(mailError('t', { code: 'ETIMEDOUT' }), 'smtp.x').code).toBe(
      'server.email.describeSendFailure.couldNotReachTheMailServer',
    );
  });

  it('says the sign-in was refused', () => {
    expect(
      describeSendFailure(mailError('Invalid login', { code: 'EAUTH' }), 'smtp.x').message,
    ).toBe('The mail server at smtp.x refused the username or password.');
  });

  it('passes on what the server answered, in its own words', () => {
    const said = describeSendFailure(
      mailError('Message failed', { code: 'EMESSAGE', response: '550 5.7.1 Domain not verified' }),
      'smtp.x',
    );

    expect(said.message).toBe('The mail server refused the email: 550 5.7.1 Domain not verified');
    expect(said.values['answer']).toMatchObject({ code: null });
  });

  it('falls back to the error message, or to saying nothing came back', () => {
    expect(describeSendFailure(new Error('boom'), 'smtp.x').message).toBe(
      'The mail server refused the email: boom',
    );
    expect(describeSendFailure(new Error(''), 'smtp.x').message).toBe(
      'The mail server did not take the email.',
    );
  });
});
