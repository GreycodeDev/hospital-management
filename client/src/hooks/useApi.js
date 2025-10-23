import { useState, useEffect } from 'react';

export const useApi = (apiFunction, immediate = true, ...params) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = async (...execParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFunction(...execParams);
      setData(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (immediate) {
      execute(...params);
    }
  }, []);

  return { data, loading, error, execute, setData };
};