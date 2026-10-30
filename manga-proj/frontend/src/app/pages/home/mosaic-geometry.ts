/**
 * Geometry for the "shattered glass" genre mosaic.
 *
 * A layout is a stack of rows separated by tilted lines; each row is cut into pieces by slanted
 * lines. Every piece is a quad whose edges are shared with its neighbours, so after shrinking
 * each piece inward by half the gap, all separators have exactly the same width, even diagonally.
 * Coordinates are in design units and converted to percentages, so the mosaic scales fluidly.
 */

export interface MosaicLayout {
  width: number;
  height: number;
  /** Gap between pieces, in design units. */
  gap: number;
  /** Corner radius of each piece, in design units. */
  radius: number;
  /** Row boundaries from top to bottom as [y at left edge, y at right edge]. */
  lines: [number, number][];
  /** For each row, its cut lines from left to right as [x on the row's top line, x on its bottom line]. */
  cuts: [number, number][][];
}

export interface Piece {
  /** SVG path for clipPathUnits="objectBoundingBox" (0..1 of the mosaic box), with rounded corners. */
  path: string;
  /** Bounding box of the piece in % of the mosaic box (for positioning the artwork). */
  box: { left: number; top: number; width: number; height: number };
  /** Bottom-left anchor for the caption, inside the piece, in %. */
  label: { left: number; bottom: number; maxWidth: number };
}

type Point = { x: number; y: number };

export function buildMosaic(layout: MosaicLayout): Piece[] {
  const { width: W, height: H, lines, cuts } = layout;
  const yOn = (line: [number, number], x: number) => line[0] + ((line[1] - line[0]) * x) / W;
  const pieces: Piece[] = [];

  cuts.forEach((rowCuts, r) => {
    const top = lines[r];
    const bottom = lines[r + 1];
    const bounds: [number, number][] = [[0, 0], ...rowCuts, [W, W]];
    for (let k = 0; k < bounds.length - 1; k++) {
      const [lt, lb] = bounds[k];
      const [rt, rb] = bounds[k + 1];
      // Clockwise in screen coordinates: TL, TR, BR, BL.
      const quad: Point[] = [
        { x: lt, y: yOn(top, lt) },
        { x: rt, y: yOn(top, rt) },
        { x: rb, y: yOn(bottom, rb) },
        { x: lb, y: yOn(bottom, lb) },
      ];
      pieces.push(toPiece(inset(quad, layout), layout));
    }
  });
  return pieces;
}

/** Moves every inner edge inward by gap/2; edges lying on the mosaic border stay put. */
function inset(poly: Point[], { width: W, height: H, gap }: MosaicLayout): Point[] {
  const onBorder = (a: Point, b: Point) =>
    (a.x === 0 && b.x === 0) || (a.x === W && b.x === W) || (a.y === 0 && b.y === 0) || (a.y === H && b.y === H);

  const edges = poly.map((a, i) => {
    const b = poly[(i + 1) % poly.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const offset = onBorder(a, b) ? 0 : gap / 2;
    // Inward normal for a clockwise polygon in y-down coordinates.
    const nx = -dy / len;
    const ny = dx / len;
    return { p: { x: a.x + nx * offset, y: a.y + ny * offset }, d: { x: dx, y: dy } };
  });

  return edges.map((edge, i) => intersect(edges[(i - 1 + edges.length) % edges.length], edge));
}

function intersect(e1: { p: Point; d: Point }, e2: { p: Point; d: Point }): Point {
  const cross = e1.d.x * e2.d.y - e1.d.y * e2.d.x;
  const t = ((e2.p.x - e1.p.x) * e2.d.y - (e2.p.y - e1.p.y) * e2.d.x) / cross;
  return { x: e1.p.x + e1.d.x * t, y: e1.p.y + e1.d.y * t };
}

function toPiece(quad: Point[], { width: W, height: H, radius }: MosaicLayout): Piece {
  const px = (x: number) => (x / W) * 100;
  const py = (y: number) => (y / H) * 100;
  const xs = quad.map((p) => p.x);
  const ys = quad.map((p) => p.y);
  const [tl, tr, br, bl] = quad;
  const pad = 18;
  const labelX = Math.max(tl.x, bl.x) + pad;
  const labelY = Math.min(bl.y, br.y) - pad;
  const rightLimit = Math.min(tr.x, br.x) - pad;
  return {
    path: roundedPath(quad, radius, W, H),
    box: {
      left: px(Math.min(...xs)),
      top: py(Math.min(...ys)),
      width: px(Math.max(...xs) - Math.min(...xs)),
      height: py(Math.max(...ys) - Math.min(...ys)),
    },
    label: { left: px(labelX), bottom: 100 - py(labelY), maxWidth: px(rightLimit - labelX) },
  };
}

/**
 * Closed path through the quad with each corner replaced by a quadratic curve that starts and ends
 * `radius` away from the vertex along its two edges. Output is normalised to 0..1 so the clip path
 * scales with the element (clipPathUnits="objectBoundingBox").
 */
function roundedPath(quad: Point[], radius: number, W: number, H: number): string {
  const n = (p: Point) => `${round4(p.x / W)} ${round4(p.y / H)}`;
  const toward = (from: Point, to: Point, dist: number): Point => {
    const len = Math.hypot(to.x - from.x, to.y - from.y);
    const t = Math.min(dist, len / 2) / len;
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
  };
  let d = '';
  quad.forEach((v, i) => {
    const prev = quad[(i - 1 + quad.length) % quad.length];
    const next = quad[(i + 1) % quad.length];
    const start = toward(v, prev, radius);
    const end = toward(v, next, radius);
    d += `${i === 0 ? 'M' : 'L'}${n(start)} Q${n(v)} ${n(end)} `;
  });
  return d + 'Z';
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}


/** Desktop: four interlocking rows (3 + 4 + 4 + 4 pieces) with alternating diagonal cuts. */
export const DESKTOP_LAYOUT: MosaicLayout = {
  width: 1200,
  height: 1120,
  gap: 14,
  radius: 16,
  lines: [
    [0, 0],
    [300, 262],
    [560, 600],
    [860, 822],
    [1120, 1120],
  ],
  cuts: [
    [
      [540, 486],
      [830, 878],
    ],
    [
      [290, 330],
      [600, 560],
      [890, 935],
    ],
    [
      [320, 280],
      [610, 655],
      [905, 870],
    ],
    [
      [280, 318],
      [600, 560],
      [880, 925],
    ],
  ],
};

/** Mobile: two columns, cuts and row lines alternating direction; the last piece spans the full width. */
export const MOBILE_LAYOUT: MosaicLayout = {
  width: 400,
  height: 1760,
  gap: 9,
  radius: 12,
  lines: [
    [0, 0],
    [232, 206],
    [440, 468],
    [668, 640],
    [880, 906],
    [1110, 1084],
    [1320, 1346],
    [1550, 1524],
    [1760, 1760],
  ],
  cuts: [[[232, 192]], [[168, 214]], [[226, 184]], [[176, 222]], [[220, 182]], [[186, 226]], [[224, 186]], []],
};
