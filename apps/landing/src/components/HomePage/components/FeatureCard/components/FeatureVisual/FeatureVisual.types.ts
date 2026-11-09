type FeatureVisualKind =
  | 'devices'
  | 'hdr'
  | 'reader'
  | 'party'
  | 'offline'
  | 'notifications'
  | 'jobs'
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
