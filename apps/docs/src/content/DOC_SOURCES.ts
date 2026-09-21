const DOC_SOURCES = import.meta.glob<string>('./*/*.mdx', { query: '?raw', import: 'default' });

export { DOC_SOURCES };
