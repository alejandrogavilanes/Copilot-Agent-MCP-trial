import { JSX as JSXInternal } from 'preact';

declare global {
  namespace preact {
    namespace JSX {
      type Element = JSXInternal.Element;
      type HTMLAttributes<RefType extends EventTarget = EventTarget> = JSXInternal.HTMLAttributes<RefType>;
      interface IntrinsicElements extends JSXInternal.IntrinsicElements {}
    }
  }
}

// Extend Window interface for our global toastStore
declare global {
  interface Window {
    toastStore: {
      set: (value: { message: string; type: 'success' | 'error' } | null) => void;
    };
  }
}