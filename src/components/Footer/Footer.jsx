import styles from './footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <p>
        Built at SDU University · Kruskal&apos;s algorithm, J. B. Kruskal (1956) ·{' '}
        <a href="https://github.com/alikzilla/kruskals_visualization" target="_blank" rel="noreferrer">
          Source code
        </a>
      </p>
    </footer>
  );
};

export default Footer;
