import { useEffect, useRef, useState } from 'react';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../../lib/graph';
import { componentColor } from '../../lib/theme';
import styles from './graphCanvas.module.css';

const NODE_R = 20;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * SVG graph renderer + editor.
 * mode: 'move' | 'addNode' | 'addEdge' | 'delete'
 */
function GraphCanvas({ graph, step, mode, onMoveNode, onAddNode, onAddEdge, onDeleteNode, onDeleteEdge, onSetWeight }) {
  const svgRef = useRef(null);
  const drag = useRef(null);
  const [edgeSource, setEdgeSource] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [editing, setEditing] = useState(null); // { id, value }

  useEffect(() => {
    setEdgeSource(null);
    setEditing(null);
  }, [mode]);

  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const status = step?.status ?? {};
  const roots = step?.roots;
  const current = step?.current;
  const setSize = {};
  if (roots) Object.values(roots).forEach((r) => (setSize[r] = (setSize[r] ?? 0) + 1));

  const toSvg = (evt) => {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: clamp(p.x, NODE_R, CANVAS_WIDTH - NODE_R), y: clamp(p.y, NODE_R, CANVAS_HEIGHT - NODE_R) };
  };

  const onNodePointerDown = (evt, node) => {
    evt.stopPropagation();
    if (mode === 'delete') {
      onDeleteNode(node.id);
      return;
    }
    if (mode === 'addEdge') {
      if (edgeSource === null) setEdgeSource(node.id);
      else if (edgeSource === node.id) setEdgeSource(null);
      else {
        onAddEdge(edgeSource, node.id);
        setEdgeSource(null);
      }
      return;
    }
    evt.currentTarget.setPointerCapture?.(evt.pointerId);
    drag.current = { id: node.id };
  };

  const onPointerMove = (evt) => {
    if (drag.current) {
      const p = toSvg(evt);
      onMoveNode(drag.current.id, Math.round(p.x), Math.round(p.y));
    } else if (edgeSource !== null) {
      setCursor(toSvg(evt));
    }
  };

  const endDrag = () => {
    drag.current = null;
  };

  const onBackgroundClick = (evt) => {
    if (evt.target !== svgRef.current && !evt.target.dataset.bg) return;
    if (mode === 'addNode') {
      const p = toSvg(evt);
      onAddNode(Math.round(p.x), Math.round(p.y));
    }
    setEdgeSource(null);
    setEditing(null);
  };

  const commitWeight = () => {
    if (!editing) return;
    const w = parseInt(editing.value, 10);
    if (Number.isFinite(w) && w > 0 && w < 1000) onSetWeight(editing.id, w);
    setEditing(null);
  };

  const editEdge = graph.edges.find((e) => e.id === editing?.id);
  const editPos = editEdge && {
    left: `${(((byId.get(editEdge.from).x + byId.get(editEdge.to).x) / 2) / CANVAS_WIDTH) * 100}%`,
    top: `${(((byId.get(editEdge.from).y + byId.get(editEdge.to).y) / 2) / CANVAS_HEIGHT) * 100}%`,
  };

  return (
    <div className={`${styles.wrap} ${styles[`mode_${mode}`]}`}>
      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClick={onBackgroundClick}
        role="img"
        aria-label="Graph visualization"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" className={styles.gridLine} />
          </pattern>
        </defs>
        <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#grid)" data-bg="1" />

        {edgeSource !== null && cursor && byId.get(edgeSource) && (
          <line
            className={styles.ghostEdge}
            x1={byId.get(edgeSource).x}
            y1={byId.get(edgeSource).y}
            x2={cursor.x}
            y2={cursor.y}
          />
        )}

        {graph.edges.map((e) => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          const s = status[e.id] ?? 'pending';
          return (
            <g
              key={e.id}
              className={`${styles.edge} ${styles[s]}`}
              onPointerDown={(evt) => {
                if (mode === 'delete') {
                  evt.stopPropagation();
                  onDeleteEdge(e.id);
                }
              }}
            >
              <line className={styles.hit} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
              <line className={styles.line} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
            </g>
          );
        })}

        {graph.edges.map((e) => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          const s = status[e.id] ?? 'pending';
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const w = String(e.weight).length * 8 + 14;
          return (
            <g
              key={`w-${e.id}`}
              className={`${styles.weight} ${styles[s]}`}
              transform={`translate(${mx} ${my})`}
              onPointerDown={(evt) => {
                evt.stopPropagation();
                if (mode === 'delete') onDeleteEdge(e.id);
                else setEditing({ id: e.id, value: String(e.weight) });
              }}
            >
              <title>Click to edit weight</title>
              <rect x={-w / 2} y={-11} width={w} height={22} rx={11} />
              <text dy="0.35em">{e.weight}</text>
            </g>
          );
        })}

        {graph.nodes.map((n) => {
          const fill = roots && setSize[roots[n.id]] > 1 ? componentColor(roots[n.id]) : undefined;
          const touched =
            current &&
            graph.edges.some((e) => e.id === current && (e.from === n.id || e.to === n.id));
          return (
            <g
              key={n.id}
              className={`${styles.node} ${touched ? styles.nodeActive : ''} ${edgeSource === n.id ? styles.nodeSource : ''}`}
              transform={`translate(${n.x} ${n.y})`}
              onPointerDown={(evt) => onNodePointerDown(evt, n)}
            >
              <title>
                {roots ? `${n.label} — set of ${graph.nodes.find((m) => m.id === roots[n.id])?.label}` : n.label}
              </title>
              <circle r={NODE_R + 6} className={styles.halo} />
              <circle r={NODE_R} style={fill ? { fill, stroke: fill } : undefined} />
              <text dy="0.35em">{n.label}</text>
            </g>
          );
        })}
      </svg>

      {editEdge && (
        <form
          className={styles.weightEditor}
          style={editPos}
          onSubmit={(evt) => {
            evt.preventDefault();
            commitWeight();
          }}
        >
          <input
            autoFocus
            type="number"
            min="1"
            max="999"
            value={editing.value}
            onChange={(evt) => setEditing({ ...editing, value: evt.target.value })}
            onBlur={commitWeight}
            onKeyDown={(evt) => evt.key === 'Escape' && setEditing(null)}
            aria-label="Edge weight"
          />
        </form>
      )}

      {graph.nodes.length === 0 && (
        <div className={styles.empty}>
          Empty canvas — choose <b>Add vertex</b> and click to place vertices, or generate a random graph.
        </div>
      )}
    </div>
  );
}

export default GraphCanvas;
