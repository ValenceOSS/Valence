import { describe, expect, it } from 'vitest';
import { callerKeyOf } from './callerKeyOf';

describe('callerKeyOf', () => {
  it('counts an IPv4 caller by its address, mapped or not', () => {
    expect(callerKeyOf('203.0.113.7')).toBe('203.0.113.7');
    expect(callerKeyOf('::ffff:203.0.113.7')).toBe('203.0.113.7');
  });

  it('counts every IPv6 address in one /64 as one caller, however it is written', () => {
    expect(callerKeyOf('2001:db8:1:2::1')).toBe('2001:db8:1:2::/64');
    expect(callerKeyOf('2001:0db8:0001:0002:aaaa:bbbb:cccc:dddd')).toBe('2001:db8:1:2::/64');
    expect(callerKeyOf('2001:db8::1')).toBe('2001:db8:0:0::/64');
    expect(callerKeyOf('::1')).toBe('0:0:0:0::/64');
  });

  it('counts callers whose address is not known together', () => {
    expect(callerKeyOf(null)).toBe('unknown');
  });
});
