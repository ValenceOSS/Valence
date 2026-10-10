import { describe, expect, it, vi } from 'vitest';
import { createForwardingWarning } from './createForwardingWarning';
import { trustedProxyCheck } from './trustedProxyCheck';

const forwarded = new Headers({ 'x-forwarded-for': '203.0.113.7' });

/**
 * A warning over the home network's proxies, with what it says kept.
 */
const aWarning = () => {
  const warn = vi.fn<(address: string) => void>();

  return {
    warn,
    tell: createForwardingWarning({
      isTrustedProxy: trustedProxyCheck(['192.168.0.0/16']),
      warn,
    }),
  };
};

describe('createForwardingWarning', () => {
  it('names an untrusted address that forwarded somebody, once', () => {
    const { warn, tell } = aWarning();

    tell(forwarded, '100.64.0.9');
    tell(forwarded, '::ffff:100.64.0.9');

    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith('100.64.0.9');
  });

  it('says nothing of a trusted proxy, or of a request that forwarded nobody', () => {
    const { warn, tell } = aWarning();

    tell(forwarded, '192.168.1.5');
    tell(new Headers(), '100.64.0.9');
    tell(forwarded, null);

    expect(warn).not.toHaveBeenCalled();
  });

  it('notices x-real-ip as well', () => {
    const { warn, tell } = aWarning();

    tell(new Headers({ 'x-real-ip': '203.0.113.7' }), '100.64.0.9');

    expect(warn).toHaveBeenCalledOnce();
  });

  it('stops remembering after enough addresses, rather than growing for ever', () => {
    const { warn, tell } = aWarning();

    for (let at = 0; at < 60; at += 1) {
      tell(forwarded, `100.64.1.${at.toString()}`);
    }

    expect(warn).toHaveBeenCalledTimes(50);
  });
});
