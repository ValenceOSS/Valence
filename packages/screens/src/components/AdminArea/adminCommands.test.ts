import { describe, expect, it } from 'vitest';
import { ADMIN_SECTIONS } from './adminSections';
import { ADMIN_COMMANDS } from './adminCommands';

describe('ADMIN_COMMANDS', () => {
  it('names only pages the admin area has, each action once', () => {
    const pages = new Set(
      ADMIN_SECTIONS.flatMap((section) => section.items.map((item) => item.id)),
    );

    for (const command of ADMIN_COMMANDS) {
      expect(pages).toContain(command.panel);
      expect(command.label).not.toBe('');
    }

    expect(new Set(ADMIN_COMMANDS.map((command) => command.id)).size).toBe(ADMIN_COMMANDS.length);
  });
});
