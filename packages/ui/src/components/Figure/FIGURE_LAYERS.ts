import linkedServers1Shape from '@ValenceFigures/linked-servers-1-shape.svg';
import linkedServers2Shape from '@ValenceFigures/linked-servers-2-shape.svg';
import linkedServers0 from '@ValenceFigures/linked-servers-0.svg';
import linkedServers1 from '@ValenceFigures/linked-servers-1.svg';
import linkedServers2 from '@ValenceFigures/linked-servers-2.svg';
import linkedServers01Guides from '@ValenceFigures/linked-servers-0-1-guides.svg';
import linkedServers01Reach from '@ValenceFigures/linked-servers-0-1-reach.svg';
import linkedServers12Guides from '@ValenceFigures/linked-servers-1-2-guides.svg';
import linkedServers12Reach from '@ValenceFigures/linked-servers-1-2-reach.svg';
import linkedServers02Guides from '@ValenceFigures/linked-servers-0-2-guides.svg';
import linkedServers02Reach from '@ValenceFigures/linked-servers-0-2-reach.svg';
import yours1Shape from '@ValenceFigures/fig-0-1-yours-1-shape.svg';
import yours0 from '@ValenceFigures/fig-0-1-yours-0.svg';
import yours1 from '@ValenceFigures/fig-0-1-yours-1.svg';
import yours01Guides from '@ValenceFigures/fig-0-1-yours-0-1-guides.svg';
import yours01Reach from '@ValenceFigures/fig-0-1-yours-0-1-reach.svg';
import media1Shape from '@ValenceFigures/fig-0-2-media-1-shape.svg';
import media2Shape from '@ValenceFigures/fig-0-2-media-2-shape.svg';
import media3Shape from '@ValenceFigures/fig-0-2-media-3-shape.svg';
import media0 from '@ValenceFigures/fig-0-2-media-0.svg';
import media1 from '@ValenceFigures/fig-0-2-media-1.svg';
import media2 from '@ValenceFigures/fig-0-2-media-2.svg';
import media3 from '@ValenceFigures/fig-0-2-media-3.svg';
import media01Guides from '@ValenceFigures/fig-0-2-media-0-1-guides.svg';
import media01Reach from '@ValenceFigures/fig-0-2-media-0-1-reach.svg';
import media12Guides from '@ValenceFigures/fig-0-2-media-1-2-guides.svg';
import media12Reach from '@ValenceFigures/fig-0-2-media-1-2-reach.svg';
import media23Guides from '@ValenceFigures/fig-0-2-media-2-3-guides.svg';
import media23Reach from '@ValenceFigures/fig-0-2-media-2-3-reach.svg';
import share1Shape from '@ValenceFigures/fig-0-3-share-1-shape.svg';
import share0 from '@ValenceFigures/fig-0-3-share-0.svg';
import share1 from '@ValenceFigures/fig-0-3-share-1.svg';
import share01Guides from '@ValenceFigures/fig-0-3-share-0-1-guides.svg';
import share01Reach from '@ValenceFigures/fig-0-3-share-0-1-reach.svg';
import type { FigureDrawing, FigureName } from './Figure.types';

const FIGURE_LAYERS: Readonly<Record<FigureName, FigureDrawing>> = {
  linkedServers: {
    width: 560,
    height: 418,
    shape: 'aspect-[560/418]',
    layers: [
      { drift: [0, 0] },
      { drift: [0, -23.26], silhouette: linkedServers1Shape },
      { drift: [0, -53.49], silhouette: linkedServers2Shape },
    ],
    pieces: [
      {
        lines: linkedServers0,
        moves: 0,
        under: [1, 2],
      },
      {
        lines: linkedServers1,
        moves: 1,
        under: [2],
      },
      {
        lines: linkedServers2,
        moves: 2,
        under: [],
      },
      {
        lines: linkedServers01Guides,
        moves: 0,
        reach: { file: linkedServers01Reach, of: 1 },
        under: [2],
      },
      {
        lines: linkedServers12Guides,
        moves: 1,
        reach: { file: linkedServers12Reach, of: 2 },
        under: [],
      },
      {
        lines: linkedServers02Guides,
        moves: 0,
        reach: { file: linkedServers02Reach, of: 2 },
        under: [1],
      },
    ],
  },
  yours: {
    width: 400,
    height: 380,
    shape: 'aspect-[400/380]',
    layers: [{ drift: [0, 0] }, { drift: [0, -35.27], silhouette: yours1Shape }],
    pieces: [
      {
        lines: yours0,
        moves: 0,
        under: [1],
      },
      {
        lines: yours1,
        moves: 1,
        under: [],
      },
      {
        lines: yours01Guides,
        moves: 0,
        reach: { file: yours01Reach, of: 1 },
        under: [],
      },
    ],
  },
  media: {
    width: 400,
    height: 380,
    shape: 'aspect-[400/380]',
    layers: [
      { drift: [0, 0] },
      { drift: [0, -16.66], silhouette: media1Shape },
      { drift: [0, -33.31], silhouette: media2Shape },
      { drift: [0, -57.47], silhouette: media3Shape },
    ],
    pieces: [
      {
        lines: media0,
        moves: 0,
        under: [1, 2, 3],
      },
      {
        lines: media1,
        moves: 1,
        under: [2, 3],
      },
      {
        lines: media2,
        moves: 2,
        under: [3],
      },
      {
        lines: media3,
        moves: 3,
        under: [],
      },
      {
        lines: media01Guides,
        moves: 0,
        reach: { file: media01Reach, of: 1 },
        under: [2, 3],
      },
      {
        lines: media12Guides,
        moves: 1,
        reach: { file: media12Reach, of: 2 },
        under: [3],
      },
      {
        lines: media23Guides,
        moves: 2,
        reach: { file: media23Reach, of: 3 },
        under: [],
      },
    ],
  },
  share: {
    width: 400,
    height: 380,
    shape: 'aspect-[400/380]',
    layers: [{ drift: [0, 0] }, { drift: [0, -35.27], silhouette: share1Shape }],
    pieces: [
      {
        lines: share0,
        moves: 0,
        under: [1],
      },
      {
        lines: share1,
        moves: 1,
        under: [],
      },
      {
        lines: share01Guides,
        moves: 0,
        reach: { file: share01Reach, of: 1 },
        under: [],
      },
    ],
  },
};

export { FIGURE_LAYERS };
