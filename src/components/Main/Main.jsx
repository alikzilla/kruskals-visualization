import styles from './main.module.css';
import Graph from '../Graph/Graph'

const Main = ({}) => {
  return (
    <section className={styles.graphBlock}>
      <div className={styles.content}>
        <h1>Kruskal's Algorihm in MST(Minimum Spanning Tree)</h1>
      </div>
      <Graph />
    </section>
  )
}

export default Main;