// Disjoint-set forest with path compression and union by rank.
export class UnionFind {
  constructor(ids = []) {
    this.parent = new Map();
    this.rank = new Map();
    ids.forEach((id) => this.makeSet(id));
  }

  makeSet(id) {
    this.parent.set(id, id);
    this.rank.set(id, 0);
  }

  find(id) {
    let root = id;
    while (this.parent.get(root) !== root) root = this.parent.get(root);
    // Path compression
    let cur = id;
    while (cur !== root) {
      const next = this.parent.get(cur);
      this.parent.set(cur, root);
      cur = next;
    }
    return root;
  }

  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false;
    const rankA = this.rank.get(ra);
    const rankB = this.rank.get(rb);
    if (rankA < rankB) {
      this.parent.set(ra, rb);
    } else if (rankA > rankB) {
      this.parent.set(rb, ra);
    } else {
      this.parent.set(rb, ra);
      this.rank.set(ra, rankA + 1);
    }
    return true;
  }

  /** Map of id -> representative for every element. */
  roots() {
    const out = {};
    for (const id of this.parent.keys()) out[id] = this.find(id);
    return out;
  }
}
