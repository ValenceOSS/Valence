import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const MAIN = readFileSync(join(import.meta.dirname, 'Main.ts'), 'utf8');

describe('Main', () => {
  it('loads the OpenAPI extension to zod before anything that builds a schema', () => {
    const first = MAIN.split('\n').find((line) => line.startsWith('import '));

    expect(first).toBe("import { z } from '@hono/zod-openapi';");
  });
});
