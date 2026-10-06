// Deliberately avoids the amber / green / red used for edge states.
const COMPONENT_COLORS = [
  '#6366f1', '#ec4899', '#0891b2', '#8b5cf6', '#2563eb', '#c026d3',
  '#0d9488', '#7c3aed', '#db2777', '#0284c7', '#9333ea', '#4f46e5',
];

/** Colour for a union-find set, keyed by its representative vertex id. */
export function componentColor(root) {
  return COMPONENT_COLORS[root % COMPONENT_COLORS.length];
}

export const SPEEDS = [
  { label: '0.5×', delay: 1600 },
  { label: '1×', delay: 900 },
  { label: '2×', delay: 450 },
  { label: '4×', delay: 200 },
];
