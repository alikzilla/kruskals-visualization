import { edgeId, nodeLabel } from './graph';

// Compact, URL-safe encoding of a whole graph:
//   #g=<id.x.y_id.x.y…>~<from.to.weight_…>
export function encodeGraph(graph) {
  const nodes = graph.nodes.map((n) => `${n.id}.${Math.round(n.x)}.${Math.round(n.y)}`).join('_');
  const edges = graph.edges.map((e) => `${e.from}.${e.to}.${e.weight}`).join('_');
  return `g=${nodes}~${edges}`;
}

export function decodeGraph(hash) {
  const match = /(?:^|[#&])g=([\d._]*)~([\d._]*)/.exec(hash);
  if (!match) return null;
  try {
    const nodes = match[1]
      ? match[1].split('_').map((part) => {
          const [id, x, y] = part.split('.').map(Number);
          if (![id, x, y].every(Number.isFinite)) throw new Error('bad node');
          return { id, label: nodeLabel(id), x, y };
        })
      : [];
    const ids = new Set(nodes.map((n) => n.id));
    const seen = new Set();
    const edges = [];
    if (match[2]) {
      match[2].split('_').forEach((part) => {
        const [a, b, weight] = part.split('.').map(Number);
        const id = edgeId(a, b);
        if (a === b || !ids.has(a) || !ids.has(b) || !(weight > 0) || seen.has(id)) return;
        seen.add(id);
        edges.push({ id, from: Math.min(a, b), to: Math.max(a, b), weight });
      });
    }
    return { nodes, edges };
  } catch {
    return null;
  }
}
