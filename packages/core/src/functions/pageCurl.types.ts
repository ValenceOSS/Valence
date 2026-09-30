type CurlPoint = { x: number; y: number };

type CurlLeaf = {
  x: number;
  y: number;
  width: number;
  height: number;
  spine: 'left' | 'right';
};

type CurlFold = { at: CurlPoint; normal: CurlPoint };

type CurlHold = {
  heading: 1 | -1;
  leaf: CurlLeaf;
  corner: CurlPoint;
  away: CurlPoint;
};

type CurlMatrix = readonly [number, number, number, number, number, number];

type PageCurl = {
  fold: CurlFold;
  front: CurlPoint[];
  flap: CurlPoint[];
  reflect: CurlMatrix;
};

export type { CurlFold, CurlHold, CurlLeaf, CurlMatrix, CurlPoint, PageCurl };
