import { getQuickJS } from 'quickjs-emscripten';
import { describe, expect, it } from 'vitest';
import { SANDBOX_HELPERS } from './SANDBOX_HELPERS';

/**
 * Runs the helpers and then a script inside QuickJS, as a plugin's code runs, and reads back what
 * the script gives.
 *
 * @param script - An expression whose value is turned to JSON.
 * @returns What it gave.
 */
const inSandbox = async (script: string): Promise<string> => {
  const quickJs = await getQuickJS();
  const vm = quickJs.newContext();

  try {
    vm.unwrapResult(vm.evalCode(SANDBOX_HELPERS)).dispose();

    const result = vm.unwrapResult(vm.evalCode(`JSON.stringify(${script})`));
    const text = vm.getString(result);

    result.dispose();

    return text;
  } finally {
    vm.dispose();
  }
};

const URLS: readonly (readonly [string, string?])[] = [
  ['https://API.Example.com:443/a/./b/../c?x=1 2#frag ment'],
  ['http://user:pass@example.com:8080/path'],
  ['https://example.com'],
  ['https://example.com/a/b?q=1'],
  ['../d?y=2', 'https://example.com/a/b/c'],
  ['/root', 'https://example.com/a/b'],
  ['?only=query', 'https://example.com/a/b?old=1#h'],
  ['#only-hash', 'https://example.com/a/b?old=1'],
  ['//other.example.org/x', 'https://example.com/a'],
  ['mailto:someone@example.com'],
  ['https://example.com/ünïcode path'],
  ['https://[::1]:8443/v6'],
];

