/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { bulkImportUrls } from '../stores/link-lists';
import { toastStore } from './Toast';

interface BulkImportProps {
  listId: string;
  onClose: () => void;
}

export default function BulkImport({ listId, onClose }: BulkImportProps) {
  const [urls, setUrls] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async (e: JSX.TargetedEvent<HTMLFormElement, Event>) => {
    e.preventDefault();
    if (!urls.trim() || isLoading) return;

    const urlList = urls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urlList.length === 0) return;

    setIsLoading(true);
    try {
      await bulkImportUrls(listId, urlList);
      toastStore.set({ message: `Successfully imported ${urlList.length} URLs`, type: 'success' });
      onClose();
    } catch (error) {
      console.error('Failed to import URLs:', error);
      toastStore.set({ message: 'Failed to import URLs', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div class="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              onClick={onClose}
              class="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
            >
              <span class="sr-only">Close</span>
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Bulk Import URLs
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  Enter one URL per line. Titles and descriptions will be automatically fetched.
                </p>
              </div>

              <form onSubmit={handleImport} class="mt-4">
                <textarea
                  value={urls}
                  onChange={(e: JSX.TargetedEvent<HTMLTextAreaElement>) => setUrls(e.currentTarget.value)}
                  rows={10}
                  class="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                  placeholder="https://example.com&#10;https://another-example.com"
                  disabled={isLoading}
                />

                <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand-600 text-base font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    disabled={isLoading || !urls.trim()}
                  >
                    {isLoading ? (
                      <>
                        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Importing...
                      </>
                    ) : (
                      'Import URLs'
                    )}
                  </button>
                  <button
                    type="button"
                    class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}