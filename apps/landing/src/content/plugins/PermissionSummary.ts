type PermissionSummary = {
  id: string;
  kind: 'account' | 'library' | 'viewing' | 'playlists' | 'requests';
  label: string;
};

export type { PermissionSummary };