describe('the helpers in the sandbox', () => {
  it('encodes and decodes base64 as browsers do', async () => {
    const samples = ['', 'f', 'fo', 'foo', 'foob', 'fooba', 'foobar', 'ÿ\u0000\u0080'];

    expect(JSON.parse(await inSandbox(`${JSON.stringify(samples)}.map((s) => btoa(s))`))).toEqual(
      samples.map((sample) => btoa(sample)),
    );
    expect(
      JSON.parse(
        await inSandbox(
          `${JSON.stringify(samples.map((sample) => btoa(sample)))}.map((s) => atob(s))`,
        ),
      ),
    ).toEqual(samples);
    expect(
      await inSandbox(
        `(() => { try { btoa('é€'); return 'took it'; } catch { return 'refused'; } })()`,
      ),
    ).toBe('"refused"');
    expect(
      await inSandbox(
        `(() => { try { atob('***'); return 'took it'; } catch { return 'refused'; } })()`,
      ),
    ).toBe('"refused"');
  });

  it('encodes and decodes UTF-8 as browsers do, replacing what is broken', async () => {
    const text = 'plain, ünïcödé, € and 🎵 too';

    expect(
      JSON.parse(await inSandbox(`[...new TextEncoder().encode(${JSON.stringify(text)})]`)),
    ).toEqual([...new TextEncoder().encode(text)]);

    const broken = [0x61, 0xff, 0x62, 0xe2, 0x82, 0x63, 0xf0, 0x9f, 0x8e, 0xb5, 0xc0, 0x80];

    expect(
      JSON.parse(
        await inSandbox(`new TextDecoder().decode(new Uint8Array(${JSON.stringify(broken)}))`),
      ),
    ).toBe(new TextDecoder().decode(new Uint8Array(broken)));
    expect(
      JSON.parse(
        await inSandbox(
          `new TextDecoder().decode(new TextEncoder().encode(${JSON.stringify(text)}))`,
        ),
      ),
    ).toBe(text);
  });

  it('reads and writes query strings as browsers do', async () => {
    const script = `(() => {
      const params = new URLSearchParams('?a=1&b=two+words&a=3&c=%C3%A9&empty=&flag');
      params.append('d', 'x&y=z');
      params.set('a', 'one');
      params.delete('b');
      return { text: params.toString(), a: params.getAll('a'), c: params.get('c'), size: params.size, has: params.has('flag') };
    })()`;
    const params = new URLSearchParams('?a=1&b=two+words&a=3&c=%C3%A9&empty=&flag');

    params.append('d', 'x&y=z');
    params.set('a', 'one');
    params.delete('b');

    expect(JSON.parse(await inSandbox(script))).toEqual({
      text: params.toString(),
      a: params.getAll('a'),
      c: params.get('c'),
      size: params.size,
      has: params.has('flag'),
    });
    expect(JSON.parse(await inSandbox(`new URLSearchParams({ q: 'a b', n: 1 }).toString()`))).toBe(
      new URLSearchParams({ q: 'a b', n: '1' }).toString(),
    );
  });

  it('reads addresses, alone and against a base, as browsers do', async () => {
    const read = (url: URL) => ({
      href: url.href,
      origin: url.origin,
      protocol: url.protocol,
      host: url.host,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      username: url.username,
    });
    const script = `${JSON.stringify(URLS)}.map(([input, base]) => {
      const url = new URL(input, base ?? undefined);
      return { href: url.href, origin: url.origin, protocol: url.protocol, host: url.host, hostname: url.hostname, port: url.port, pathname: url.pathname, search: url.search, hash: url.hash, username: url.username };
    })`;

    expect(JSON.parse(await inSandbox(script))).toEqual(
      URLS.map(([input, base]) => read(new URL(input, base))),
    );
  });

  it('keeps an address and its query in step, and refuses what is not an address', async () => {
    const script = `(() => {
      const url = new URL('https://example.com/search?q=old');
      url.searchParams.set('q', 'new value');
      url.searchParams.append('page', '2');
      const after = url.href;
      url.search = '?fresh=1';
      return { after, fresh: url.searchParams.get('fresh'), href: url.href, bad: URL.canParse('not a url'), relative: URL.canParse('/x') };
    })()`;

    expect(JSON.parse(await inSandbox(script))).toEqual({
      after: 'https://example.com/search?q=new+value&page=2',
      fresh: '1',
      href: 'https://example.com/search?fresh=1',
      bad: false,
      relative: false,
    });
  });

  it('decodes broken UTF-8 byte by byte as browsers do, and refuses it when fatal', async () => {
    const cases = [
      [0xe0, 0x80, 0x80],
      [0xed, 0xa0, 0x80],
      [0xf4, 0x90, 0x80, 0x80],
      [0xe0, 0x9f, 0x80],
      [0xe2, 0x82],
      [0xef, 0xbb, 0xbf, 0x61],
    ];

    expect(
      JSON.parse(
        await inSandbox(
          `${JSON.stringify(cases)}.map((bytes) => new TextDecoder().decode(new Uint8Array(bytes)))`,
        ),
      ),
    ).toEqual(cases.map((bytes) => new TextDecoder().decode(new Uint8Array(bytes))));
    expect(
      JSON.parse(
        await inSandbox(`(() => {
          const kept = new TextDecoder('utf-8', { ignoreBOM: true }).decode(new Uint8Array([0xef, 0xbb, 0xbf, 0x61]));
          let refused = false;
          try { new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array([0xff])); } catch { refused = true; }
          return { kept, refused, fatal: new TextDecoder('utf-8', { fatal: true }).fatal };
        })()`),
      ),
    ).toEqual({ kept: '﻿a', refused: true, fatal: true });
  });

  it('decodes each good escape in a query even beside a bad one, and encodes what it cannot read', async () => {
    const inputs = ['a=%zz%C3%A9', 'b=%E2%82', 'c=%41+%42'];

    expect(
      JSON.parse(
        await inSandbox(
          `${JSON.stringify(inputs)}.map((input) => new URLSearchParams(input).toString())`,
        ),
      ),
    ).toEqual(inputs.map((input) => new URLSearchParams(input).toString()));
    expect(JSON.parse(await inSandbox(`new URLSearchParams({ x: '\\uD800' }).toString()`))).toBe(
      new URLSearchParams({ x: '\uD800' }).toString(),
    );
  });

  it('changes an address through its setters, keeping one searchParams that follows it', async () => {
    const script = `(() => {
      const url = new URL('https://example.com/a?q=1');
      const params = url.searchParams;
      url.search = '?z=2';
      const followed = params.get('z');
      const same = params === url.searchParams;
      url.port = '8443';
      url.hostname = 'Other.Example.org';
      url.username = 'me';
      url.password = 'p@ss';
      const changed = url.href;
      url.host = 'third.example.net:443';
      const host = url.host;
      url.href = 'https://fourth.example/x?y=1';
      return { followed, same, changed, host, href: url.href, y: params.get('y') };
    })()`;
    const url = new URL('https://example.com/a?q=1');

    url.search = '?z=2';
    url.port = '8443';
    url.hostname = 'Other.Example.org';
    url.username = 'me';
    url.password = 'p@ss';

    expect(JSON.parse(await inSandbox(script))).toEqual({
      followed: '2',
      same: true,
      changed: url.href,
      host: 'third.example.net',
      href: 'https://fourth.example/x?y=1',
      y: '1',
    });
  });

  it('lets a plugin bring its own copy of a helper', async () => {
    expect(
      JSON.parse(
        await inSandbox(`(() => { globalThis.btoa = () => 'mine'; return btoa('x'); })()`),
      ),
    ).toBe('mine');

    const quickJs = await getQuickJS();
    const vm = quickJs.newContext();

    try {
      vm.unwrapResult(vm.evalCode(SANDBOX_HELPERS)).dispose();
      vm.unwrapResult(vm.evalCode('class URL { constructor() { this.mine = true; } }')).dispose();

      const result = vm.unwrapResult(vm.evalCode('new URL().mine'));

      expect(vm.dump(result)).toBe(true);
      result.dispose();
    } finally {
      vm.dispose();
    }
  });
});
