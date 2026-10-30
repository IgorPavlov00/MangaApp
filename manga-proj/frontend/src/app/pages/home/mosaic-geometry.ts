/**
 * Geometry for the "shattered glass" genre mosaic.
 *
 * A layout is a stack of rows separated by tilted lines; each row is cut into pieces by slanted
 * lines. Every piece is a quad whose edges are shared with its neighbours, so after shrinking
 * each piece inward by half the gap, all separators have exactly the same width, even diagonally.
 * Coordinates are in design units and converted to percentages, so the mosaic scales fluidly.
 * With orientation 'columns' the same description is read sideways: `lines` separate columns and
 * `cuts` split each column top-to-bottom, which allows tall pieces spanning the full height.
 */

export interface MosaicLayout {
  width: number;
  height: number;
  /** Gap between pieces, in design units. */
  gap: number;
  /** Corner radius of each piece, in design units. */
  radius: number;
  /** 'rows' (default): lines run left-to-right. 'columns': lines run top-to-bottom. */
  orientation?: 'rows' | 'columns';
  /** Row boundaries from top to bottom as [y at left edge, y at right edge] (columns: [x at top, x at bottom]). */
  lines: [number, number][];
  /** For each row, its cut lines as [x on the row's top line, x on its bottom line] (columns: [y on left line, y on right line]). */
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
  if (layout.orientation !== 'columns') return buildRows(layout);
  // Build in transposed space, then mirror each quad back across the diagonal. Mirroring flips the
  // winding, so reorder the corners to clockwise TL, TR, BR, BL again.
  const transposed = { ...layout, width: layout.height, height: layout.width, orientation: 'rows' as const };
  return buildQuads(transposed).map((quad) => {
    const [tl, tr, br, bl] = quad.map((p) => ({ x: p.y, y: p.x }));
    return toPiece([tl, bl, br, tr], layout);
  });
}

function buildRows(layout: MosaicLayout): Piece[] {
  return buildQuads(layout).map((quad) => toPiece(quad, layout));
}

/** Inset quads (clockwise TL, TR, BR, BL) for a row-oriented layout. */
function buildQuads(layout: MosaicLayout): Point[][] {
  const { width: W, lines, cuts } = layout;
  const yOn = (line: [number, number], x: number) => line[0] + ((line[1] - line[0]) * x) / W;
  const quads: Point[][] = [];

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
      quads.push(inset(quad, layout));
    }
  });
  return quads;
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


/**
 * Desktop bento: a tall feature piece on the left, then three columns of two, with every column
 * divider and every cut slanted.
 */
export const DESKTOP_LAYOUT: MosaicLayout = {
  orientation: 'columns',
  width: 1200,
  height: 660,
  gap: 14,
  radius: 18,
  lines: [
    [0, 0],
    [430, 386],
    [668, 712],
    [944, 908],
    [1200, 1200],
  ],
  cuts: [[], [[344, 300]], [[290, 340]], [[352, 306]]],
};

/** Mobile: the feature piece spans the full width, then three rows of two. */
export const MOBILE_LAYOUT: MosaicLayout = {
  width: 400,
  height: 1000,
  gap: 9,
  radius: 14,
  lines: [
    [0, 0],
    [292, 262],
    [524, 554],
    [776, 746],
    [1000, 1000],
  ],
  cuts: [[], [[232, 192]], [[168, 214]], [[226, 184]]],
};
