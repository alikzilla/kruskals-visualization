import { useEffect, useMemo, useRef } from 'react';
import { PSEUDOCODE } from '../../lib/kruskal';
import { componentColor } from '../../lib/theme';
import styles from './sidebar.module.css';

const STATUS_TEXT = {
  pending: '—',
  current: 'checking',
  accepted: 'added',
  rejected: 'cycle',
  skipped: 'skipped',
};

function Stats({ graph, step, needed, components }) {
  const items = [
    { label: 'Vertices', value: graph.nodes.length },
    { label: 'Edges', value: graph.edges.length },
    { label: 'Tree edges', value: `${step.accepted}/${needed}` },
    { label: 'Total weight', value: step.weight, accent: true },
  ];
  return (
    <section className={styles.card}>
      <div className={styles.stats}>
        {items.map((it) => (
          <div key={it.label} className={styles.stat}>
            <span>{it.label}</span>
            <strong className={it.accent ? styles.accent : ''}>{it.value}</strong>
          </div>
        ))}
      </div>
      <div className={styles.progress} aria-hidden="true">
        <div style={{ width: `${needed ? (step.accepted / needed) * 100 : 0}%` }} />
      </div>
      {components > 1 && (
        <p className={styles.warn}>
          Graph is disconnected ({components} parts) — Kruskal will build a spanning <em>forest</em>.
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
          <div key={i} className={i === line ? styles.codeActive : ''}>
            <span className={styles.lineNo}>{i + 1}</span>
            {text}
          </div>
        ))}
      </pre>
    </section>
  );
}

function Sets({ graph, step }) {
  const groups = useMemo(() => {
    if (!step.roots) return [];
    const map = new Map();
    graph.nodes.forEach((n) => {
      const r = step.roots[n.id];
      if (!map.has(r)) map.set(r, []);
      map.get(r).push(n);
    });
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [graph.nodes, step.roots]);

  return (
    <section className={styles.card}>
      <h3>
        Union-Find sets <small>{groups.length ? `${groups.length} set${groups.length > 1 ? 's' : ''}` : ''}</small>
      </h3>
      {groups.length === 0 ? (
        <p className={styles.muted}>Sets are created after the edges are sorted.</p>
      ) : (
        <div className={styles.sets}>
          {groups.map(([root, members]) => (
            <div key={root} className={styles.set} style={{ '--c': members.length > 1 ? componentColor(root) : 'var(--muted)' }}>
              {'{ '}
              {members.map((m) => m.label).join(', ')}
              {' }'}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EdgeList({ graph, sorted, step, steps, onSeek }) {
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
        Edges <small>{sortedVisible ? 'sorted by weight' : 'unsorted'}</small>
      </h3>
      <ol className={styles.edgeList} ref={listRef}>
        {rows.map((e) => {
          const s = step.status[e.id] ?? 'pending';
          const target = firstStep[e.id];
          return (
            <li key={e.id} data-current={s === 'current'}>
              <button
                type="button"
                className={`${styles.edgeRow} ${styles[s]}`}
                onClick={() => target !== undefined && onSeek(target + 1)}
                disabled={target === undefined}
                title={target !== undefined ? 'Jump to this decision' : 'Never examined'}
              >
                <span className={styles.edgeName}>
                  {label.get(e.from)}–{label.get(e.to)}
                </span>
                <span className={styles.edgeWeight}>{e.weight}</span>
                <span className={styles.edgeStatus}>{STATUS_TEXT[s]}</span>
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
