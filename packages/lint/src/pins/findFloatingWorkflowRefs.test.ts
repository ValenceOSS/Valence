import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findFloatingWorkflowRefs } from './findFloatingWorkflowRefs';

const WORKFLOWS = join(import.meta.dirname, '..', '..', '..', '..', '.github', 'workflows');

describe('findFloatingWorkflowRefs', () => {
  it('lists an action named by a tag or a branch', () => {
    const workflow = [
      'steps:',
      '  - uses: actions/checkout@v7',
      '  - uses: dtolnay/rust-toolchain@stable',
      '  - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0',
    ].join('\n');

    expect(findFloatingWorkflowRefs(workflow)).toEqual([
      'actions/checkout@v7',
      'dtolnay/rust-toolchain@stable',
    ]);
  });

  it('reads an action whether or not it is quoted', () => {
    const workflow = [
      '  - uses: "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1" # v7.0.1',
      "  - uses: 'actions/checkout@v7'",
    ].join('\n');

    expect(findFloatingWorkflowRefs(workflow)).toEqual(['actions/checkout@v7']);
  });

  it('leaves an action or a workflow from this repository alone', () => {
    expect(findFloatingWorkflowRefs('    uses: ./.github/workflows/desktop.yml\n')).toEqual([]);
  });

  it('lists a runner image named latest, wherever it is set', () => {
    const workflow = [
      'runs-on: ubuntu-latest',
      'runs-on: macos-26',
      '"runner": "windows-latest",',
      'runs-on: macos-latest-large',
    ].join('\n');

    expect(findFloatingWorkflowRefs(workflow)).toEqual([
      'ubuntu-latest',
      'windows-latest',
      'macos-latest-large',
    ]);
  });

  it.each(readdirSync(WORKFLOWS).filter((name) => /\.ya?ml$/u.test(name)))(
    'finds nothing floating in %s',
    (name) => {
      expect(findFloatingWorkflowRefs(readFileSync(join(WORKFLOWS, name), 'utf8'))).toEqual([]);
    },
  );
});
