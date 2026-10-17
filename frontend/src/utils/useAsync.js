import { useCallback, useEffect, useState } from 'react';

// Tiny data-loading hook: const { data, loading, error, reload } = useAsync(() => api.requests(), [])
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });

  const run = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    return fn()
      .then((data) => setState({ data, loading: false, error: '' }))
      .catch((e) => setState({ data: null, loading: false, error: e.message }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);
  return { ...state, reload: run };
}
