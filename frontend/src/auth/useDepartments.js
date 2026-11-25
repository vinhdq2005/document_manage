import { useCallback, useEffect, useMemo, useState } from 'react';
import { departmentsApi } from '../api';
import { useAuth } from './AuthContext';

export function useDepartments() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(Boolean(user?.is_admin));
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!user?.is_admin) return;
    setLoading(true);
    setError('');
    try {
      setList(await departmentsApi.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const names = useMemo(() => {
    const map = {};
    if (user && !user.is_admin && user.department_name) map[user.department_id] = user.department_name;
    list.forEach((d) => { map[d.id] = d.name; });
    return map;
  }, [list, user]);

  const nameOf = useCallback((id) => names[id] || `Phòng #${id}`, [names]);
  return { list, names, nameOf, loading, error, reload };
}
