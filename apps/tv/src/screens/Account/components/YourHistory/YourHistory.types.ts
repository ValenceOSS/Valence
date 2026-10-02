type YourHistoryProps = {
  onOpen: (wanted: { kind: 'film' | 'show'; mediaId: string }) => void;
  onFocus: () => void;
};

export type { YourHistoryProps };
