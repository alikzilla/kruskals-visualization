import React, { useState } from "react";
import Graph from "react-graph-vis";
import styles from './graph.module.css';

function GraphVisualization() {
  const [graph, setGraph] = useState(generateRandomGraph());
  const [mst, setMST] = useState({ nodes: [], edges: [] });

  const optionsGraph = {
    nodes: {
      borderWidth: 1,
    },
    layout: {
      hierarchical: false
    },
    edges: {
      color: {
        color: "#000000",
      },
      font: {
        size: 14 // Adjust font size for edge labels
      }
    },
    height: "500px"
  };

  const optionsMst = {
    nodes: {
      borderWidth: 1,
    },
    layout: {
      hierarchical: false,
    },
    edges: {
      color: {
        color: "#000000",
        highlight: "transparent"
      },
      font: {
        size: 14,
      }
    },
    height: "500px",
  }

  function generateRandomGraph() {
    const numNodes = Math.floor(Math.random() * 10) + 5; // Random number of nodes between 5 and 14
    const nodes = [];
    for (let i = 1; i <= numNodes; i++) {
      nodes.push({ id: i, label: `${i}`, title: `node ${i} tooltip text` });
    }
  
    const edges = [];
    const visitedEdges = new Set(); // Keep track of visited edges
  
    for (let i = 1; i <= numNodes; i++) {
      const from = i;
      let to;
      do {
        to = Math.floor(Math.random() * numNodes) + 1;
      } while (to === from || visitedEdges.has(`${from}-${to}`) || visitedEdges.has(`${to}-${from}`));
      
      visitedEdges.add(`${from}-${to}`);
      visitedEdges.add(`${to}-${from}`);
      
      const weight = Math.floor(Math.random() * 10) + 1; // Random weight between 1 and 10
      edges.push({ from, to, label: `${weight}` }); // Adding edge from A to B
      edges.push({ from: to, to: from, label: `${weight}` }); // Adding edge from B to A (undirected)
    }
  
    // Connect the last node to one of the previous nodes to create a cycle
    const lastNodeId = numNodes;
    const previousNodeId = Math.floor(Math.random() * (numNodes - 1)) + 1;
    const weight = Math.floor(Math.random() * 10) + 1; // Random weight between 1 and 10
    edges.push({ from: lastNodeId, to: previousNodeId, label: `${weight}` }); // Add edge to create a cycle
    edges.push({ from: previousNodeId, to: lastNodeId, label: `${weight}` }); // Add edge to create a cycle (undirected)
  
    return { nodes, edges };
  }

  function findMST() {
    // Compute MST using Kruskal's algorithm
    const mstGraph = computeMSTUsingKruskal(graph);
  
    // Create a copy of the initial graph
    const updatedGraph = {
      nodes: [...graph.nodes],
      edges: [],
    };
  
    // Update edges' colors to red for the MST
    mstGraph.edges.forEach(mstEdge => {
      const correspondingEdge = graph.edges.find(edge => edge.from === mstEdge.from && edge.to === mstEdge.to);
      updatedGraph.edges.push({ ...correspondingEdge, color: 'red' });
    });
  
    // Set the updated graph with red edges as MST
    let delay = 0;
    updatedGraph.nodes.forEach(node => {
      setTimeout(() => {
        setMST(prevGraph => ({
          ...prevGraph,
          nodes: [...prevGraph.nodes, node]
        }));
      }, delay);
      delay += 1000;
    });
  
    delay = 0;
    updatedGraph.edges.forEach(edge => {
      setTimeout(() => {
        setMST(prevGraph => ({
          ...prevGraph,
          edges: [...prevGraph.edges, edge]
        }));
      }, delay);
      delay += 1000;
    });
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
      const rootU = findSet(u);
      const rootV = findSet(v);
  
      if (rootU !== rootV) {
        if (rootU < rootV) {
          disjointSets.set(rootV, rootU);
        } else {
          disjointSets.set(rootU, rootV);
        }
      }
    }
  
    for (let edge of sortedEdges) {
      const rootFrom = findSet(edge.from);
      const rootTo = findSet(edge.to);
      if (rootFrom !== rootTo) {
        mstEdges.push(edge); // Add edge to MST
        union(edge.from, edge.to);
      }
    }
  
    return { nodes: graph.nodes, edges: mstEdges };
  }

  function resetGraph() {
    const newGraph = generateRandomGraph();
    setGraph(newGraph);
    setMST({nodes: [], edges: []}); // Reset MST when resetting the graph
  }

  return (
    <section className={styles.graphVisualization}>
      <div className={styles.graphs}>
        <div className={styles.initialTree}>
          <h1>Initial Tree</h1>
          <section className={styles.graph}>
            <Graph
              graph={graph}
              className={styles.graph}
              options={optionsGraph}
              events={{ 
                select: function(event) {
                  console.log("Node selected:", event.nodes);
                }
              }}
            />
          </section>
        </div>
        <div>
          <h2>Minimum Spanning Tree</h2>
          <section className={styles.graph}>
            {mst && (
              <Graph
                graph={mst}
                options={optionsMst}
                className={styles.graph}
              />
            )}
          </section>
        </div>  
      </div>
      <section className={styles.controls}>
        <button className={styles.button} onClick={resetGraph}>New Graph</button>
        <button className={styles.button} onClick={findMST}>Find MST</button>
      </section>
    </section>
  );
}

export default GraphVisualization;
