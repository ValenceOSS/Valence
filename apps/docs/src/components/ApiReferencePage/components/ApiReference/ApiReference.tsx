import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';

const THEME = `
  :root, .light-mode, .dark-mode {
    --scalar-font: var(--font-body, system-ui, sans-serif);
    --scalar-background-1: var(--color-surface);
    --scalar-background-2: var(--color-surface-raised);
    --scalar-background-3: var(--color-surface-raised);
    --scalar-background-accent: color-mix(in oklab, var(--color-accent) 12%, transparent);
    --scalar-border-color: var(--color-border);
    --scalar-color-1: var(--color-text);
    --scalar-color-2: var(--color-text-muted);
    --scalar-color-3: var(--color-text-muted);
    --scalar-color-accent: var(--color-accent);
    --scalar-sidebar-background-1: var(--color-surface);
    --scalar-sidebar-color-1: var(--color-text);
    --scalar-sidebar-color-2: var(--color-text-muted);
    --scalar-sidebar-border-color: var(--color-border);
    --scalar-sidebar-item-hover-background: var(--color-surface-raised);
    --scalar-sidebar-item-active-background: color-mix(in oklab, var(--color-accent) 12%, transparent);
    --scalar-sidebar-color-active: var(--color-accent);
  }
`;

/**
 * Draws the interactive reference for the API from the document the build wrote beside the site.
 */
const ApiReference = () => (
  <ApiReferenceReact
    configuration={{
      url: '/openapi.json',
      darkMode: true,
      hideDarkModeToggle: true,
      layout: 'modern',
      showDeveloperTools: 'never',
      agent: { disabled: true },
      mcp: { disabled: true },
      withDefaultFonts: false,
      customCss: THEME,
      metaData: { title: 'Valence API reference' },
    }}
  />
);

ApiReference.displayName = 'ApiReference';

export { ApiReference };
