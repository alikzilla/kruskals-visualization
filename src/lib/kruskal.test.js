import { describe, expect, it } from 'vitest';
import { generateGraph, countComponents, segmentsCross, edgeId, distToSegment } from './graph';
import { kruskal, kruskalSteps } from './kruskal';
import { UnionFind } from './unionFind';

const g = (n, list) => ({
  nodes: Array.from({ length: n }, (_, i) => ({ id: i, label: String.fromCharCode(65 + i), x: 0, y: 0 })),
  edges: list.map(([from, to, weight]) => ({ id: edgeId(from, to), from, to, weight })),
});

// Brute force: try every subset of n-1 edges and keep the lightest spanning tree.
function bruteForceMstWeight(graph) {
  const n = graph.nodes.length;
  const m = graph.edges.length;
  let best = Infinity;
  for (let mask = 0; mask < 1 << m; mask++) {
    let bits = 0;
    for (let k = mask; k; k &= k - 1) bits++;
    if (bits !== n - 1) continue;
    const uf = new UnionFind(graph.nodes.map((v) => v.id));
    let w = 0;
    let ok = true;
    graph.edges.forEach((e, i) => {
      if (!(mask & (1 << i))) return;
      if (!uf.union(e.from, e.to)) ok = false;
      w += e.weight;
    });
    if (ok) best = Math.min(best, w);
  }
  return best;
}

describe('UnionFind', () => {
  it('merges and finds sets', () => {
    const uf = new UnionFind([1, 2, 3, 4]);
    expect(uf.union(1, 2)).toBe(true);
    expect(uf.union(3, 4)).toBe(true);
    expect(uf.find(1)).toBe(uf.find(2));
    expect(uf.find(1)).not.toBe(uf.find(3));
    expect(uf.union(2, 1)).toBe(false);
    uf.union(2, 4);
    expect(new Set(Object.values(uf.roots())).size).toBe(1);
  });
});

describe('generateGraph', () => {
  it('is deterministic for a seed', () => {
    expect(generateGraph({ seed: 42 })).toEqual(generateGraph({ seed: 42 }));
  });

  it('always produces a connected graph without duplicate edges or crossings', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const nodeCount = 3 + (seed % 16);
      const graph = generateGraph({ seed, nodeCount, density: (seed % 5) / 4 });
      expect(graph.nodes).toHaveLength(nodeCount);
      expect(countComponents(graph)).toBe(1);
      expect(new Set(graph.edges.map((e) => e.id)).size).toBe(graph.edges.length);
      graph.edges.forEach((e) => {
        expect(e.from).not.toBe(e.to);
        expect(e.weight).toBeGreaterThanOrEqual(1);
      });
    }
  });

  it('never draws an edge through another vertex', () => {
    let bad = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const graph = generateGraph({ seed, nodeCount: 4 + (seed % 17), density: (seed % 5) / 4 });
      graph.edges.forEach((e) => {
        const a = graph.nodes[e.from];
        const b = graph.nodes[e.to];
        graph.nodes.forEach((n) => {
          if (n !== a && n !== b && distToSegment(n, a, b) < 24) bad++;
        });
      });
    }
    expect(bad).toBe(0);
  });

  it('adds no crossing extra edges', () => {
    const graph = generateGraph({ seed: 7, nodeCount: 10, density: 1 });
    const p = (id) => graph.nodes[id];
    graph.edges.forEach((a) =>
      graph.edges.forEach((b) => {
        if (a !== b) expect(segmentsCross(p(a.from), p(a.to), p(b.from), p(b.to))).toBe(false);
      }),
    );
  });
});

