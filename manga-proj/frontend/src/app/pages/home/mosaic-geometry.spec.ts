import { GENRE_TILES } from './genres';
import { DESKTOP_LAYOUT, MOBILE_LAYOUT, MosaicLayout, buildMosaic } from './mosaic-geometry';

/** Parses the 0..1 vertex coordinates (every Q control point is a polygon vertex). */
function vertices(path: string): { x: number; y: number }[] {
  return [...path.matchAll(/Q([\d.]+) ([\d.]+)/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));
}

describe.each([
  ['desktop', DESKTOP_LAYOUT],
  ['mobile', MOBILE_LAYOUT],
] as [string, MosaicLayout][])('%s mosaic', (_name, layout) => {
  const pieces = buildMosaic(layout);

  it('has one piece per genre', () => {
    expect(pieces.length).toBe(GENRE_TILES.length);
  });

  it('keeps every piece inside the mosaic', () => {
    for (const piece of pieces) {
      for (const v of vertices(piece.path)) {
        expect(v.x).toBeGreaterThanOrEqual(0);
        expect(v.x).toBeLessThanOrEqual(1);
        expect(v.y).toBeGreaterThanOrEqual(0);
        expect(v.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it('leaves exactly one gap between horizontal neighbours', () => {
    // Along the top border, consecutive pieces in the first row are separated by the gap.
    const firstRow = pieces.slice(0, layout.cuts[0].length + 1).map((p) => vertices(p.path));
    for (let i = 1; i < firstRow.length; i++) {
      const leftTopRight = firstRow[i - 1][1].x * layout.width;
      const rightTopLeft = firstRow[i][0].x * layout.width;
      const [lt] = layout.cuts[0][i - 1];
      expect(leftTopRight).toBeLessThan(lt);
      expect(rightTopLeft).toBeGreaterThan(lt);
    }
  });

  it('gives each caption room inside its piece', () => {
    for (const piece of pieces) {
      expect(piece.label.maxWidth).toBeGreaterThan(10);
      expect(piece.box.width).toBeGreaterThan(0);
      expect(piece.box.height).toBeGreaterThan(0);
    }
  });
});

it('lets the last mobile piece span the full width', () => {
  const last = buildMosaic(MOBILE_LAYOUT).at(-1)!;
  expect(last.box.left).toBe(0);
  expect(Math.round(last.box.width)).toBe(100);
});
