import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildUiCatalogue } from './buildUiCatalogue';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');

describe('buildUiCatalogue', () => {
  const catalogue = buildUiCatalogue(ROOT);

  it('lists the components the repository gives an alias of their own, alphabetically', () => {
    const names = catalogue.map((doc) => doc.name);

    expect(names).toContain('Button');
    expect(names).toContain('TextField');
    expect(names).toEqual([...names].sort((one, other) => one.localeCompare(other)));
  });

  it('reads each component from its own source', () => {
    const button = catalogue.find((doc) => doc.name === 'Button');

    expect(button?.summary).toContain('`<button>`');
    expect(button?.props.find((prop) => prop.name === 'variant')?.values).toContain('secondary');
    expect(button?.props.find((prop) => prop.name === 'size')?.defaultValue).toBe("'md'");
  });

  it('points each component at the libraries it is built on', () => {
    const table = catalogue.find((doc) => doc.name === 'DataTable');
    const tooltip = catalogue.find((doc) => doc.name === 'Tooltip');
    const button = catalogue.find((doc) => doc.name === 'Button');

    expect(table?.builtOn.map((one) => one.name)).toContain('TanStack Table');
    expect(tooltip?.builtOn.map((one) => one.name)).toContain('Radix Tooltip');
    expect(button?.builtOn.map((one) => one.name)).not.toContain('Radix Dialog');
  });

  it('documents every prop of every component it lists', () => {
    const undocumented = catalogue.flatMap((doc) =>
      doc.props.filter((prop) => prop.type === '').map((prop) => `${doc.name}.${prop.name}`),
    );

    expect(undocumented).toEqual([]);
  });
});