describe('kruskal', () => {
  it('finds the textbook MST', () => {
    const graph = g(5, [
      [0, 1, 1], [0, 2, 7], [1, 2, 5], [1, 3, 4], [1, 4, 3], [2, 4, 6], [3, 4, 2],
    ]);
    const mst = kruskal(graph);
    expect(mst.map((e) => e.id).sort()).toEqual(['0-1', '1-2', '1-4', '3-4'].sort());
    expect(mst.reduce((s, e) => s + e.weight, 0)).toBe(11);
  });

  it('matches brute force on random graphs', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const graph = generateGraph({ seed, nodeCount: 6, density: 0.5, maxWeight: 9 });
      if (graph.edges.length > 16) continue;
      const w = kruskal(graph).reduce((s, e) => s + e.weight, 0);
      expect(w).toBe(bruteForceMstWeight(graph));
    }
  });

  it('builds a spanning forest for disconnected graphs', () => {
    const graph = g(5, [[0, 1, 3], [1, 2, 1], [0, 2, 2], [3, 4, 9]]);
    const { steps, components, needed } = kruskalSteps(graph);
    expect(components).toBe(2);
    expect(needed).toBe(3);
    const last = steps[steps.length - 1];
    expect(last.kind).toBe('done');
    expect(last.weight).toBe(12);
    expect(last.message).toMatch(/forest/);
  });
});

describe('kruskalSteps', () => {
  it('records consistent snapshots', () => {
    const graph = generateGraph({ seed: 3, nodeCount: 9 });
    const { steps } = kruskalSteps(graph);
    const final = steps[steps.length - 1];
    const expected = kruskal(graph);
    expect(final.accepted).toBe(graph.nodes.length - 1);
    expect(final.weight).toBe(expected.reduce((s, e) => s + e.weight, 0));
    const acceptedIds = Object.entries(final.status).filter(([, s]) => s === 'accepted').map(([id]) => id);
    expect(acceptedIds.sort()).toEqual(expected.map((e) => e.id).sort());
    expect(new Set(Object.values(final.roots)).size).toBe(1);
    expect(Object.values(final.status)).not.toContain('current');
    expect(Object.values(final.status)).not.toContain('pending');
    // Snapshots must be independent copies.
    expect(steps[0].status).not.toBe(final.status);
    expect(Object.values(steps[0].status).every((s) => s === 'pending')).toBe(true);
  });

  it('keeps set colours stable and never shows a slot twice', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const graph = generateGraph({ seed, nodeCount: 6 + (seed % 14) });
      const { steps } = kruskalSteps(graph);
      let prev = null;
      steps.forEach((step) => {
        if (!step.roots) return;
        const slots = Object.values(step.setSlot).filter((s) => s !== null);
        expect(new Set(slots).size).toBe(slots.length);
        slots.forEach((s) => expect(s).toBeLessThan(3));
        // A set whose membership didn't change keeps its colour; a merged set
        // takes the colour of its larger side when that side had one.
        if (prev) {
          const members = (st, r) => graph.nodes.filter((n) => st.roots[n.id] === r).map((n) => n.id).join();
          graph.nodes.forEach((n) => {
            const before = prev.setSlot[prev.roots[n.id]];
            const after = step.setSlot[step.roots[n.id]];
            const same = members(prev, prev.roots[n.id]) === members(step, step.roots[n.id]);
            if (same && before !== undefined) expect(after).toBe(before);
          });
          if (step.kind === 'accept') {
            const e = graph.edges.find((x) => x.id === step.current);
            const sizeOf = (id) => graph.nodes.filter((n) => prev.roots[n.id] === prev.roots[id]).length;
            const big = sizeOf(e.from) >= sizeOf(e.to) ? e.from : e.to;
            const bigSlot = prev.setSlot[prev.roots[big]];
            if (bigSlot != null) expect(step.setSlot[step.roots[big]]).toBe(bigSlot);
          }
        }
        prev = step;
      });
    }
  });

  it('a merged set inherits the colour of the larger side', () => {
    const graph = g(5, [[0, 1, 1], [1, 2, 2], [3, 4, 3], [2, 3, 4]]);
    const { steps } = kruskalSteps(graph);
    const accepts = steps.filter((s) => s.kind === 'accept');
    const slotOf = (s, id) => s.setSlot[s.roots[id]];
    expect(slotOf(accepts[0], 0)).toBe(0); // {A,B} gets slot 0
    expect(slotOf(accepts[2], 3)).toBe(1); // {D,E} gets slot 1
    expect(slotOf(accepts[3], 3)).toBe(0); // merged into the larger {A,B,C}, keeps slot 0
  });

  it('handles an empty graph', () => {
    const { steps } = kruskalSteps({ nodes: [], edges: [] });
    expect(steps).toHaveLength(1);
  });
});
