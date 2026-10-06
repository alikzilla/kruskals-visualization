import Icon from '../Icon';
import styles from './header.module.css';

const Header = ({ theme, onToggleTheme }) => {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a className={styles.brand} href="./">
          <img src={`${import.meta.env.BASE_URL}sdu_logo.png`} alt="SDU University" width={36} height={36} />
          <div>
            <strong>Kruskal&apos;s Algorithm</strong>
            <span>Minimum Spanning Tree visualizer · SDU University</span>
          </div>
        </a>
        <nav className={styles.nav}>
          <a href="#about">Learn</a>
          <a
            href="https://github.com/alikzilla/kruskals_visualization"
            target="_blank"
            rel="noreferrer"
            className={styles.iconLink}
            title="Source on GitHub"
          >
            <Icon name="github" size={20} />
          </a>
          <button
            type="button"
            className={styles.iconLink}
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            aria-label="Toggle theme"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
