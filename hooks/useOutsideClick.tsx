"use client";

import { useEffect, RefObject } from 'react';

export function useOutsideClick(
  ref: RefObject<HTMLElement | null>,
  handler: () => void,
  excludeRefs: RefObject<HTMLElement | null>[] = []
) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      
      // Check if clicked element is outside the ref element
      if (ref.current && !ref.current.contains(target)) {
        // Also check if the click was inside any of the excluded refs
        const clickedInExcludedRefs = excludeRefs.some(
          excludeRef => excludeRef.current && excludeRef.current.contains(target)
        );
        
        if (!clickedInExcludedRefs) {
          handler();
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, handler, excludeRefs]);
} 