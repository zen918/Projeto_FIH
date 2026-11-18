import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

export function useApiData<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);
  const active = useRef(true);

  const load = useCallback(async () => {
    if (!path) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<T>(path);
      if (active.current) setData(result);
    } catch (loadError) {
      if (active.current) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Não foi possível carregar as informações.',
        );
      }
    } finally {
      if (active.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    active.current = true;
    void load();
    return () => {
      active.current = false;
    };
  }, [load]);

  return { data, loading, error, refresh: load, setData };
}
