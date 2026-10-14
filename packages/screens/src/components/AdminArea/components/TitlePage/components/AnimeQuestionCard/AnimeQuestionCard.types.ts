import type { AnimeNumbering, AnimeQuestion } from '@ValenceContracts/schemas/Anime';

type AnimeQuestionCardProps = {
  question: AnimeQuestion;
  isBusy: boolean;
  onAnswer: (numbering: AnimeNumbering, isRemembered: boolean) => void;
  onDismiss: () => void;
};

export type { AnimeQuestionCardProps };
