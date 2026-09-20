import { describe, expect, it } from 'vitest';
import { readDefinition } from '@ValenceRequests/cardigann/readDefinition';
import { aDefinitionYaml } from './aDefinitionYaml';
import { describeDefinition } from './describeDefinition';

const SETTINGS = `settings:
  - name: username
    type: text
    label: Username
  - name: password
    type: password
    label: Password
  - name: freeleech
    type: checkbox
    label: <b>Free</b> only
    default: true
  - name: sort
    type: select
    label: Sort
    default: size
    options:
      time: created
      size: size
  - name: order
    type: select
    label: Order
    options:
      desc: descending
  - name: note
    type: info
    label: About
    default: Find your key at <a href="https://x.example/">your profile</a>.
  - name: info_cookie
    type: info_cookie
  - name: info_flaresolverr
    type: info_flaresolverr
  - name: quality
    type: multi-select
    label: ""
login:
  method: form
  path: login.php
  captcha:
    type: image
    selector: img
    input: code`;

describe('describeDefinition', () => {
  it('says what the add-indexer form needs to ask for', () => {
    const definition = readDefinition(aDefinitionYaml('alpha', SETTINGS));
    const detail = definition === null ? null : describeDefinition(definition);

    expect(detail).toMatchObject({
      id: 'alpha',
      links: ['https://alpha.example/', 'https://mirror.alpha.example/'],
      hasCaptcha: true,
      needsFlareSolverr: true,
      standardCategories: [
        { id: 2000, name: 'Movies', subcategories: [{ id: 2040, name: 'Movies/HD' }] },
        { id: 5000, name: 'TV', subcategories: [] },
        { id: 100_001, name: 'Films', subcategories: [] },
        { id: 100_002, name: 'Series', subcategories: [] },
      ],
    });
    expect(detail?.settings.slice(0, 6)).toEqual([
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
        name: 'freeleech',
        kind: 'checkbox',
        label: 'Free only',
        detail: null,
        default: true,
        options: [],
        isSecret: false,
      },
      {
        name: 'sort',
        kind: 'select',
        label: 'Sort',
        detail: null,
        default: 'size',
        options: [
          { value: 'time', label: 'created' },
          { value: 'size', label: 'size' },
        ],
        isSecret: false,
      },
      {
        name: 'order',
        kind: 'select',
        label: 'Order',
        detail: null,
        default: 'desc',
        options: [{ value: 'desc', label: 'descending' }],
        isSecret: false,
      },
      {
        name: 'note',
        kind: 'info',
        label: 'About',
        detail: 'Find your key at your profile.',
        default: null,
        options: [],
        isSecret: false,
      },
    ]);
    expect(detail?.settings[6]?.detail).toContain('Cookie header');
    expect(detail?.settings[7]?.detail).toContain('FLARESOLVERR_URL');
    expect(detail?.settings[8]).toEqual({
      name: 'quality',
      kind: 'text',
      label: 'quality',
      detail: null,
      default: null,
      options: [],
      isSecret: false,
    });
  });

  it('asks for a username and password where a definition names no settings', () => {
    const definition = readDefinition(aDefinitionYaml('beta'));

    expect(
      definition === null
        ? []
        : describeDefinition(definition).settings.map((setting) => setting.name),
    ).toEqual(['username', 'password']);
  });

  it('shows an info setting with no text as having none', () => {
    const definition = readDefinition(
      aDefinitionYaml('gamma', 'settings:\n  - {name: x, type: info, label: X}'),
    );

    expect(definition === null ? null : describeDefinition(definition).settings[0]?.detail).toBe(
      '',
    );
  });
});
