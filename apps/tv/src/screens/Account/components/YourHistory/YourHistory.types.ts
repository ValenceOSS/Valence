type YourHistoryProps = {
  onOpen: (wanted: { kind: 'film' | 'show'; mediaId: string; seriesId?: string | null }) => void;
  onFocus: () => void;
};

export type { YourHistoryProps };
