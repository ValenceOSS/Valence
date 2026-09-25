type BranchTip = { name: string; commit: string };

type PullRequestHead = { branch: string; commit: string; state: 'OPEN' | 'CLOSED' | 'MERGED' };

export type { BranchTip, PullRequestHead };
