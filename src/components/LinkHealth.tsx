/** @jsxImportSource preact */
import { useState, useEffect } from 'preact/hooks';
import type { ComponentType } from 'preact';
import { getLinkHealthStats } from '../utils/link-validator';

interface LinkHealthProps {
  listId: string;
}

interface LinkHealthStats {
  total: number;
  statuses: {
    active: number;
    error: number;
    pending: number;
  };
  lastValidated?: string;
}

export const LinkHealth: ComponentType<LinkHealthProps> = ({ listId }) => {
  const [stats, setStats] = useState<LinkHealthStats | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const fetchStats = async () => {
    const newStats = await getLinkHealthStats(listId);
    setStats(newStats);
  };

  useEffect(() => {
    fetchStats();
  }, [listId]);

  const handleValidateClick = async () => {
    setIsValidating(true);
    try {
      const response = await fetch(`/api/lists/${listId}/validate`, {
        method: 'POST'
      });
      if (response.ok) {
        await fetchStats();
      }
    } catch (error) {
      console.error('Error validating links:', error);
    } finally {
      setIsValidating(false);
    }
  };

  if (!stats) return <div>Loading...</div>;

  return (
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
      <h3 class="text-lg font-semibold mb-3">Link Health</h3>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div class="text-sm text-gray-600">Total Links</div>
          <div class="text-2xl font-bold">{stats.total}</div>
        </div>
        <div>
          <div class="text-sm text-gray-600">Active Links</div>
          <div class="text-2xl font-bold text-green-600">{stats.statuses.active}</div>
        </div>
        <div>
          <div class="text-sm text-gray-600">Broken Links</div>
          <div class="text-2xl font-bold text-red-600">{stats.statuses.error}</div>
        </div>
        <div>
          <div class="text-sm text-gray-600">Pending</div>
          <div class="text-2xl font-bold text-gray-600">{stats.statuses.pending}</div>
        </div>
      </div>
      {stats.lastValidated && (
        <div class="text-sm text-gray-500 mb-4">
          Last checked: {new Date(stats.lastValidated).toLocaleString()}
        </div>
      )}
      <button
        onClick={handleValidateClick}
        disabled={isValidating}
        class="w-full justify-center px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-md"
      >
        {isValidating ? 'Validating...' : 'Check All Links'}
      </button>
    </div>
  );
};