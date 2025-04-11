/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks';

export default function ShortcutsDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show shortcuts dialog when pressing ?
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsOpen(true);
      }
      // Close dialog with Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: '?', description: 'Show keyboard shortcuts' },
    { key: 'Ctrl/⌘ + K', description: 'Focus URL input' },
    { key: '↑/↓', description: 'Navigate between links' },
    { key: 'Enter', description: 'Open selected link' },
    { key: 'Del/Backspace', description: 'Delete selected link' },
    { key: 'Esc', description: 'Close dialogs' },
  ];

  return (
    <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsOpen(false)} />

        <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Keyboard Shortcuts
              </h3>
              <div class="mt-4 border-t border-gray-200">
                <ul class="divide-y divide-gray-200">
                  {shortcuts.map(({ key, description }) => (
                    <li key={key} class="py-3">
                      <div class="flex justify-between">
                        <kbd class="px-2 py-1 text-sm font-semibold bg-gray-100 border border-gray-200 rounded">
                          {key}
                        </kbd>
                        <span class="text-sm text-gray-500">{description}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}