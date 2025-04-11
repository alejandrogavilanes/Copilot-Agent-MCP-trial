/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks';
import { atom } from 'nanostores';

export const toastStore = atom<{ message: string; type: 'success' | 'error' } | null>(null);

interface ToastProps {
  duration?: number;
}

export default function Toast({ duration = 3000 }: ToastProps) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const unsubscribe = toastStore.subscribe((value) => {
      setToast(value);
      if (value) {
        setTimeout(() => {
          toastStore.set(null);
        }, duration);
      }
    });

    return () => unsubscribe();
  }, [duration]);

  if (!toast) return null;

  const bgColor = toast.type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div class="fixed bottom-4 right-4 z-50">
      <div class={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg`}>
        {toast.message}
      </div>
    </div>
  );
}