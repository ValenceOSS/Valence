type EpisodeExpression = {
  pattern: RegExp;
  isNamed: boolean;
  isOptimistic: boolean;
  isByDate: boolean;
  supportsAbsoluteNumbers: boolean;
};

export type { EpisodeExpression };
