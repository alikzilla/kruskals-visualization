import Icon from '../Icon';
import styles from './toolbar.module.css';

const MODES = [
  { id: 'move', label: 'Move', icon: 'move', hint: 'Drag vertices; click a weight to edit it' },
  { id: 'addNode', label: 'Add vertex', icon: 'node', hint: 'Click on empty space to add a vertex' },
  { id: 'addEdge', label: 'Add edge', icon: 'edge', hint: 'Click two vertices to connect them' },
  { id: 'delete', label: 'Delete', icon: 'trash', hint: 'Click a vertex or edge to remove it' },
];

function Toolbar({ settings, onSettings, onGenerate, onClear, onShare, shareState, mode, onMode }) {
  const set = (key) => (evt) => onSettings({ ...settings, [key]: Number(evt.target.value) });

  return (
    <div className={styles.toolbar}>
      <div className={styles.group}>
        <label className={styles.field}>
          <span>
            Vertices <output>{settings.nodeCount}</output>
          </span>
          <input type="range" min="3" max="20" value={settings.nodeCount} onChange={set('nodeCount')} />
        </label>
        <label className={styles.field}>
          <span>
            Density <output>{Math.round(settings.density * 100)}%</output>
          </span>
          <input type="range" min="0" max="1" step="0.05" value={settings.density} onChange={set('density')} />
        </label>
        <label className={styles.field}>
          <span>
            Max weight <output>{settings.maxWeight}</output>
          </span>
          <input type="range" min="5" max="99" value={settings.maxWeight} onChange={set('maxWeight')} />
        </label>
        <button type="button" className="btn btn-primary" onClick={onGenerate} title="Generate a new random graph (N)">
          <Icon name="shuffle" /> New graph
        </button>
      </div>

      <div className={styles.group}>
        <div className={styles.segmented} role="radiogroup" aria-label="Editing mode">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={mode === m.id}
              className={mode === m.id ? styles.active : ''}
              onClick={() => onMode(m.id)}
              title={m.hint}
            >
              <Icon name={m.icon} size={16} />
              <span>{m.label}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn" onClick={onClear} title="Remove everything and draw your own graph">
          Clear
        </button>
        <button type="button" className="btn" onClick={onShare} title="Copy a link to this exact graph">
          <Icon name="link" size={16} /> {shareState === 'copied' ? 'Copied!' : 'Share'}
        </button>
      </div>
      <p className={styles.hint}>{MODES.find((m) => m.id === mode)?.hint}</p>
    </div>
  );
}

export default Toolbar;
