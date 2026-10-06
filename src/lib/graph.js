import { mulberry32, randInt } from './random';
import { UnionFind } from './unionFind';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 520;
const MARGIN = 45;

export function nodeLabel(index) {
  // A..Z, then A1, B1, ...
  const letter = String.fromCharCode(65 + (index % 26));
  const round = Math.floor(index / 26);
  return round === 0 ? letter : `${letter}${round}`;
}

export function edgeId(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function orientation(p, q, r) {
  const v = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (Math.abs(v) < 1e-9) return 0;
  return v > 0 ? 1 : 2;
}

/** True when segments p1-p2 and q1-q2 properly cross (shared endpoints don't count). */
export function segmentsCross(p1, p2, q1, q2) {
  if (p1 === q1 || p1 === q2 || p2 === q1 || p2 === q2) return false;
  const o1 = orientation(p1, p2, q1);
  const o2 = orientation(p1, p2, q2);
  const o3 = orientation(q1, q2, p1);
  const o4 = orientation(q1, q2, p2);
  return o1 !== o2 && o3 !== o4;
}

export function distToSegment(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return dist(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function placeNodes(count, rand, width, height) {
  const nodes = [];
  let minDist = (Math.min(width, height) / Math.sqrt(count)) * 0.9;
  let attempts = 0;
  while (nodes.length < count) {
    const candidate = {
      x: MARGIN + rand() * (width - 2 * MARGIN),
      y: MARGIN + rand() * (height - 2 * MARGIN),
    };
    if (nodes.every((n) => dist(n, candidate) >= minDist)) {
      const i = nodes.length;
      nodes.push({ id: i, label: nodeLabel(i), x: Math.round(candidate.x), y: Math.round(candidate.y) });
      attempts = 0;
    } else if (++attempts > 300) {
      // Space is getting crowded – relax the spacing requirement.
      minDist *= 0.9;
      attempts = 0;
    }
  }
  return nodes;
}

/**
 * Generate a random connected, mostly planar weighted graph.
 * @param {object} opts
 * @param {number} opts.nodeCount number of vertices
 * @param {number} opts.density 0..1 – how many extra (non-tree) edges to add
 * @param {number} opts.maxWeight weights are integers in [1, maxWeight]
 * @param {number} opts.seed PRNG seed
 */
export function generateGraph({
  nodeCount = 8,
  density = 0.4,
  maxWeight = 20,
  seed = 1,
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT,
} = {}) {
  const rand = mulberry32(seed);
  const nodes = placeNodes(nodeCount, rand, width, height);
  const edges = [];
  const has = new Set();

  const crossesExisting = (a, b) =>
    edges.some((e) => segmentsCross(a, b, nodes[e.from], nodes[e.to]));
  const passesNearNode = (a, b) =>
    nodes.some((n) => n !== a && n !== b && distToSegment(n, a, b) < 32);
  // Edges leaving the same vertex at nearly the same angle overlap visually.
  const angleAt = (p, q, r) => {
    const a1 = Math.atan2(q.y - p.y, q.x - p.x);
    const a2 = Math.atan2(r.y - p.y, r.x - p.x);
    const d = Math.abs(a1 - a2) % (2 * Math.PI);
    return Math.min(d, 2 * Math.PI - d);
  };
  const tooNarrow = (a, b) =>
    edges.some((e) => {
      const u = nodes[e.from];
      const v = nodes[e.to];
      const MIN = 0.3; // ~17°
      if (u === a && v !== b) return angleAt(a, b, v) < MIN;
      if (v === a && u !== b) return angleAt(a, b, u) < MIN;
      if (u === b && v !== a) return angleAt(b, a, v) < MIN;
      if (v === b && u !== a) return angleAt(b, a, u) < MIN;
      return false;
    });
  const clean = (a, b) => !crossesExisting(a, b) && !passesNearNode(a, b) && !tooNarrow(a, b);

  const addEdge = (a, b) => {
    const id = edgeId(a.id, b.id);
    has.add(id);
    edges.push({ id, from: Math.min(a.id, b.id), to: Math.max(a.id, b.id), weight: randInt(rand, 1, maxWeight) });
  };

  const pairs = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) pairs.push([nodes[i], nodes[j]]);
  }

  // 1. Spanning tree for connectivity: a randomized Kruskal over geometric
  //    distance, preferring edges that keep the drawing readable.
  const uf = new UnionFind(nodes.map((n) => n.id));
  const jittered = pairs
    .map((p) => ({ p, key: dist(p[0], p[1]) * (1 + 0.8 * rand()) }))
    .sort((x, y) => x.key - y.key)
    .map((x) => x.p);
  const passes = [
    (a, b) => clean(a, b),
    (a, b) => !crossesExisting(a, b) && !passesNearNode(a, b),
    // An edge drawn through another vertex is more misleading than a crossing.
    (a, b) => !passesNearNode(a, b),
    () => true,
  ];
  for (const ok of passes) {
    if (edges.length === nodeCount - 1) break;
    for (const [a, b] of jittered) {
      if (uf.find(a.id) !== uf.find(b.id) && ok(a, b)) {
        uf.union(a.id, b.id);
        addEdge(a, b);
      }
    }
  }

  // 2. Extra edges, shortest first, skipping any that would clutter the drawing.
  const maxPlanar = Math.max(nodeCount - 1, 3 * nodeCount - 6);
  const target = nodeCount - 1 + Math.round(density * (maxPlanar - (nodeCount - 1)));
  pairs.sort((p, q) => dist(p[0], p[1]) - dist(q[0], q[1]));
  for (const [a, b] of pairs) {
    if (edges.length >= target) break;
    if (has.has(edgeId(a.id, b.id)) || !clean(a, b)) continue;
    addEdge(a, b);
  }

  return { nodes, edges };
}

/** Number of connected components (isolated vertices count as components). */
export function countComponents(graph) {
  const adj = new Map(graph.nodes.map((n) => [n.id, []]));
  graph.edges.forEach((e) => {
    adj.get(e.from)?.push(e.to);
    adj.get(e.to)?.push(e.from);
  });
  const seen = new Set();
  let count = 0;
  for (const n of graph.nodes) {
    if (seen.has(n.id)) continue;
    count++;
    const stack = [n.id];
    seen.add(n.id);
    while (stack.length) {
      const cur = stack.pop();
      for (const nb of adj.get(cur)) {
        if (!seen.has(nb)) {
          seen.add(nb);
          stack.push(nb);
        }
      }
    }
  }
  return count;
}
