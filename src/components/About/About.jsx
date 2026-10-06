import styles from './about.module.css';

function About() {
  return (
    <section className={styles.about} id="about">
      <article>
        <h2>What is a minimum spanning tree?</h2>
        <p>
          Given a connected, weighted, undirected graph, a <b>spanning tree</b> connects all <i>V</i> vertices using
          exactly <i>V − 1</i> edges and no cycles. The <b>minimum</b> spanning tree is the one whose edge weights add
          up to the smallest possible total — think of laying the least cable to connect every building on campus.
        </p>
      </article>
      <article>
        <h2>How Kruskal&apos;s algorithm works</h2>
        <ol>
          <li>Sort every edge from cheapest to most expensive.</li>
          <li>Put each vertex in its own set (a forest of single-vertex trees).</li>
          <li>
            Walk the sorted edges. If an edge joins two <em>different</em> sets, keep it and merge the sets; otherwise
            it would close a cycle, so discard it.
          </li>
          <li>Stop once the tree has <i>V − 1</i> edges.</li>
        </ol>
        <p>
          It is a <b>greedy</b> algorithm: the cut property guarantees that the cheapest edge crossing any cut is
          always safe to add.
        </p>
      </article>
      <article>
        <h2>Complexity</h2>
        <ul>
          <li>
            Sorting: <code>O(E log E)</code>
          </li>
          <li>
            Union-Find with path compression and union by rank: <code>O(E · α(V))</code> — practically linear
          </li>
          <li>
            Overall: <code>O(E log E)</code> time, <code>O(V + E)</code> space
          </li>
        </ul>
        <p>Kruskal shines on sparse graphs; on dense graphs Prim&apos;s algorithm with a heap is often preferred.</p>
      </article>
      <article>
        <h2>Tips</h2>
        <ul>
          <li>
            Keyboard: <kbd>Space</kbd> play/pause, <kbd>←</kbd>/<kbd>→</kbd> step, <kbd>Home</kbd>/<kbd>End</kbd> jump,{' '}
            <kbd>N</kbd> new graph.
          </li>
          <li>Drag vertices to untangle the drawing — it doesn&apos;t restart the run.</li>
          <li>Click any weight to change it, or build your own graph with the edit tools.</li>
          <li>Click an edge in the list to jump to the moment it was decided.</li>
          <li>
            Use <b>Share</b> to send a link to the exact same graph.
          </li>
        </ul>
      </article>
    </section>
  );
}

export default About;
