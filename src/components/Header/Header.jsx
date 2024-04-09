import styles from './header.module.css';

const Header = ({}) => {
  return (
    <header className={styles.header}>
      <img src="./sdu_logo.png" alt="sdu" width={50}/>
      <h1>SDU University - Kruskal's Algorithm</h1>
    </header>
  )
}

export default Header;