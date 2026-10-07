import { describe, expect, it } from 'vitest';
import { tvMakerOf } from '@ValenceCore/functions/tvMakerOf';

describe('tvMakerOf', () => {
  it('reads the maker VIDAA names first, in the usual case', () => {
    expect(
      tvMakerOf('Chrome/111.0.5563.146 Odin/111 VIDAA/9.0(Hisense;SmartTV;65A60LXVT;MTK9603;)'),
    ).toBe('Hisense');
    expect(tvMakerOf('Chrome/84.0.4147.140 OPR/46 VIDAA/6.0(TOSHIBA;SmartTV;43C350KE;)')).toBe(
      'Toshiba',
    );
  });

  it('reads the maker Titan OS names beside the model', () => {
    expect(
      tvMakerOf('Chrome/122.0 OMI/4.24, TV_2025_4K /0.1 (Philips, 55PUS8500, wired) TitanOS/3.0'),
    ).toBe('Philips');
  });

  it('reads the vendor the HbbTV of a European set names, leaving a short name as it is', () => {
    expect(
      tvMakerOf('Chrome/92.0 OMI/4.22 HbbTV/1.6.1 (+DRM; JVC; MB190; 1.48; ) SmartTvA/3'),
    ).toBe('JVC');
  });

  it('says nothing where the browser names no maker', () => {
    expect(tvMakerOf('Mozilla/5.0 (Linux; SmartTV) Chrome/96.0.4664.45')).toBeNull();
  });
});
