import { describe, expect, it } from 'vitest';
import { webhookAddressProblem } from './webhookAddressProblem';

describe('webhookAddressProblem', () => {
  it('asks for an address when none was typed', () => {
    expect(webhookAddressProblem('  ')).toBe('Paste the address to post to.');
  });

  it('refuses what is not a web address', () => {
    expect(webhookAddressProblem('discord hook')).toMatch(/isn’t a web address/u);
    expect(webhookAddressProblem('ftp://files.example/hook')).toMatch(/isn’t a web address/u);
  });

  it('takes an http or https address', () => {
    expect(webhookAddressProblem(' https://hooks.example/abc ')).toBeNull();
    expect(webhookAddressProblem('http://192.168.1.20:8080/notify')).toBeNull();
  });
});
