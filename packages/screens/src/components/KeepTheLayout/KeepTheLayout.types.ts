type LayoutTrial = {
  endsAt: number;
  keep: () => void;
  goBack: () => void;
};

declare global {
  interface Window {
    valenceLayoutTrial?: LayoutTrial | undefined;
  }
}

export type { LayoutTrial };
