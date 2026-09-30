import type { CurlMatrix } from '@ValenceCore/functions/pageCurl.types';

/**
 * One affine matrix that does what two do one after the other: the inner first, then the outer.
 *
 * @param outer - The matrix applied second.
 * @param inner - The matrix applied first.
 * @returns The matrix doing both.
 */
const composeMatrices = (outer: CurlMatrix, inner: CurlMatrix): CurlMatrix => {
  const [oa, ob, oc, od, oe, of] = outer;
  const [ia, ib, ic, id, ie, iF] = inner;

  return [
    oa * ia + oc * ib,
    ob * ia + od * ib,
    oa * ic + oc * id,
    ob * ic + od * id,
    oa * ie + oc * iF + oe,
    ob * ie + od * iF + of,
  ];
};

export { composeMatrices };
