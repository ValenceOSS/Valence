const DIALOG_KINDS = ['show', 'film', 'asking', 'person', 'collection'] as const;

type DialogKind = (typeof DIALOG_KINDS)[number];

export type { DialogKind };

export { DIALOG_KINDS };
