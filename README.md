# Kruskal's Algorithm Visualizer

An interactive, step-by-step visualization of **Kruskal's minimum spanning tree algorithm**, built at SDU University.

**Live demo:** https://alikzilla.github.io/kruskals_visualization

## Features

- **Step-by-step playback** — play/pause, step forward/back, scrub the timeline, 4 speeds.
- **See the algorithm think** — every step explains what happens: which edge is examined, what `FIND` returns, and why the edge is accepted or rejected.
- **Highlighted pseudocode** that follows the current step.
- **Union-Find view** — vertices are coloured by their disjoint set, so you can watch the forest merge into one tree.
- **Sorted edge list** with live status; click an edge to jump to the moment it was decided.
- **Random graph generator** — always connected and drawn without crossing edges; tune vertex count, density and max weight.
- **Graph editor** — drag vertices, click weights to edit them, add/delete vertices and edges, or start from a blank canvas.
- **Disconnected graphs** produce a minimum spanning *forest*.
- **Share links** encode the exact graph in the URL.
- Light/dark theme, keyboard shortcuts, responsive layout.

### Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` | Play / pause |
| `←` / `→` | Previous / next step |
| `Home` / `End` | First / last step |
| `N` | New random graph |

## Development

```bash
npm install
npm run dev      # start dev server
npm test         # algorithm unit tests (Vitest)
npm run lint
npm run build    # production build in dist/
npm run deploy   # publish dist/ to GitHub Pages
```

## Project structure

```
src/
  lib/
    kruskal.js      Kruskal's algorithm + step recorder used for playback
    unionFind.js    Disjoint-set (path compression + union by rank)
    graph.js        Seeded random connected planar-ish graph generator
    share.js        URL encoding of graphs
  hooks/usePlayer.js  Playback state machine
  components/       GraphCanvas (SVG renderer/editor), Toolbar, Playback, Sidebar, About, …
```

The algorithm runs once per graph and records an immutable snapshot after every action, so the UI can move freely back and forth through the execution.

## Complexity

`O(E log E)` time for sorting plus near-linear `O(E · α(V))` Union-Find operations; `O(V + E)` space.
