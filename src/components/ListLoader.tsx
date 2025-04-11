/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks';
import { loadLinksForList } from '../stores/link-lists';
import LinkList from './LinkList';
import ApiError from './ApiError.astro';

interface ListLoaderProps {
  listId: string;
}

export default function ListLoader({ listId }: ListLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLinks = async () => {
      try {
        setIsLoading(true);
        await loadLinksForList(listId);
        setError(null);
      } catch (err) {
        console.error('Failed to load links:', err);
        setError('Failed to load links. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    loadLinks();
  }, [listId]);

  if (isLoading) {
    return (
      <div class="flex justify-center items-center h-32">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (error) {
    return <ApiError message={error} retry={true} />;
  }

  return <LinkList listId={listId} />;
}