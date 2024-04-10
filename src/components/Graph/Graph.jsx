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
    setMST(null); // Reset MST
    const mstEdges = [];
    let i = 0;
    const addEdge = () => {
      return new Promise(resolve => {
        if (i < mstGraph.edges.length) {
          const updatedEdges = [...mstEdges, mstGraph.edges[i]];
          setMST(prevState => ({
            nodes: mstGraph.nodes,
            edges: updatedEdges
          }));
          i++;
          setTimeout(() => {
            console.log("1 second");
            resolve();
          }, 1000); // Append new edge every 1 second
        }
      });
    };

    const addEdgesSequentially = async () => {
      while (i < mstGraph.edges.length) {
        await addEdge();
      }
    };

    addEdgesSequentially();
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
              key={selectGroup}
              className={styles.graph}
              options={options}
              events={{ 
                select: function(event) {
                  console.log("Node selected:", event.nodes);
                }
              }}
              graph={
                {
                  nodes: graph.nodes.filter(n => n.network === parseInt(selectGroup)),
                  edges: graph.edges.filter(n => n.network === parseInt(selectGroup)),
                }
              }
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