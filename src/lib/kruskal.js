import { UnionFind } from './unionFind';
import { countComponents } from './graph';

export const PSEUDOCODE = [
  'KRUSKAL(G):',
  '  sort E by weight, ascending',
  '  for each v in V: MAKE-SET(v)',
  '  T ← ∅',
  '  for each (u, v) in sorted E:',
  '    if FIND(u) ≠ FIND(v):',
  '      T ← T ∪ {(u, v)}',
  '      UNION(u, v)',
  '    else: skip (forms a cycle)',
  '  return T',
];

/** Sort edges by weight; ties keep a deterministic order by endpoints. */
export function sortEdges(edges) {
  return edges
    .slice()
    .sort((a, b) => a.weight - b.weight || a.from - b.from || a.to - b.to);
}

/** Plain Kruskal – returns the edges of a minimum spanning forest. */
export function kruskal(graph) {
  const uf = new UnionFind(graph.nodes.map((n) => n.id));
  const result = [];
  for (const e of sortEdges(graph.edges)) {
    if (uf.union(e.from, e.to)) result.push(e);
  }
  return result;
}

/** Number of colour slots for union-find sets (validated all-pairs palette). */
export const SET_SLOTS = 3;

/**
 * Run Kruskal's algorithm and record a snapshot after every meaningful
 * action, so the UI can scrub back and forth through the execution.
 *
 * Every step has:
 *   kind     – 'start' | 'sort' | 'makeset' | 'consider' | 'accept' | 'reject' | 'done'
 *   line     – index into PSEUDOCODE to highlight (or -1)
 *   current  – id of the edge being examined (or null)
 *   status   – { [edgeId]: 'pending' | 'current' | 'accepted' | 'rejected' | 'skipped' }
 *   roots    – { [nodeId]: representative } (null before MAKE-SET)
 *   setSlot  – { [representative]: colour slot | null } for sets with 2+ vertices
 *   weight   – total weight of accepted edges so far
 *   accepted – number of accepted edges so far
 *   message  – human-readable explanation
 */
export function kruskalSteps(graph) {
  const label = new Map(graph.nodes.map((n) => [n.id, n.label]));
  const name = (e) => `${label.get(e.from)}–${label.get(e.to)}`;
  const sorted = sortEdges(graph.edges);
  const components = countComponents(graph);
  const needed = graph.nodes.length - components;

  const steps = [];
  const status = Object.fromEntries(graph.edges.map((e) => [e.id, 'pending']));
  let roots = null;
  // Colour follows the set, never its representative id: a set keeps its slot
  // until it is absorbed by a larger set. Sets that find no free slot stay
  // neutral rather than reusing a hue already on screen.
  let setSlot = {};
  const size = new Map(graph.nodes.map((n) => [n.id, 1]));
  let weight = 0;
  let accepted = 0;

  const push = (kind, line, message, current = null) =>
    steps.push({ kind, line, message, current, status: { ...status }, roots, setSlot, weight, accepted });

  push(
    'start',
    0,
    graph.edges.length
      ? `Graph has ${graph.nodes.length} vertices and ${graph.edges.length} edges. Press play or step forward to begin.`
      : 'Add some vertices and edges to run the algorithm.',
  );
  if (!graph.nodes.length) return { steps, sorted, needed, components };

  push('sort', 1, `Sorted all ${sorted.length} edges by weight. Kruskal will examine them cheapest-first.`);

  const uf = new UnionFind(graph.nodes.map((n) => n.id));
  roots = uf.roots();
  push('makeset', 2, `Each vertex starts in its own set — ${graph.nodes.length} separate trees.`);

  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i];
    if (accepted === needed) {
      for (let j = i; j < sorted.length; j++) status[sorted[j].id] = 'skipped';
      push(
        'done',
        9,
        `Tree complete with ${accepted} edges — the remaining ${sorted.length - i} edge(s) never need to be checked.`,
      );
      break;
    }

    status[e.id] = 'current';
    const ru = uf.find(e.from);
    const rv = uf.find(e.to);
    push(
      'consider',
      5,
      `Examine ${name(e)} (weight ${e.weight}): FIND(${label.get(e.from)}) = ${label.get(ru)}, FIND(${label.get(e.to)}) = ${label.get(rv)}.`,
      e.id,
    );

    if (ru !== rv) {
      uf.union(e.from, e.to);
      roots = uf.roots();
      const root = uf.find(e.from);
      const [big, small] = size.get(ru) >= size.get(rv) ? [ru, rv] : [rv, ru];
      const inherited = setSlot[big] ?? setSlot[small] ?? null;
      const next = { ...setSlot };
      delete next[ru];
      delete next[rv];
      const used = new Set(Object.values(next));
      let slot = inherited;
      if (slot === null) {
        for (let k = 0; k < SET_SLOTS; k++) {
          if (!used.has(k)) {
            slot = k;
            break;
          }
        }
      }
      next[root] = slot;
      setSlot = next;
      size.set(root, size.get(ru) + size.get(rv));
      status[e.id] = 'accepted';
      weight += e.weight;
      accepted++;
      push(
        'accept',
        7,
        `Different sets → add ${name(e)} to the tree and UNION them. Total weight is now ${weight}.`,
        e.id,
      );
    } else {
      status[e.id] = 'rejected';
      push('reject', 8, `${label.get(e.from)} and ${label.get(e.to)} are already connected → ${name(e)} would create a cycle. Skip.`, e.id);
    }
  }

  if (steps[steps.length - 1].kind !== 'done') {
    push(
      'done',
      9,
      components > 1
        ? `Graph is disconnected (${components} components), so the result is a minimum spanning forest of weight ${weight}.`
        : `All edges examined. Minimum spanning tree has ${accepted} edges and total weight ${weight}.`,
    );
  }

  return { steps, sorted, needed, components };
}
