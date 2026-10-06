import { useEffect, useRef, useState } from 'react';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../../lib/graph';
import { EDGE_STATUS, setFill } from '../../lib/theme';
import styles from './graphCanvas.module.css';

const NODE_R = 20;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

const pct = (x, y) => ({ left: `${(x / CANVAS_WIDTH) * 100}%`, top: `${(y / CANVAS_HEIGHT) * 100}%` });

/**
 * SVG graph renderer + editor.
 * mode:  'move' | 'addNode' | 'addEdge' | 'delete'
 * hover: { type: 'node' | 'edge' | 'set', id } | null — shared with the sidebar
 */
function GraphCanvas({
  graph,
  step,
  mode,
  hover,
  onHover,
  onMoveNode,
  onAddNode,
  onAddEdge,
  onDeleteNode,
  onDeleteEdge,
  onSetWeight,
}) {
  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const drag = useRef(null);
  // Marks grow as the canvas shrinks so labels stay legible on phones.
  const [k, setK] = useState(1);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width || CANVAS_WIDTH;
      setK(Math.round(clamp((CANVAS_WIDTH / w) * 0.6, 1, 1.7) * 20) / 20);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const r = NODE_R * k;
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
  const setSlot = step?.setSlot ?? {};
  const current = step?.current;
  const currentEdge = graph.edges.find((e) => e.id === current);

  const members = (root) => graph.nodes.filter((n) => roots?.[n.id] === root);

  // ---- hover / focus focus-set: which vertices stay at full strength ----
  let focusNodes = null;
  if (hover && !drag.current) {
    if (hover.type === 'set' && roots) focusNodes = new Set(members(hover.id).map((n) => n.id));
    else if (hover.type === 'node' && byId.has(hover.id))
      focusNodes = new Set(roots ? members(roots[hover.id]).map((n) => n.id) : [hover.id]);
  }
  const hoveredEdge = hover?.type === 'edge' ? graph.edges.find((e) => e.id === hover.id) : null;

  const toSvg = (evt) => {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: clamp(p.x, r, CANVAS_WIDTH - r), y: clamp(p.y, r, CANVAS_HEIGHT - r) };
  };

  const onNodePointerDown = (evt, node) => {
    evt.stopPropagation();
    if (mode === 'delete') {
      onDeleteNode(node.id);
      onHover(null);
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
    onHover(null);
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

  const mid = (e) => {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };

  const editEdge = graph.edges.find((e) => e.id === editing?.id);

  const hoverProps = (target) => ({
    onPointerEnter: () => !drag.current && onHover(target),
    onPointerLeave: () => onHover(null),
    onFocus: () => onHover(target),
    onBlur: () => onHover(null),
  });

  // ---- tooltip content (values lead, labels follow) ----
  let tooltip = null;
  if (hoveredEdge && !editing) {
    const a = byId.get(hoveredEdge.from);
    const b = byId.get(hoveredEdge.to);
    const s = status[hoveredEdge.id] ?? 'pending';
    tooltip = {
      pos: mid(hoveredEdge),
      value: hoveredEdge.weight,
      unit: 'weight',
      title: `Edge ${a.label}–${b.label}`,
      detail: (
        <span className={styles[`tip_${s}`]}>
          <i aria-hidden="true">{EDGE_STATUS[s].icon}</i> {EDGE_STATUS[s].label}
        </span>
      ),
    };
  } else if (hover?.type === 'node' && byId.has(hover.id) && !drag.current) {
    const n = byId.get(hover.id);
    const degree = graph.edges.filter((e) => e.from === n.id || e.to === n.id).length;
    const set = roots ? members(roots[n.id]) : null;
    tooltip = {
      pos: { x: n.x, y: n.y - r },
      value: n.label,
      unit: `${degree} edge${degree === 1 ? '' : 's'}`,
      title: set ? (set.length > 1 ? `Set of ${set.length} vertices` : 'In its own set') : 'Vertex',
      detail: set && set.length > 1 ? `{ ${set.map((m) => m.label).join(', ')} }` : null,
    };
  }

  const nodeLabel = (n) => {
    if (!roots) return `Vertex ${n.label}`;
    const set = members(roots[n.id]);
    return set.length > 1
      ? `Vertex ${n.label}, in set { ${set.map((m) => m.label).join(', ')} }`
      : `Vertex ${n.label}, in its own set`;
  };

  return (
    <div
      ref={wrapRef}
      className={`${styles.wrap} ${styles[`mode_${mode}`]}`}
      style={{ '--k': k }}
    >
      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClick={onBackgroundClick}
        aria-label={`Graph with ${graph.nodes.length} vertices and ${graph.edges.length} edges`}
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
          const dim = focusNodes && !(focusNodes.has(e.from) && focusNodes.has(e.to));
          return (
            <g
              key={e.id}
              className={`${styles.edge} ${styles[s]} ${dim ? styles.dim : ''} ${hoveredEdge?.id === e.id ? styles.hovered : ''}`}
              onPointerDown={(evt) => {
                if (mode === 'delete') {
                  evt.stopPropagation();
                  onDeleteEdge(e.id);
                  onHover(null);
                }
              }}
              {...hoverProps({ type: 'edge', id: e.id })}
            >
              <line className={styles.hit} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
              <line className={styles.ring} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
              <line className={styles.line} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
            </g>
          );
        })}

        {graph.edges.map((e) => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          const s = status[e.id] ?? 'pending';
          const { x, y } = mid(e);
          const w = String(e.weight).length * 8 + 14;
          const dim = focusNodes && !(focusNodes.has(e.from) && focusNodes.has(e.to));
          return (
            <g
              key={`w-${e.id}`}
              className={`${styles.weight} ${styles[s]} ${dim ? styles.dim : ''}`}
              transform={`translate(${x} ${y}) scale(${k})`}
              tabIndex={0}
              role="button"
              aria-label={`Edge ${a.label}–${b.label}, weight ${e.weight}, ${EDGE_STATUS[s].label}. Press Enter to edit the weight.`}
              onPointerDown={(evt) => {
                evt.stopPropagation();
                if (mode === 'delete') {
                  onDeleteEdge(e.id);
                  onHover(null);
                } else setEditing({ id: e.id, value: String(e.weight) });
              }}
              onKeyDown={(evt) => {
                if (evt.key === 'Enter') {
                  evt.preventDefault();
                  evt.stopPropagation();
                  setEditing({ id: e.id, value: String(e.weight) });
                }
              }}
              {...hoverProps({ type: 'edge', id: e.id })}
            >
              <rect className={styles.weightHit} x={-w / 2 - 6} y={-17} width={w + 12} height={34} rx={17} />
              <rect x={-w / 2} y={-11} width={w} height={22} rx={11} />
              <text dy="0.35em">{e.weight}</text>
            </g>
          );
        })}

        {graph.nodes.map((n) => {
          const root = roots?.[n.id];
          const merged = roots && Object.prototype.hasOwnProperty.call(setSlot, root);
          const touched = currentEdge && (currentEdge.from === n.id || currentEdge.to === n.id);
          const dim = focusNodes && !focusNodes.has(n.id);
          return (
            <g
              key={n.id}
              className={[
                styles.node,
                merged ? styles.merged : styles.single,
                touched ? styles.nodeActive : '',
                edgeSource === n.id ? styles.nodeSource : '',
                dim ? styles.dim : '',
              ].join(' ')}
              transform={`translate(${n.x} ${n.y})`}
              tabIndex={0}
              role="img"
              aria-label={nodeLabel(n)}
              onPointerDown={(evt) => onNodePointerDown(evt, n)}
              {...hoverProps({ type: 'node', id: n.id })}
            >
              <circle r={r + 8} className={styles.nodeHit} />
              <circle r={r + 6} className={styles.halo} />
              <circle r={r} className={styles.body} style={merged ? { fill: setFill(setSlot[root]) } : undefined} />
              <text dy="0.35em" style={{ fontSize: 14 * k }}>
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>

      {tooltip && (
        <div className={styles.tooltip} style={pct(tooltip.pos.x, tooltip.pos.y)} role="tooltip">
          <div className={styles.tipValue}>
            <strong>{tooltip.value}</strong> <span>{tooltip.unit}</span>
          </div>
          <div className={styles.tipTitle}>{tooltip.title}</div>
          {tooltip.detail && <div className={styles.tipDetail}>{tooltip.detail}</div>}
        </div>
      )}

      {editEdge && (
        <form
          className={styles.weightEditor}
          style={pct(mid(editEdge).x, mid(editEdge).y)}
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
          <p>
            <strong>Empty canvas</strong>
          </p>
          <p>
            Choose <b>Add vertex</b> and click to place vertices, then <b>Add edge</b> to connect them — or press{' '}
            <b>New graph</b>.
          </p>
        </div>
      )}
    </div>
  );
}

export default GraphCanvas;
