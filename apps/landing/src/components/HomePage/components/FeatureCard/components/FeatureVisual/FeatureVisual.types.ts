type FeatureVisualKind =
  | 'devices'
  | 'hdr'
  | 'reader'
  | 'party'
  | 'offline'
  | 'notifications'
  | 'sessions'
  | 'webhooks'
  | 'setup'
  | 'contract'
  | 'apiKeys'
  | 'plugins'
  | 'terminal'
  | 'household'
  | 'auth';

type FeatureVisualProps = {
  kind: FeatureVisualKind;
};

export type { FeatureVisualKind, FeatureVisualProps };
