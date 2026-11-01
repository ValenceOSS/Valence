// oxlint-disable-next-line valence/no-hard-coded-strings -- code that runs inside the sandbox
const SANDBOX_HELPERS = `
(() => {
  const define = (name, value) =>
    Object.defineProperty(globalThis, name, { value, writable: true, configurable: true, enumerable: false });
  const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  const btoa = (...given) => {
    if (given.length === 0) throw new TypeError('btoa needs something to encode.');
    const text = String(given[0]);
    let out = '';
    for (let at = 0; at < text.length; at += 3) {
      const held = Math.min(3, text.length - at);
      let chunk = 0;
      for (let k = 0; k < 3; k += 1) {
        const code = k < held ? text.charCodeAt(at + k) : 0;
        if (code > 255) throw new Error('btoa takes only characters of one byte.');
        chunk = chunk * 256 + code;
      }
      out += BASE64[(chunk >> 18) & 63] + BASE64[(chunk >> 12) & 63] +
        (held > 1 ? BASE64[(chunk >> 6) & 63] : '=') + (held > 2 ? BASE64[chunk & 63] : '=');
    }
    return out;
  };

  const atob = (input) => {
    let text = String(input).replace(/[\\t\\n\\f\\r ]/g, '');
    if (text.length % 4 === 0) text = text.replace(/==?$/, '');
    if (text.length % 4 === 1 || /[^A-Za-z0-9+/]/.test(text)) {
      throw new Error('atob was given something that is not base64.');
    }
    let out = '';
    for (let at = 0; at < text.length; at += 4) {
      const part = text.slice(at, at + 4);
      let chunk = 0;
      for (let k = 0; k < 4; k += 1) chunk = chunk * 64 + (k < part.length ? BASE64.indexOf(part[k]) : 0);
      out += String.fromCharCode((chunk >> 16) & 255);
      if (part.length > 2) out += String.fromCharCode((chunk >> 8) & 255);
      if (part.length > 3) out += String.fromCharCode(chunk & 255);
    }
    return out;
  };

  class TextEncoder {
    get encoding() { return 'utf-8'; }
    encode(input = '') {
      const bytes = [];
      for (const character of String(input)) {
        let point = character.codePointAt(0);
        if (point >= 0xd800 && point <= 0xdfff) point = 0xfffd;
        if (point < 0x80) bytes.push(point);
        else if (point < 0x800) bytes.push(0xc0 | (point >> 6), 0x80 | (point & 63));
        else if (point < 0x10000) bytes.push(0xe0 | (point >> 12), 0x80 | ((point >> 6) & 63), 0x80 | (point & 63));
        else bytes.push(0xf0 | (point >> 18), 0x80 | ((point >> 12) & 63), 0x80 | ((point >> 6) & 63), 0x80 | (point & 63));
      }
      return new Uint8Array(bytes);
    }
  }

  class TextDecoder {
    #fatal;
    #ignoreBOM;
    constructor(label = 'utf-8', options = {}) {
      const named = String(label).trim().toLowerCase();
      if (named !== 'utf-8' && named !== 'utf8' && named !== 'unicode-1-1-utf-8') {
        throw new RangeError('Only UTF-8 can be decoded here.');
      }
      this.#fatal = Boolean(options.fatal);
      this.#ignoreBOM = Boolean(options.ignoreBOM);
    }
    get encoding() { return 'utf-8'; }
    get fatal() { return this.#fatal; }
    get ignoreBOM() { return this.#ignoreBOM; }
    decode(input) {
      if (input === undefined) return '';
      const bytes = input instanceof Uint8Array
        ? input
        : ArrayBuffer.isView(input)
          ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
          : new Uint8Array(input);
      const points = [];
      let out = '';
      let point = 0;
      let needed = 0;
      let seen = 0;
      let lower = 0x80;
      let upper = 0xbf;
      const broken = () => {
        if (this.#fatal) throw new TypeError('The bytes are not valid UTF-8.');
        points.push(0xfffd);
      };
      let at = !this.#ignoreBOM && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0;
      while (at < bytes.length) {
        const byte = bytes[at];
        if (needed === 0) {
          if (byte <= 0x7f) points.push(byte);
          else if (byte >= 0xc2 && byte <= 0xdf) { needed = 1; point = byte & 0x1f; }
          else if (byte >= 0xe0 && byte <= 0xef) {
            if (byte === 0xe0) lower = 0xa0;
            if (byte === 0xed) upper = 0x9f;
            needed = 2; point = byte & 0xf;
          } else if (byte >= 0xf0 && byte <= 0xf4) {
            if (byte === 0xf0) lower = 0x90;
            if (byte === 0xf4) upper = 0x8f;
            needed = 3; point = byte & 0x7;
          } else broken();
          at += 1;
        } else if (byte < lower || byte > upper) {
          point = 0; needed = 0; seen = 0; lower = 0x80; upper = 0xbf;
          broken();
        } else {
          lower = 0x80; upper = 0xbf;
          point = (point << 6) | (byte & 0x3f);
          seen += 1;
          at += 1;
          if (seen === needed) {
            points.push(point);
            point = 0; needed = 0; seen = 0;
          }
        }
        if (points.length >= 4096) { out += String.fromCodePoint(...points); points.length = 0; }
      }
      if (needed !== 0) broken();
      return out + String.fromCodePoint(...points);
    }
  }

  const KEPT_IN_FORMS = /^[*\\-.0-9A-Z_a-z]$/;
  const formEncoded = (text) => {
    let out = '';
    for (const byte of new TextEncoder().encode(String(text))) {
      const character = String.fromCharCode(byte);
      out += byte === 0x20
        ? '+'
        : KEPT_IN_FORMS.test(character)
          ? character
          : '%' + byte.toString(16).toUpperCase().padStart(2, '0');
    }
    return out;
  };
  const formDecoded = (text) => {
    const bytes = [];
    const spaced = text.replace(/\\+/g, ' ');
    for (let at = 0; at < spaced.length; at += 1) {
      const character = spaced[at];
      if (character === '%' && /^[0-9A-Fa-f]{2}$/.test(spaced.slice(at + 1, at + 3))) {
        bytes.push(parseInt(spaced.slice(at + 1, at + 3), 16));
        at += 2;
      } else {
        const point = spaced.codePointAt(at);
        if (point > 0xffff) at += 1;
        bytes.push(...new TextEncoder().encode(String.fromCodePoint(point)));
      }
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
  };
  const PAIRS = Symbol('pairs');
  const CHANGED = Symbol('changed');

  class URLSearchParams {
    constructor(init = '') {
      this[PAIRS] = [];
      this[CHANGED] = null;
      if (init instanceof URLSearchParams) {
        this[PAIRS] = init[PAIRS].map(([name, value]) => [name, value]);
      } else if (typeof init === 'string') {
        this.#read(init);
      } else if (init !== null && typeof init === 'object' && typeof init[Symbol.iterator] === 'function') {
        for (const pair of init) {
          const items = [...pair];
          if (items.length !== 2) throw new TypeError('Each pair has a name and a value.');
          this[PAIRS].push([String(items[0]), String(items[1])]);
        }
      } else if (init !== null && typeof init === 'object') {
        for (const name of Object.keys(init)) this[PAIRS].push([name, String(init[name])]);
      } else {
        this.#read(String(init));
      }
    }
    #read(text) {
      this[PAIRS] = [];
      for (const part of text.replace(/^\\?/, '').split('&')) {
        if (part === '') continue;
        const equals = part.indexOf('=');
        this[PAIRS].push(equals === -1
          ? [formDecoded(part), '']
          : [formDecoded(part.slice(0, equals)), formDecoded(part.slice(equals + 1))]);
      }
    }
    #changed() { if (this[CHANGED] !== null) this[CHANGED](); }
    get size() { return this[PAIRS].length; }
    append(name, value) { this[PAIRS].push([String(name), String(value)]); this.#changed(); }
    delete(name, value) {
      const named = String(name);
      this[PAIRS] = this[PAIRS].filter(([each, held]) => each !== named || (value !== undefined && held !== String(value)));
      this.#changed();
    }
    get(name) { const found = this[PAIRS].find(([each]) => each === String(name)); return found === undefined ? null : found[1]; }
    getAll(name) { return this[PAIRS].filter(([each]) => each === String(name)).map(([, value]) => value); }
    has(name, value) { return this[PAIRS].some(([each, held]) => each === String(name) && (value === undefined || held === String(value))); }
    set(name, value) {
      const named = String(name);
      const at = this[PAIRS].findIndex(([each]) => each === named);
      if (at === -1) { this[PAIRS].push([named, String(value)]); }
      else {
        this[PAIRS][at] = [named, String(value)];
        this[PAIRS] = this[PAIRS].filter(([each], index) => each !== named || index === at);
      }
      this.#changed();
    }
    sort() {
      this[PAIRS] = this[PAIRS].map((pair, index) => [pair, index])
        .sort(([a, i], [b, j]) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : i - j))
        .map(([pair]) => pair);
      this.#changed();
    }
    forEach(callback, self) { for (const [name, value] of this[PAIRS]) callback.call(self, value, name, this); }
    *keys() { for (const [name] of this[PAIRS]) yield name; }
    *values() { for (const [, value] of this[PAIRS]) yield value; }
    *entries() { for (const [name, value] of this[PAIRS]) yield [name, value]; }
    [Symbol.iterator]() { return this.entries(); }
    toString() { return this[PAIRS].map(([name, value]) => formEncoded(name) + '=' + formEncoded(value)).join('&'); }
  }

  const DEFAULT_PORTS = { 'http:': '80', 'https:': '443', 'ws:': '80', 'wss:': '443', 'ftp:': '21' };
  const SPECIAL = new Set(Object.keys(DEFAULT_PORTS).concat(['file:']));
  const escapeOutside = (text, pattern) =>
    text.replace(pattern, (c) => encodeURIComponent(c));
  const withoutDots = (path) => {
    const kept = [];
    const parts = path.split('/');
    for (let at = 0; at < parts.length; at += 1) {
      const part = parts[at];
      const isLast = at === parts.length - 1;
      if (part === '..' || part.toLowerCase() === '%2e%2e') {
        if (kept.length > 1) kept.pop();
        if (isLast) kept.push('');
      } else if (part === '.' || part.toLowerCase() === '%2e') {
        if (isLast) kept.push('');
      } else {
        kept.push(part);
      }
    }
    const joined = kept.join('/');
    return joined.startsWith('/') ? joined : '/' + joined;
  };
  const PARTS = Symbol('parts');

  const parse = (input, base) => {
    const text = String(input).trim().replace(/[\\t\\n\\r]/g, '');
    const schemed = /^([a-zA-Z][a-zA-Z0-9+.-]*):(.*)$/.exec(text);
    let parts;
    if (schemed !== null) {
      const protocol = schemed[1].toLowerCase() + ':';
      let rest = schemed[2];
      if (SPECIAL.has(protocol)) {
        rest = rest.replace(/\\\\/g, '/');
        if (!rest.startsWith('//')) {
          if (base !== undefined && base[PARTS].protocol === protocol) return parse(rest, base);
          rest = '//' + rest.replace(/^\\/*/, '');
        }
      }
      parts = rest.startsWith('//') ? authorityOf(protocol, rest.slice(2)) : opaqueOf(protocol, rest);
    } else {
      if (base === undefined) throw new TypeError('Invalid URL: ' + text);
      const from = base[PARTS];
      const relative = SPECIAL.has(from.protocol) ? text.replace(/\\\\/g, '/') : text;
      if (from.opaque) {
        if (!relative.startsWith('#')) throw new TypeError('Invalid URL: ' + text);
        parts = { ...from, hash: relative };
      } else if (relative.startsWith('//')) {
        parts = authorityOf(from.protocol, relative.slice(2));
      } else {
        const hashAt = relative.indexOf('#');
        const hash = hashAt === -1 ? '' : relative.slice(hashAt);
        const beforeHash = hashAt === -1 ? relative : relative.slice(0, hashAt);
        const queryAt = beforeHash.indexOf('?');
        const search = queryAt === -1 ? null : beforeHash.slice(queryAt);
        const path = queryAt === -1 ? beforeHash : beforeHash.slice(0, queryAt);
        const pathname = path === ''
          ? from.pathname
          : path.startsWith('/')
            ? withoutDots(path)
            : withoutDots(from.pathname.slice(0, from.pathname.lastIndexOf('/') + 1) + path);
        parts = {
          ...from,
          pathname,
          search: path === '' && search === null ? from.search : search ?? '',
          hash,
        };
      }
    }
    return tidy(parts);
  };

  const splitTail = (rest) => {
    const hashAt = rest.indexOf('#');
    const hash = hashAt === -1 ? '' : rest.slice(hashAt);
    const beforeHash = hashAt === -1 ? rest : rest.slice(0, hashAt);
    const queryAt = beforeHash.indexOf('?');
    return {
      hash,
      search: queryAt === -1 ? '' : beforeHash.slice(queryAt),
      path: queryAt === -1 ? beforeHash : beforeHash.slice(0, queryAt),
    };
  };

  const authorityOf = (protocol, rest) => {
    const end = rest.search(/[/?#]/);
    const authority = end === -1 ? rest : rest.slice(0, end);
    const tail = splitTail(end === -1 ? '' : rest.slice(end));
    const at = authority.lastIndexOf('@');
    const userinfo = at === -1 ? '' : authority.slice(0, at);
    const hostPort = at === -1 ? authority : authority.slice(at + 1);
    const portMatch = /^(\\[[^\\]]*\\]|[^:]*)(?::(\\d*))?$/.exec(hostPort);
    if (portMatch === null) throw new TypeError('Invalid URL');
    const hostname = portMatch[1].toLowerCase();
    if (SPECIAL.has(protocol) && protocol !== 'file:' && hostname === '') throw new TypeError('Invalid URL');
    if (/[\\s<>^|%]/.test(hostname.replace(/%[0-9a-f]{2}/g, ''))) throw new TypeError('Invalid URL');
    const port = portMatch[2] ?? '';
    if (port !== '' && Number(port) > 65535) throw new TypeError('Invalid URL');
    const colon = userinfo.indexOf(':');
    return {
      protocol,
      opaque: false,
      username: colon === -1 ? userinfo : userinfo.slice(0, colon),
      password: colon === -1 ? '' : userinfo.slice(colon + 1),
      hostname,
      port: port === '' ? '' : String(Number(port)),
      pathname: SPECIAL.has(protocol) ? withoutDots(tail.path === '' ? '/' : tail.path) : tail.path,
      search: tail.search,
      hash: tail.hash,
    };
  };

  const opaqueOf = (protocol, rest) => {
    const tail = splitTail(rest);
    return { protocol, opaque: true, username: '', password: '', hostname: '', port: '', pathname: tail.path, search: tail.search, hash: tail.hash };
  };

  const tidy = (parts) => ({
    ...parts,
    port: parts.port === DEFAULT_PORTS[parts.protocol] ? '' : parts.port,
    pathname: parts.opaque ? parts.pathname : escapeOutside(parts.pathname, /[^!$&'()*+,;=:@/%A-Za-z0-9._~-]/gu),
    search: parts.search === '?' ? '' : escapeOutside(parts.search, /[^!$&'()*+,;=:@/?%A-Za-z0-9._~-]/gu),
    hash: parts.hash === '#' ? '' : escapeOutside(parts.hash, /[^!$&'()*+,;=:@/?#%A-Za-z0-9._~-]/gu),
  });

  class URL {
    constructor(input, base) {
      this[PARTS] = parse(input, base === undefined ? undefined : base instanceof URL ? base : new URL(base));
      this.#watch();
    }
    static canParse(input, base) {
      try { new URL(input, base); return true; } catch { return false; }
    }
    static parse(input, base) {
      try { return new URL(input, base); } catch { return null; }
    }
    #params = null;
    #watch() {
      if (this.#params === null) {
        this.#params = new URLSearchParams(this[PARTS].search);
        this.#params[CHANGED] = () => {
          const text = this.#params.toString();
          this[PARTS] = { ...this[PARTS], search: text === '' ? '' : '?' + text };
        };
      } else {
        this.#params[PAIRS] = new URLSearchParams(this[PARTS].search)[PAIRS];
      }
    }
    #change(parts) {
      this[PARTS] = tidy({ ...this[PARTS], ...parts });
    }
    get searchParams() { return this.#params; }
    get protocol() { return this[PARTS].protocol; }
    set protocol(value) {
      const protocol = String(value).replace(/:.*$/, '').toLowerCase() + ':';
      if (!/^[a-z][a-z0-9+.-]*:$/.test(protocol)) return;
      if (SPECIAL.has(protocol) !== SPECIAL.has(this[PARTS].protocol) || this[PARTS].opaque) return;
      this.#change({ protocol });
    }
    get username() { return this[PARTS].username; }
    set username(value) { if (!this[PARTS].opaque) this.#change({ username: encodeURIComponent(String(value)) }); }
    get password() { return this[PARTS].password; }
    set password(value) { if (!this[PARTS].opaque) this.#change({ password: encodeURIComponent(String(value)) }); }
    get hostname() { return this[PARTS].hostname; }
    set hostname(value) {
      if (this[PARTS].opaque) return;
      const hostname = String(value).toLowerCase();
      if (hostname === '' || /[\\s/?#@:<>^|%]/.test(hostname.replace(/^\\[.*\\]$/, 'v6'))) return;
      this.#change({ hostname });
    }
    get port() { return this[PARTS].port; }
    set port(value) {
      if (this[PARTS].opaque) return;
      const digits = /^\\d*/.exec(String(value))[0];
      if (digits !== '' && Number(digits) > 65535) return;
      this.#change({ port: digits === '' ? '' : String(Number(digits)) });
    }
    get host() { const { hostname, port } = this[PARTS]; return port === '' ? hostname : hostname + ':' + port; }
    set host(value) {
      const found = /^(\\[[^\\]]*\\]|[^:]*)(?::(\\d*))?$/.exec(String(value));
      if (found === null) return;
      this.hostname = found[1];
      if (found[2] !== undefined) this.port = found[2];
    }
    get origin() {
      const { protocol } = this[PARTS];
      return SPECIAL.has(protocol) && protocol !== 'file:' ? protocol + '//' + this.host : 'null';
    }
    get pathname() { return this[PARTS].pathname; }
    set pathname(value) {
      if (this[PARTS].opaque) return;
      const path = String(value);
      this[PARTS] = tidy({ ...this[PARTS], pathname: withoutDots(path.startsWith('/') ? path : '/' + path) });
    }
    get search() { return this[PARTS].search; }
    set search(value) {
      const text = String(value);
      this.#change({ search: text === '' ? '' : text.startsWith('?') ? text : '?' + text });
      this.#watch();
    }
    get hash() { return this[PARTS].hash; }
    set hash(value) {
      const text = String(value);
      this[PARTS] = tidy({ ...this[PARTS], hash: text === '' ? '' : text.startsWith('#') ? text : '#' + text });
    }
    set href(value) {
      this[PARTS] = parse(value, undefined);
      this.#watch();
    }
    get href() {
      const parts = this[PARTS];
      if (parts.opaque) return parts.protocol + parts.pathname + parts.search + parts.hash;
      const userinfo = parts.username === '' && parts.password === ''
        ? ''
        : parts.username + (parts.password === '' ? '' : ':' + parts.password) + '@';
      return parts.protocol + '//' + userinfo + this.host + parts.pathname + parts.search + parts.hash;
    }
    toString() { return this.href; }
    toJSON() { return this.href; }
  }

  define('btoa', btoa);
  define('atob', atob);
  define('TextEncoder', TextEncoder);
  define('TextDecoder', TextDecoder);
  define('URLSearchParams', URLSearchParams);
  define('URL', URL);
})();
`;

export { SANDBOX_HELPERS };
