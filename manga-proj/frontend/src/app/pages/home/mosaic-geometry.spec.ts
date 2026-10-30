import { FEATURED_GENRES } from './genres';
import { DESKTOP_LAYOUT, MOBILE_LAYOUT, MosaicLayout, buildMosaic } from './mosaic-geometry';

type Pt = { x: number; y: number };

/** Corner vertices in 0..1 units (each corner's Q control point is the polygon vertex). */
function vertices(path: string): Pt[] {
  return [...path.matchAll(/Q([\d.]+) ([\d.]+)/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));
}

/** Strictly inside a clockwise (y-down) convex polygon. */
function inside(p: Pt, poly: Pt[]): boolean {
  return poly.every((a, i) => {
    const b = poly[(i + 1) % poly.length];
    return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x) > 1e-6;
  });
}

describe.each([
  ['desktop', DESKTOP_LAYOUT],
  ['mobile', MOBILE_LAYOUT],
] as [string, MosaicLayout][])('%s mosaic', (_name, layout) => {
  const pieces = buildMosaic(layout);
  const polys = pieces.map((p) => vertices(p.path));

  it('has one piece per featured genre', () => {
    expect(pieces.length).toBe(FEATURED_GENRES.length);
  });

  it('keeps every piece inside the mosaic and clockwise', () => {
    for (const poly of polys) {
      expect(poly.length).toBe(4);
      for (const v of poly) {
        expect(v.x).toBeGreaterThanOrEqual(0);
        expect(v.x).toBeLessThanOrEqual(1);
        expect(v.y).toBeGreaterThanOrEqual(0);
        expect(v.y).toBeLessThanOrEqual(1);
      }
      const centroid = { x: poly.reduce((s, p) => s + p.x, 0) / 4, y: poly.reduce((s, p) => s + p.y, 0) / 4 };
      expect(inside(centroid, poly)).toBe(true);
    }
  });

  it('never overlaps neighbouring pieces', () => {
    polys.forEach((a, i) =>
      polys.forEach((b, j) => {
        if (i === j) return;
        for (const v of a) expect(inside(v, b)).toBe(false);
      }),
    );
  });

  it('gives each caption room inside its piece', () => {
    for (const piece of pieces) {
      expect(piece.label.maxWidth).toBeGreaterThan(10);
    }
  });
});

it('makes the desktop feature piece full height and the mobile one full width', () => {
  const desktop = buildMosaic(DESKTOP_LAYOUT)[0].box;
  expect(desktop.top).toBe(0);
  expect(Math.round(desktop.height)).toBe(100);

  const mobile = buildMosaic(MOBILE_LAYOUT)[0].box;
  expect(mobile.left).toBe(0);
  expect(Math.round(mobile.width)).toBe(100);
});
