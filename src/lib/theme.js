/**
 * Colour roles for the visualization.
 *
 * Union-find sets are an identity (categorical) job: three slots in a fixed
 * order, validated all-pairs for colour-vision deficiency in both themes
 * (blue, orange, aqua — values live in App.css as --set-1..3). A 4th+
 * concurrent set falls back to a neutral fill instead of reusing a hue; the
 * accepted tree edges joining its vertices, the labelled set chips and the
 * hover highlight carry identity so colour is never the only cue.
 *
 * Edge states are a status job (good / warning / critical tokens). Their
 * colours are not CVD-separable on their own, so each state also differs in
 * stroke width and dash pattern, and is labelled with an icon in text.
 */
export function setFill(slot) {
  return slot === null || slot === undefined ? 'var(--set-other)' : `var(--set-${slot + 1})`;
}

export const EDGE_STATUS = {
  pending: { label: 'Unexamined', short: '—', icon: '○' },
  current: { label: 'Examining', short: 'checking', icon: '●' },
  accepted: { label: 'In the tree', short: 'added', icon: '✓' },
  rejected: { label: 'Rejected — would form a cycle', short: 'cycle', icon: '✕' },
  skipped: { label: 'Not needed — tree already complete', short: 'skipped', icon: '·' },
};

export const SPEEDS = [
  { label: '0.5×', delay: 1600 },
  { label: '1×', delay: 900 },
  { label: '2×', delay: 450 },
  { label: '4×', delay: 200 },
];
