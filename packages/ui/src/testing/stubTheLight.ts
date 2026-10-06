import { createElement } from 'react';
import { vi } from 'vitest';

vi.mock('@ValenceUI/FoldGradient', () => ({
  FoldGradient: ({ className }: { className?: string }) =>
    createElement('div', { 'data-testid': 'shader-mount', className }),
}));
