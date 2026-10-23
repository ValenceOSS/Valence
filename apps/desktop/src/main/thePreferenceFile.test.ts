import { beforeEach, describe, expect, it, vi } from 'vitest';

type Options = { accessPropertiesByDotNotation?: boolean };

const held = new Map<string, string | number>();

const asked: Options[] = [];

const told: ((now: Record<string, string | number>) => void)[] = [];

const changed = () => {
  for (const tell of told) {
    tell(Object.fromEntries(held));
  }
};

vi.mock('conf', () => ({
  default: class {
    constructor(options: Options) {
      asked.push(options);
    }

    get store() {
      return Object.fromEntries(held);
    }

    set(key: string, value: string | number) {
      held.set(key, value);
      changed();
    }

    delete(key: string) {
      held.delete(key);
      changed();
    }

    onDidAnyChange(tell: (now: Record<string, string | number>) => void) {
      told.push(tell);

      return () => undefined;
    }
  },
}));

const { thePreferenceFile } = await import('./thePreferenceFile');

beforeEach(() => {
  held.clear();
  changed();
});

describe('theServerAddress', () => {
  it('answers with nothing before anybody has said', async () => {
    const { theServerAddress } = await import('./theServerAddress');

    expect(theServerAddress()).toBe('');
  });

  it('answers with what the window wrote down', async () => {
    const { theServerAddress } = await import('./theServerAddress');

    held.set('valence.server.address', 'https://valence.example.com');
    changed();

    expect(theServerAddress()).toBe('https://valence.example.com');
  });

  it('forgets it when asked, so this client asks again', async () => {
    const { forgetTheServerAddress, theServerAddress } = await import('./theServerAddress');

    held.set('valence.server.address', 'https://valence.example.com');
    forgetTheServerAddress();

    expect(theServerAddress()).toBe('');
  });
});

describe('thePreferenceFile', () => {
  it('reads a dot in a key as part of the key, since every preference Valence has contains one', () => {
    thePreferenceFile();

    expect(asked[0]).toMatchObject({ accessPropertiesByDotNotation: false });
  });

  it('opens once however often it is asked, since every request asks', () => {
    thePreferenceFile();
    thePreferenceFile();

    expect(asked).toHaveLength(1);
  });

  it('hands back what it was told', () => {
    const file = thePreferenceFile();

    file.write('valence.server.address', 'https://valence.example.com');

    expect(file.all()['valence.server.address']).toBe('https://valence.example.com');
  });

  it('lets go of what it was told to forget', () => {
    const file = thePreferenceFile();

    file.write('valence.server.address', 'https://valence.example.com');
    file.forget('valence.server.address');

    expect(file.all()).toEqual({});
  });

  it('ignores anything in the file that is not a preference, since a hand can edit it', () => {
    const file = thePreferenceFile();

    held.set('a-number', 42);

    expect(file.all()).toEqual({});
  });

  it('reads from memory, and hears a change the file was given from elsewhere', () => {
    const file = thePreferenceFile();

    file.write('valence.server.address', 'http://one.local');
    held.set('valence.server.address', 'http://two.local');

    expect(file.read('valence.server.address')).toBe('http://one.local');

    changed();

    expect(file.read('valence.server.address')).toBe('http://two.local');
  });
});
