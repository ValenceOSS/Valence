import { describe, expect, it } from 'vitest';
import { createSiteHostCheck } from './createSiteHostCheck';

describe('createSiteHostCheck', () => {
  it('trusts the configured link, every listed link and the subdomains of the configured domain', () => {
    const isTheSite = createSiteHostCheck('https://site.org/', [
      'https://site.org/',
      'https://mirror.example/',
    ]);

    expect(isTheSite('site.org')).toBe(true);
    expect(isTheSite('www.site.org')).toBe(true);
    expect(isTheSite('dl.site.org')).toBe(true);
    expect(isTheSite('mirror.example')).toBe(true);
    expect(isTheSite('WWW.Site.org')).toBe(true);
  });

  it('trusts nothing else, not even a host that only ends the same way', () => {
    const isTheSite = createSiteHostCheck('https://site.org/', ['https://site.org/']);

    expect(isTheSite('evilsite.org')).toBe(false);
    expect(isTheSite('site.org.evil.example')).toBe(false);
    expect(isTheSite('other.org')).toBe(false);
  });

  it('shares a domain of three labels under a country code, not the whole code', () => {
    const isTheSite = createSiteHostCheck('https://tracker.co.uk/', []);

    expect(isTheSite('dl.tracker.co.uk')).toBe(true);
    expect(isTheSite('other.co.uk')).toBe(false);
  });

  it('shares nothing but the address of a site reached by one', () => {
    const isTheSite = createSiteHostCheck('http://192.168.1.5:8080/', []);

    expect(isTheSite('192.168.1.5')).toBe(true);
    expect(isTheSite('168.1.5')).toBe(false);
  });
});
