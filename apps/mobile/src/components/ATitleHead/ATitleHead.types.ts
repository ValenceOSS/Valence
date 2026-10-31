type ATitleHeadProps = {
  title: string;
  ground?: string;
} & (
  | { mediaId: string; hasBackdrop: boolean; letteredBy: string | null }
  | { backdrop: string | null; lettering: string | null; clip?: string | null }
);

export type { ATitleHeadProps };
