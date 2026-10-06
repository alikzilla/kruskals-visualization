import { useEffect, useState } from 'react';
import './App.css';
import Header from './components/Header/Header';
import Visualizer from './components/Visualizer/Visualizer';
import About from './components/About/About';
import Footer from './components/Footer/Footer';

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* storage unavailable */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);

  return (
    <>
      <Header theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />
      <main className="container">
        <div className="intro">
          <h1>Find the minimum spanning tree, one edge at a time</h1>
          <p>
            Watch Kruskal&apos;s greedy algorithm sort the edges, test each one with Union-Find, and grow a forest
            into a single tree of minimum total weight.
          </p>
        </div>
        <Visualizer />
        <About />
      </main>
      <Footer />
    </>
  );
}

export default App;
