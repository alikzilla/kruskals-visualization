import styles from './main.module.css';
import Graph from '../Graph/Graph'

const Main = ({}) => {
  return (
    <section className={styles.graphBlock}>
      <div>Hello world</div>
      <Graph />
    </section>
  )
}

export default Main;