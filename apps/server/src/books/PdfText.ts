type PdfLine = {
  text: string;
  size: number;
  isBold: boolean;
  top: number;
  bottom: number;
  left: number;
  right: number;
};

type PdfPageText = {
  height: number;
  blocks: PdfLine[][];
};

type PdfPart = { title: string; from: number; to: number };

export type { PdfLine, PdfPageText, PdfPart };
