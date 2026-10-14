import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export interface KeyboardShortcutHandlers {
  onSearch?: () => void;
  onNewArticle?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts(handlers?: KeyboardShortcutHandlers) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl+K / Cmd+K: Focus global search
      if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (handlers?.onSearch) {
          handlers.onSearch();
        } else {
          const searchInput = document.querySelector<HTMLInputElement>(
            '#global-search-input, [data-shortcut="search"], input[type="text"][placeholder*="Search" i]'
          );
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }
        return;
      }

      // Ctrl+N / Cmd+N: New article action
      if (isCmdOrCtrl && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (handlers?.onNewArticle) {
          handlers.onNewArticle();
        } else {
          const newArticleBtn = document.querySelector<HTMLElement>(
            '[data-shortcut="new-article"]'
          );
          if (newArticleBtn) {
            newArticleBtn.click();
          } else {
            navigate('/articles?new=true');
          }
        }
        return;
      }

      // Escape: Close modals, drawers, or blur inputs
      if (e.key === 'Escape') {
        if (handlers?.onEscape) {
          handlers.onEscape();
        } else {
          const active = document.activeElement as HTMLElement | null;
          if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
            active.blur();
          }
          window.dispatchEvent(new CustomEvent('admin:close-modals'));
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers, navigate]);
}

export default useKeyboardShortcuts;
