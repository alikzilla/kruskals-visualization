import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { edgeId, generateGraph, nodeLabel } from '../../lib/graph';
import { kruskalSteps } from '../../lib/kruskal';
import { randomSeed } from '../../lib/random';
import { decodeGraph, encodeGraph } from '../../lib/share';
import { usePlayer } from '../../hooks/usePlayer';
import GraphCanvas from '../GraphCanvas/GraphCanvas';
import Toolbar from '../Toolbar/Toolbar';
import Playback from '../Playback/Playback';
import { SPEEDS } from '../../lib/theme';
import Sidebar from '../Sidebar/Sidebar';
import styles from './visualizer.module.css';

const DEFAULT_SETTINGS = { nodeCount: 9, density: 0.35, maxWeight: 20 };

function initialGraph() {
  return decodeGraph(window.location.hash) ?? generateGraph({ ...DEFAULT_SETTINGS, seed: randomSeed() });
}

function Visualizer() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [graph, setGraph] = useState(initialGraph);
  const [mode, setMode] = useState('move');
  const [speed, setSpeed] = useState(1);
  const [shareState, setShareState] = useState(null);

  // Dragging vertices changes positions only, so keep the run alive unless
  // the topology or weights change.
  const nodeKey = graph.nodes.map((n) => n.id).join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useMemo(() => kruskalSteps(graph), [graph.edges, nodeKey]);
  const player = usePlayer(run.steps.length, { delay: SPEEDS[speed].delay, resetKey: run });
  const step = run.steps[Math.min(player.index, run.steps.length - 1)];

  const generate = useCallback(
    (next = settings) => {
      setGraph(generateGraph({ ...next, seed: randomSeed() }));
      if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
    },
    [settings],
  );

  const onSettings = (next) => {
    setSettings(next);
    generate(next);
  };

  // ---- editing ----
  const moveNode = useCallback((id, x, y) => {
    setGraph((g) => ({ ...g, nodes: g.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)) }));
  }, []);

  const addNode = (x, y) => {
    setGraph((g) => {
      const id = g.nodes.reduce((m, n) => Math.max(m, n.id + 1), 0);
      return { ...g, nodes: [...g.nodes, { id, label: nodeLabel(id), x, y }] };
    });
  };

  const addEdge = (a, b) => {
    setGraph((g) => {
      const id = edgeId(a, b);
      if (g.edges.some((e) => e.id === id)) return g;
      const weight = 1 + Math.floor(Math.random() * settings.maxWeight);
      return { ...g, edges: [...g.edges, { id, from: Math.min(a, b), to: Math.max(a, b), weight }] };
    });
  };

  const deleteNode = (id) =>
    setGraph((g) => ({
      nodes: g.nodes.filter((n) => n.id !== id),
      edges: g.edges.filter((e) => e.from !== id && e.to !== id),
    }));

  const deleteEdge = (id) => setGraph((g) => ({ ...g, edges: g.edges.filter((e) => e.id !== id) }));

  const setWeight = (id, weight) =>
    setGraph((g) => ({ ...g, edges: g.edges.map((e) => (e.id === id ? { ...e, weight } : e)) }));

  const clear = () => {
    setGraph({ nodes: [], edges: [] });
    setMode('addNode');
  };

  const shareTimer = useRef();
  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${encodeGraph(graph)}`;
    history.replaceState(null, '', url);
    try {
      await navigator.clipboard.writeText(url);
      setShareState('copied');
    } catch {
      setShareState('failed');
    }
    clearTimeout(shareTimer.current);
    shareTimer.current = setTimeout(() => setShareState(null), 1800);
  };

  // ---- keyboard shortcuts ----
  useEffect(() => {
    const onKey = (evt) => {
      const tag = evt.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || evt.metaKey || evt.ctrlKey || evt.altKey) return;
      if (tag === 'BUTTON' && (evt.key === ' ' || evt.key === 'Enter')) return;
      const actions = {
        ' ': player.toggle,
        ArrowRight: player.next,
        ArrowLeft: player.prev,
        Home: player.toStart,
        End: player.toEnd,
        n: () => generate(),
        N: () => generate(),
      };
      const action = actions[evt.key];
      if (action) {
        evt.preventDefault();
        action();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [player, generate]);

  return (
    <div className={styles.layout}>
      <div className={styles.stage}>
        <section className={styles.card}>
          <Toolbar
            settings={settings}
            onSettings={onSettings}
            onGenerate={() => generate()}
            onClear={clear}
            onShare={share}
            shareState={shareState}
            mode={mode}
            onMode={setMode}
          />
        </section>
        <GraphCanvas
          graph={graph}
          step={step}
          mode={mode}
          onMoveNode={moveNode}
          onAddNode={addNode}
          onAddEdge={addEdge}
          onDeleteNode={deleteNode}
          onDeleteEdge={deleteEdge}
          onSetWeight={setWeight}
        />
        <section className={styles.card}>
          <Playback player={player} step={step} speed={speed} onSpeed={setSpeed} />
        </section>
      </div>
      <Sidebar
        graph={graph}
        step={step}
        steps={run.steps}
        sorted={run.sorted}
        needed={run.needed}
        components={run.components}
        onSeek={(i) => {
          player.setPlaying(false);
          player.seek(i);
        }}
      />
    </div>
  );
}

export default Visualizer;
