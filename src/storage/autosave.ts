import { useState, useEffect, useRef, useCallback } from 'react';
import { PixoraDocument } from '../types/document';
import { saveActiveProject } from './db';

export type AutosaveStatus = 'saved' | 'saving' | 'unsaved';

export function useAutosave(document: PixoraDocument | null, debounceMs = 600) {
  const [status, setStatus] = useState<AutosaveStatus>('saved');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDocJsonRef = useRef<string>('');
  const isInitialMount = useRef(true);

  const save = useCallback(async (doc: PixoraDocument) => {
    setStatus('saving');
    try {
      await saveActiveProject(doc);
      lastSavedDocJsonRef.current = JSON.stringify(doc);
      setStatus('saved');
    } catch (err) {
      console.error('Autosave error:', err);
      setStatus('unsaved');
    }
  }, []);

  useEffect(() => {
    if (!document) return;

    const currentJson = JSON.stringify(document);

    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastSavedDocJsonRef.current = currentJson;
      setStatus('saved');
      return;
    }

    if (currentJson === lastSavedDocJsonRef.current) {
      return;
    }

    setStatus('unsaved');

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      save(document);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [document, debounceMs, save]);

  const forceSave = useCallback(async () => {
    if (!document) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await save(document);
  }, [document, save]);

  return { status, forceSave };
}
