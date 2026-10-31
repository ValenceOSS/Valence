import { tokens } from '@ValenceTv/theme/tokens';

const BANNER_CARD = {
  borderRadius: tokens.radii.xl,
  backgroundColor: 'rgba(28,28,30,0.92)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  shadowColor: '#000000',
  shadowOpacity: 0.5,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 12 },
} as const;

export { BANNER_CARD };
