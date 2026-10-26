type ALikeThisShelfProps = {
  mediaId: string | null;
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
};

export type { ALikeThisShelfProps };
