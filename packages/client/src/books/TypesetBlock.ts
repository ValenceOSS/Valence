type TypesetRun = { text: string; isItalic: boolean; isBold: boolean };

type TypesetBlock = {
  kind: 'title' | 'heading' | 'subheading' | 'paragraph' | 'quote' | 'break';
  runs: TypesetRun[];
  anchors: string[];
};

export type { TypesetBlock, TypesetRun };
