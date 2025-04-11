/** @jsxImportSource preact */
import { useStore } from '@nanostores/preact';
import { useCallback, useEffect, useState, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import { currentLinks, addLink, deleteLink, updateLinkOrder, updateLink, refreshMetadata } from '../stores/link-lists';
import { toastStore } from './Toast';
import SearchBar from './SearchBar';
import TagsInput from './TagsInput';
import BulkImport from './BulkImport';
import type { Link, SearchResult } from '../utils/db';

interface LinkListProps {
  listId: string;
}

export default function LinkList({ listId }: LinkListProps) {
  const links = useStore(currentLinks);
  const [newUrl, setNewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [optimisticLinks, setOptimisticLinks] = useState<Link[]>([]);
  const [sortOrder, setSortOrder] = useState<'oldest' | 'newest' | 'manual'>('manual');
  const [processingLinks, setProcessingLinks] = useState<Set<string>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  // Keep optimisticLinks in sync with actual links when not loading
  useEffect(() => {
    if (!isLoading) {
      setOptimisticLinks(links);
    }
  }, [links, isLoading]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus URL input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('input[type="url"]');
        input?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sort links based on current sort order
  const sortedLinks = [...optimisticLinks].sort((a, b) => {
    switch (sortOrder) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      default:
        return a.order_index - b.order_index;
    }
  });

  // Display either search results or regular sorted links
  const displayLinks = searchResults.length > 0
    ? searchResults.map(result => result.link)
    : sortedLinks;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keyboard navigation when editing a link
      if (editingId !== null) return;
      
      // Don't handle if we're in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(displayLinks.length - 1, prev + 1));
          break;
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < displayLinks.length) {
            e.preventDefault();
            window.open(displayLinks[selectedIndex].url, '_blank');
          }
          break;
        case 'Backspace':
        case 'Delete':
          if (selectedIndex >= 0 && selectedIndex < displayLinks.length) {
            e.preventDefault();
            handleDelete(displayLinks[selectedIndex].id);
          }
          break;
        case 'e':
          if (selectedIndex >= 0 && selectedIndex < displayLinks.length) {
            e.preventDefault();
            handleStartEdit(displayLinks[selectedIndex]);
          }
          break;
        case 'r':
          if (selectedIndex >= 0 && selectedIndex < displayLinks.length) {
            const link = displayLinks[selectedIndex];
            if (!link.title || !link.description) {
              e.preventDefault();
              handleRefreshMetadata(link.id);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayLinks, selectedIndex, editingId]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleAddLink = async (e: JSX.TargetedEvent<HTMLFormElement, Event>) => {
    e.preventDefault();
    if (!newUrl || isLoading) return;

    setIsLoading(true);
    const tempId = 'temp-' + Date.now();
    
    // Add optimistic link with loading state
    const optimisticLink: Link = {
      id: tempId,
      list_id: listId,
      url: newUrl,
      title: 'Loading...',
      description: null,
      order_index: optimisticLinks.length,
      created_at: new Date(),
      updated_at: new Date()
    };

    setOptimisticLinks([...optimisticLinks, optimisticLink]);
    setProcessingLinks(new Set([...processingLinks, tempId]));
    
    try {
      await addLink(listId, newUrl);
      setNewUrl('');
      toastStore.set({ message: 'Link added successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to add link:', error);
      toastStore.set({ message: 'Failed to add link', type: 'error' });
      setOptimisticLinks(links);
    } finally {
      setIsLoading(false);
      setProcessingLinks(new Set([...processingLinks].filter(id => id !== tempId)));
    }
  };

  const handleStartEdit = (link: Link) => {
    setEditingId(link.id);
    setEditUrl(link.url);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editUrl || isLoading) return;

    setIsLoading(true);
    // Update optimistically
    const updatedOptimistic = optimisticLinks.map(link => 
      link.id === id ? { ...link, url: editUrl } : link
    );
    setOptimisticLinks(updatedOptimistic);
    
    try {
      await updateLink(id, editUrl);
      toastStore.set({ message: 'Link updated successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to update link:', error);
      toastStore.set({ message: 'Failed to update link', type: 'error' });
      // Revert optimistic update
      setOptimisticLinks(links);
    } finally {
      setIsLoading(false);
      setEditingId(null);
      setEditUrl('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditUrl('');
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    // Update optimistically
    setOptimisticLinks(optimisticLinks.filter(link => link.id !== id));
    
    try {
      await deleteLink(id);
      toastStore.set({ message: 'Link deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to delete link:', error);
      toastStore.set({ message: 'Failed to delete link', type: 'error' });
      // Revert optimistic update
      setOptimisticLinks(links);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = async (e: JSX.TargetedDragEvent<HTMLLIElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const draggedLink = optimisticLinks[draggedIndex];
    if (!draggedLink) return;

    // Update optimistically
    const newLinks = [...optimisticLinks];
    newLinks.splice(draggedIndex, 1);
    newLinks.splice(index, 0, draggedLink);
    setOptimisticLinks(newLinks);
    
    try {
      await updateLinkOrder(draggedLink.id, index);
    } catch (error) {
      console.error('Failed to update link order:', error);
      toastStore.set({ message: 'Failed to update link order', type: 'error' });
      // Revert optimistic update
      setOptimisticLinks(links);
    }
    
    setDraggedIndex(index);
  };

  const handleRefreshMetadata = async (id: string) => {
    setProcessingLinks(new Set([...processingLinks, id]));
    try {
      await refreshMetadata(id);
      toastStore.set({ message: 'Metadata refreshed successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to refresh metadata:', error);
      toastStore.set({ message: 'Failed to refresh metadata', type: 'error' });
    } finally {
      setProcessingLinks(new Set([...processingLinks].filter(pid => pid !== id)));
    }
  };

  return (
    <div class="space-y-4">
      <div class="flex justify-between items-center gap-4">
        <div class="flex-1">
          <SearchBar listId={listId} onResultsChange={setSearchResults} />
        </div>

        <button
          onClick={() => setShowBulkImport(true)}
          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
        >
          <svg class="h-5 w-5 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
            <path d="M9 13h2v5a1 1 0 11-2 0v-5z" />
          </svg>
          Bulk Import
        </button>

        <div>
          <select
            value={sortOrder}
            onChange={(e: JSX.TargetedEvent<HTMLSelectElement>) => 
              setSortOrder(e.currentTarget.value as 'oldest' | 'newest' | 'manual')
            }
            class="rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
          >
            <option value="manual">Manual Order</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      <div class="flex gap-2 items-center">
        <form onSubmit={handleAddLink} class="flex-1 flex gap-2">
          <div class="relative flex-1">
            <input
              type="url"
              value={newUrl}
              onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => setNewUrl(e.currentTarget.value)}
              placeholder="Enter URL (Ctrl+K)"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
              disabled={isLoading}
              required
            />
          </div>
          <button
            type="submit"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading...
              </>
            ) : (
              'Add Link'
            )}
          </button>
        </form>
      </div>

      <ul ref={listRef} class="space-y-2">
        {displayLinks.map((link: Link, index: number) => (
          <li
            key={link.id}
            draggable={editingId !== link.id && sortOrder === 'manual' && searchResults.length === 0}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onClick={() => setSelectedIndex(index)}
            class={`flex flex-col gap-2 p-3 bg-white rounded-md shadow-sm border ${
              index === selectedIndex ? 'border-brand-500 ring-2 ring-brand-500' : 'border-gray-200'
            } ${processingLinks.has(link.id) ? 'animate-pulse' : ''}`}
          >
            <div class="flex items-center gap-2">
              {editingId === link.id ? (
                <div class="flex-1 flex gap-2">
                  <input
                    type="url"
                    value={editUrl}
                    onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => setEditUrl(e.currentTarget.value)}
                    class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                    disabled={isLoading}
                    required
                  />
                  <button
                    onClick={() => handleSaveEdit(link.id)}
                    disabled={isLoading}
                    class="px-2 py-1 text-sm text-green-700 hover:text-green-800"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    class="px-2 py-1 text-sm text-gray-600 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      {link.favicon_url && (
                        <img 
                          src={link.favicon_url} 
                          alt="" 
                          class="w-4 h-4 object-contain"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      )}
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        class={`text-brand-600 hover:text-brand-700 ${
                          link.status === 'error' ? 'line-through opacity-70' : ''
                        }`}
                      >
                        {processingLinks.has(link.id) ? (
                          <span class="inline-flex items-center">
                            Loading metadata...
                            <svg class="ml-2 animate-spin h-4 w-4 text-brand-600" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          </span>
                        ) : (
                          link.title || link.url
                        )}
                      </a>
                      {!processingLinks.has(link.id) && (
                        <div class="flex items-center gap-2">
                          <span class="text-xs text-gray-400">
                            {new Date(link.created_at).toLocaleDateString()}
                          </span>
                          {link.status === 'error' && (
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Error
                            </span>
                          )}
                          {link.content_type && (
                            <span class="text-xs text-gray-400">
                              {link.content_type.split(';')[0]}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {link.description && !processingLinks.has(link.id) && (
                      <p class="mt-1 text-sm text-gray-500">{link.description}</p>
                    )}
                    {link.og_image_url && (
                      <img 
                        src={link.og_image_url} 
                        alt="" 
                        class="mt-2 rounded-md max-h-32 object-cover"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    )}
                  </div>
                  <div class="flex gap-1">
                    <button
                      onClick={() => handleStartEdit(link)}
                      class="p-1 text-gray-400 hover:text-brand-500"
                      aria-label="Edit link"
                      disabled={processingLinks.has(link.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      class="p-1 text-gray-400 hover:text-red-500"
                      aria-label="Delete link"
                      disabled={processingLinks.has(link.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {!processingLinks.has(link.id) && (!link.title || !link.description) && (
                      <button
                        onClick={() => handleRefreshMetadata(link.id)}
                        class="p-1 text-gray-400 hover:text-brand-500"
                        aria-label="Refresh metadata"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {!editingId && !processingLinks.has(link.id) && (
              <TagsInput linkId={link.id} />
            )}
          </li>
        ))}
      </ul>

      {showBulkImport && (
        <BulkImport
          listId={listId}
          onClose={() => setShowBulkImport(false)}
        />
      )}
    </div>
  );
}