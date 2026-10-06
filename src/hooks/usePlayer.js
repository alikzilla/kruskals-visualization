import { useCallback, useEffect, useState } from 'react';

/** Drives playback through a list of steps: play/pause, step, seek, speed. */
export function usePlayer(stepCount, { delay = 900, resetKey } = {}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const last = Math.max(0, stepCount - 1);

  // New run → rewind.
  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [resetKey]);

  useEffect(() => {
    if (!playing) return undefined;
    if (index >= last) {
      setPlaying(false);
      return undefined;
    }
    const t = setTimeout(() => setIndex((i) => Math.min(i + 1, last)), delay);
    return () => clearTimeout(t);
  }, [playing, index, last, delay]);

  const seek = useCallback((i) => setIndex(Math.max(0, Math.min(last, i))), [last]);
  const next = useCallback(() => setIndex((i) => Math.min(i + 1, last)), [last]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);
  const toStart = useCallback(() => {
    setPlaying(false);
    setIndex(0);
  }, []);
  const toEnd = useCallback(() => {
    setPlaying(false);
    setIndex(last);
  }, [last]);
  const toggle = useCallback(() => {
    setPlaying((p) => {
      if (!p && index >= last) setIndex(0); // replay from the start
      return !p;
    });
  }, [index, last]);

  return { index, playing, last, seek, next, prev, toStart, toEnd, toggle, setPlaying };
}
