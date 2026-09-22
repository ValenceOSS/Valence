import { describe, expect, it } from 'vitest';
import { theSvgFor } from './theSvgFor';

const A_SET = `
export function Play(props) {
    return (_jsx(Icon, { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", ...props, children: _jsx("path", { d: "M6 6L18 12Z" }) }));
}
export function Cross(props) {
    return (_jsxs(Icon, { fill: "none", stroke: "currentColor", ...props, children: [_jsx("path", { d: "M7 7L17 17" }), _jsx("circle", { cx: 12, cy: 12, r: 9 })] }));
}
export function Nothing(props) {
    return (_jsx(Icon, { fill: "none", ...props }));
}
`;

describe('theSvgFor', () => {
  it('answers with a whole document, which is what a renderer takes', () => {
    expect(theSvgFor(A_SET, 'Play')).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(theSvgFor(A_SET, 'Play')).toContain('</svg>');
  });

  it('draws on the same grid the rest of Valence draws on', () => {
    expect(theSvgFor(A_SET, 'Play')).toContain('viewBox="0 0 24 24"');
  });

  it('keeps the drawing', () => {
    expect(theSvgFor(A_SET, 'Play')).toContain('<path d="M6 6L18 12Z"/>');
  });

  it('leaves the colour to whoever draws it', () => {
    expect(theSvgFor(A_SET, 'Play')).toContain('stroke="currentColor"');
  });

  it('says an attribute the way markup says it, not the way React does', () => {
    expect(theSvgFor(A_SET, 'Play')).toContain('stroke-width="2"');
    expect(theSvgFor(A_SET, 'Play')).toContain('stroke-linecap="round"');
  });

  it('keeps every part of an icon drawn from several', () => {
    const cross = theSvgFor(A_SET, 'Cross');

    expect(cross).toContain('<path d="M7 7L17 17"/>');
    expect(cross).toContain('<circle cx="12" cy="12" r="9"/>');
  });

  it('takes nothing from the next icon along', () => {
    expect(theSvgFor(A_SET, 'Play')).not.toContain('M7 7L17 17');
  });

  it('says so where the set has no such icon', () => {
    expect(() => theSvgFor(A_SET, 'Elephant')).toThrow('no Elephant');
  });

  it('says so where an icon draws nothing, rather than writing an empty one', () => {
    expect(() => theSvgFor(A_SET, 'Nothing')).toThrow('draws nothing');
  });
});
