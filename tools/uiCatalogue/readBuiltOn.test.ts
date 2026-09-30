import { describe, expect, it } from 'vitest';
import { readBuiltOn } from './readBuiltOn';

describe('readBuiltOn', () => {
  it('names each library a component imports, once, in the order it first appears', () => {
    const built = readBuiltOn([
      "import * as RadixDialog from '@radix-ui/react-dialog';\nimport { motion } from 'motion/react';\nimport { cn } from '@ValenceUI/cn';",
      "import type { DialogProps } from '@radix-ui/react-dialog';\nimport { useState } from 'react';",
    ]);

    expect(built.map((one) => one.name)).toEqual(['Radix Dialog', 'Motion']);
  });

  it('puts a library it only animates with after the one it is made of', () => {
    const built = readBuiltOn([
      "import { motion } from 'motion/react';\nimport { useReactTable } from '@tanstack/react-table';",
    ]);

    expect(built.map((one) => one.name)).toEqual(['TanStack Table', 'Motion']);
  });

  it('finds nothing in a component built only on the platform', () => {
    expect(readBuiltOn(["import { useState } from 'react';"])).toEqual([]);
  });
});
