const UPSTREAM_DOCS: Readonly<Record<string, { name: string; url: string }>> = {
  '@tanstack/react-table': {
    name: 'TanStack Table',
    url: 'https://tanstack.com/table/latest/docs/api/core/table',
  },
  '@tanstack/react-virtual': {
    name: 'TanStack Virtual',
    url: 'https://tanstack.com/virtual/latest/docs/api/virtualizer',
  },
  cmdk: { name: 'cmdk', url: 'https://github.com/pacocoursey/cmdk#readme' },
  sonner: { name: 'Sonner', url: 'https://sonner.emilkowal.ski/toaster' },
  vaul: { name: 'Vaul', url: 'https://vaul.emilkowal.ski/api' },
  'motion/react': { name: 'Motion', url: 'https://motion.dev/docs/react-motion-component' },
  '@number-flow/react': { name: 'NumberFlow', url: 'https://number-flow.barvian.me/' },
  recharts: { name: 'Recharts', url: 'https://recharts.org/en-US/api' },
  qrcode: { name: 'node-qrcode', url: 'https://github.com/soldair/node-qrcode#api' },
  '@paper-design/shaders-react': {
    name: 'Paper Shaders',
    url: 'https://github.com/paper-design/shaders#readme',
  },
};

export { UPSTREAM_DOCS };
