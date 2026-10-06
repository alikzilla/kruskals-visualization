import Icon from '../Icon';
import { SPEEDS } from '../../lib/theme';
import styles from './playback.module.css';

const KIND_LABEL = {
  start: 'Ready',
  sort: 'Sort',
  makeset: 'Make-set',
  consider: 'Examine',
  accept: 'Accept',
  reject: 'Reject',
  done: 'Done',
};

function Playback({ player, step, speed, onSpeed }) {
  const { index, last, playing } = player;

  return (
    <div className={styles.playback}>
      <div className={`${styles.message} ${styles[step.kind]}`} aria-live="polite">
        <span className={styles.badge}>{KIND_LABEL[step.kind]}</span>
        <p>{step.message}</p>
      </div>

      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button type="button" className="icon-btn" onClick={player.toStart} disabled={index === 0} title="First step (Home)">
            <Icon name="first" />
          </button>
          <button type="button" className="icon-btn" onClick={player.prev} disabled={index === 0} title="Previous step (←)">
            <Icon name="prev" />
          </button>
          <button
            type="button"
            className={`icon-btn ${styles.play}`}
            onClick={player.toggle}
            disabled={last === 0}
            title={playing ? 'Pause (Space)' : 'Play (Space)'}
          >
            <Icon name={playing ? 'pause' : 'play'} size={22} />
          </button>
          <button type="button" className="icon-btn" onClick={player.next} disabled={index >= last} title="Next step (→)">
            <Icon name="next" />
          </button>
          <button type="button" className="icon-btn" onClick={player.toEnd} disabled={index >= last} title="Last step (End)">
            <Icon name="last" />
          </button>
        </div>

        <input
          className={styles.timeline}
          type="range"
          min="0"
          max={last}
          value={index}
          onChange={(evt) => {
            player.setPlaying(false);
            player.seek(Number(evt.target.value));
          }}
          aria-label="Step"
          style={{ '--progress': `${last ? (index / last) * 100 : 0}%` }}
        />
        <span className={styles.counter}>
          {index}/{last}
        </span>

        <div className={styles.speed} role="radiogroup" aria-label="Playback speed">
          {SPEEDS.map((s, i) => (
            <button
              key={s.label}
              type="button"
              role="radio"
              aria-checked={speed === i}
              className={speed === i ? styles.speedActive : ''}
              onClick={() => onSpeed(i)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <ul className={styles.legend}>
        <li><i className={styles.lgPending} /> Unexamined</li>
        <li><i className={styles.lgCurrent} /> Examining</li>
        <li><i className={styles.lgAccepted} /> In the tree</li>
        <li><i className={styles.lgRejected} /> Rejected (cycle)</li>
        <li><i className={styles.lgSkipped} /> Not needed</li>
        <li className={styles.lgNote}>Same-coloured vertices are in the same union-find set</li>
      </ul>
    </div>
  );
}

export default Playback;
