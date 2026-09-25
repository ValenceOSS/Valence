import { createContext } from 'react';
import { makeTheMarksWay } from '@ValenceMobile/components/ACarriedMark/makeTheMarksWay';
import type { TheMarksWay } from './THE_MARKS_PLACE.types';

const THE_MARKS_PLACE = createContext<TheMarksWay>(makeTheMarksWay());

export { THE_MARKS_PLACE };
