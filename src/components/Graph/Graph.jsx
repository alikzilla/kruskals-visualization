import React, { useState } from "react";
import Graph from "react-graph-vis";
import styles from './graph.module.css';

function GraphVisualization() {
  const [graph, setGraph] = useState(generateRandomGraph());
  const [mst, setMST] = useState(null);

  const options = {
    nodes: {
      borderWidth: 1,
      opacity: 1,
    },
    layout: {
      hierarchical: false
    },
    edges: {
      color: "#000000"
    },
    height: "500px"
  };

  function generateRandomGraph() {
    const numNodes = Math.floor(Math.random() * 10) + 5; // Random number of nodes between 5 and 14
    const nodes = [];
    for (let i = 1; i <= numNodes; i++) {
      nodes.push({ id: i, label: `${i}`, title: `node ${i} tooltip text` });
    }

    const edges = [];
    for (let i = 1; i <= numNodes; i++) {
      const from = i;
      let to;
      do {
        to = Math.floor(Math.random() * numNodes) + 1;
      } while (to === from || edges.some(edge => edge.from === from && edge.to === to));
      edges.push({ from, to });
    }

    return { nodes, edges };
  }

  function findMST() {
    const mstGraph = computeMSTUsingKruskal(graph);
    setMST(mstGraph);
  }

  function computeMSTUsingKruskal(graph) {
    const sortedEdges = graph.edges.slice().sort((a, b) => a.from - b.from || a.to - b.to);
    const mstEdges = [];
    const disjointSets = new Map();

    // Initialize disjoint sets
    for (let node of graph.nodes) {
      disjointSets.set(node.id, node.id);
    }

    function findSet(nodeId) {
      if (disjointSets.get(nodeId) === nodeId) {
        return nodeId;
      }
      return findSet(disjointSets.get(nodeId));
    }

    function union(u, v) {
      disjointSets.set(findSet(u), findSet(v));
    }

    for (let edge of sortedEdges) {
      const rootFrom = findSet(edge.from);
      const rootTo = findSet(edge.to);
      if (rootFrom !== rootTo) {
        mstEdges.push({ ...edge, color: { color: "red" } }); // Change color to red
        union(edge.from, edge.to);
      }
    }

    return { nodes: graph.nodes, edges: mstEdges };
  }

  return (
    <div className={styles.graphVisualization}>
      <div className={styles.graphs}>
        <div className={styles.initialTree}>
          <h1>Initial Tree</h1>
          <div className={styles.graph}>
            <Graph
              className={styles.graph}
              graph={graph}
              options={options}
              events={{ 
                select: function(event) {
                  console.log("Node selected:", event.nodes);
                }
              }}
            />
          </div>
        </div>
        <div>
          <h2>Minimum Spanning Tree</h2>
          <div className={styles.graph}>
            {mst && (<Graph graph={mst} options={options} />)}
          </div>
        </div>  
      </div>
      <button className={styles.button} onClick={findMST}>Find MST</button>
    </div>
  );
}

export default GraphVisualization;