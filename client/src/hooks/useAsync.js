import { useState, useEffect, useCallback } from 'react';

/**
 * useAsync – runs an async function and tracks loading / error / data state.
 * @param {Function} fn  – async function that returns data
 * @param {Array}    deps – dependency array (re-runs when these change)
 */
export const useAsync = (fn, deps = []) => {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  const execute = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fn();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err?.response?.data?.message || err.message });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { execute(); }, [execute]);

  return { ...state, refetch: execute };
};
