import { useEffect, useMemo, useRef } from 'react';
import { PSEUDOCODE } from '../../lib/kruskal';
import { EDGE_STATUS, setFill } from '../../lib/theme';
import styles from './sidebar.module.css';

/** The story is one number — total tree weight leads, progress supports it. */
function Stats({ graph, step, needed, components }) {
  const done = step.kind === 'done';
  return (
    <section className={styles.card} aria-label="Progress">
      <div className={styles.hero}>
        <div>
          <span className={styles.heroLabel}>{done ? 'Minimum total weight' : 'Tree weight so far'}</span>
          <strong className={styles.heroValue}>{step.weight}</strong>
        </div>
        {done && <span className={styles.doneBadge}>✓ Complete</span>}
      </div>
      <div
        className={styles.progress}
        role="progressbar"
        aria-label="Tree edges found"
        aria-valuemin={0}
        aria-valuemax={needed}
        aria-valuenow={step.accepted}
      >
        <div style={{ width: `${needed ? (step.accepted / needed) * 100 : 0}%` }} />
      </div>
      <p className={styles.facts}>
        <span>
          <b>{step.accepted}</b> of <b>{needed}</b> tree edges
        </span>
        <span>
          {graph.nodes.length} vertices · {graph.edges.length} edges
        </span>
      </p>
      {components > 1 && (
        <p className={styles.warn}>
          <span aria-hidden="true">⚠</span> Graph is disconnected ({components} parts), so Kruskal builds a spanning{' '}
          <em>forest</em>.
        </p>
      )}
    </section>
  );
}

function Pseudocode({ line }) {
  return (
    <section className={styles.card}>
      <h3>Pseudocode</h3>
      <pre className={styles.code}>
        {PSEUDOCODE.map((text, i) => (
          <div key={i} className={i === line ? styles.codeActive : ''} aria-current={i === line ? 'step' : undefined}>
            <span className={styles.lineNo}>{i + 1}</span>
            {text}
          </div>
        ))}
      </pre>
    </section>
  );
}

function Sets({ graph, step, hover, onHover }) {
  const { merged, singles } = useMemo(() => {
    if (!step.roots) return { merged: [], singles: [] };
    const map = new Map();
    graph.nodes.forEach((n) => {
      const r = step.roots[n.id];
      if (!map.has(r)) map.set(r, []);
      map.get(r).push(n);
    });
    const all = [...map.entries()];
    return {
      merged: all.filter(([, m]) => m.length > 1).sort((a, b) => b[1].length - a[1].length),
      singles: all.filter(([, m]) => m.length === 1).map(([, m]) => m[0]),
    };
  }, [graph.nodes, step.roots]);

  const total = merged.length + singles.length;

  return (
    <section className={styles.card}>
      <h3>
        Union-Find sets <small>{total ? `${total} set${total > 1 ? 's' : ''}` : ''}</small>
      </h3>
      {!step.roots ? (
        <p className={styles.muted}>Each vertex gets its own set right after the edges are sorted.</p>
      ) : (
        <ul className={styles.sets}>
          {merged.map(([root, members]) => (
            <li key={root}>
              <button
                type="button"
                className={`${styles.set} ${hover?.type === 'set' && hover.id === root ? styles.setActive : ''}`}
                onPointerEnter={() => onHover({ type: 'set', id: root })}
                onPointerLeave={() => onHover(null)}
                onFocus={() => onHover({ type: 'set', id: root })}
                onBlur={() => onHover(null)}
                aria-label={`Set of ${members.length}: ${members.map((m) => m.label).join(', ')}`}
              >
                <i className={styles.swatch} style={{ background: setFill(step.setSlot[root]) }} aria-hidden="true" />
                {'{ '}
                {members.map((m) => m.label).join(', ')}
                {' }'}
              </button>
            </li>
          ))}
          {singles.length > 0 && (
            <li className={styles.singles}>
              <i className={`${styles.swatch} ${styles.swatchHollow}`} aria-hidden="true" />
              <span>
                {merged.length ? 'Still alone: ' : 'Alone: '}
                {singles.map((n) => n.label).join(', ')}
              </span>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

function EdgeList({ graph, sorted, step, steps, onSeek, hover, onHover }) {
  const label = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n.label])), [graph.nodes]);
  const firstStep = useMemo(() => {
    const m = {};
    steps.forEach((s, i) => {
      if (s.current && m[s.current] === undefined) m[s.current] = i;
    });
    return m;
  }, [steps]);
  const listRef = useRef(null);
  const currentEdge = step.current;

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-current="true"]');
    if (el) {
      const list = listRef.current;
      const top = el.offsetTop - list.clientHeight / 2 + el.clientHeight / 2;
      list.scrollTo({ top, behavior: 'smooth' });
    }
  }, [currentEdge]);

  const sortedVisible = step.kind !== 'start';
  const rows = sortedVisible ? sorted : graph.edges;

  return (
    <section className={`${styles.card} ${styles.edgeCard}`}>
      <h3>
        Edges <small>{sortedVisible ? 'sorted by weight' : 'in input order'}</small>
      </h3>
      <div className={styles.tableHead} aria-hidden="true">
        <span>Edge</span>
        <span>Weight</span>
        <span>Status</span>
      </div>
      <ol className={styles.edgeList} ref={listRef} aria-label="Edges">
        {rows.map((e) => {
          const s = step.status[e.id] ?? 'pending';
          const target = firstStep[e.id];
          const name = `${label.get(e.from)}–${label.get(e.to)}`;
          return (
            <li key={e.id} data-current={s === 'current'}>
              <button
                type="button"
                className={`${styles.edgeRow} ${styles[s]} ${hover?.type === 'edge' && hover.id === e.id ? styles.rowHover : ''}`}
                onClick={() => target !== undefined && onSeek(target + 1)}
                aria-disabled={target === undefined}
                onPointerEnter={() => onHover({ type: 'edge', id: e.id })}
                onPointerLeave={() => onHover(null)}
                onFocus={() => onHover({ type: 'edge', id: e.id })}
                onBlur={() => onHover(null)}
                title={target !== undefined ? 'Jump to the step where this edge was decided' : 'Not examined'}
                aria-label={`${name}, weight ${e.weight}, ${EDGE_STATUS[s].label}`}
              >
                <span className={styles.edgeName}>{name}</span>
                <span className={styles.edgeWeight}>{e.weight}</span>
                <span className={styles.edgeStatus}>
                  <i aria-hidden="true">{EDGE_STATUS[s].icon}</i>
                  {EDGE_STATUS[s].short}
                </span>
              </button>
            </li>
          );
        })}
        {rows.length === 0 && <li className={styles.muted}>No edges yet.</li>}
      </ol>
    </section>
  );
}

function Sidebar(props) {
  return (
    <aside className={styles.sidebar}>
      <Stats {...props} />
      <Pseudocode line={props.step.line} />
      <Sets {...props} />
      <EdgeList {...props} />
    </aside>
  );
}

export default Sidebar;
