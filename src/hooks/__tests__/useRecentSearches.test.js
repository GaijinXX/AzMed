import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useRecentSearches } from '../useRecentSearches.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index) => Object.keys(store)[index] || null),
    store
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useRecentSearches', () => {
  beforeEach(() => {
    localStorageMock.store = {};
    vi.clearAllMocks();
    // Reset setItem to default behavior
    localStorageMock.setItem.mockImplementation((key, value) => {
      localStorageMock.store[key] = value.toString();
    });
    localStorageMock.getItem.mockImplementation((key) => localStorageMock.store[key] || null);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('initialization', () => {
    it('should initialize with empty array when no stored data', () => {
      const { result } = renderHook(() => useRecentSearches());
      
      expect(result.current.recentSearches).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.hasRecentSearches).toBe(false);
    });

    it('should load existing searches from localStorage', () => {
      const existingSearches = ['react', 'javascript', 'testing'];
      localStorageMock.store['recent-searches'] = JSON.stringify(existingSearches);

      const { result } = renderHook(() => useRecentSearches());
      
      expect(result.current.recentSearches).toEqual(existingSearches);
      expect(result.current.hasRecentSearches).toBe(true);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.store['recent-searches'] = 'invalid json';

      const { result } = renderHook(() => useRecentSearches());
      
      expect(result.current.recentSearches).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should filter out invalid entries from stored data', () => {
      const corruptedData = ['valid', null, '', '  ', 'another valid', undefined, 123];
      localStorageMock.store['recent-searches'] = JSON.stringify(corruptedData);

      const { result } = renderHook(() => useRecentSearches());
      
      expect(result.current.recentSearches).toEqual(['valid', 'another valid']);
    });

    it('should limit loaded searches to maximum allowed', () => {
      const tooManySearches = Array.from({ length: 10 }, (_, i) => `search${i}`);
      localStorageMock.store['recent-searches'] = JSON.stringify(tooManySearches);

      const { result } = renderHook(() => useRecentSearches());
      
      expect(result.current.recentSearches).toHaveLength(5);
      expect(result.current.recentSearches).toEqual(tooManySearches.slice(0, 5));
    });
  });

  describe('addRecentSearch', () => {
    it('should add a new search term', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addRecentSearch('react');
      });

      expect(result.current.recentSearches).toEqual(['react']);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'recent-searches',
        JSON.stringify(['react'])
      );
    });

    it('should add multiple search terms in correct order', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addRecentSearch('first');
        result.current.addRecentSearch('second');
        result.current.addRecentSearch('third');
      });

      expect(result.current.recentSearches).toEqual(['third', 'second', 'first']);
    });

    it('should move existing search to top (deduplication)', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addRecentSearch('first');
        result.current.addRecentSearch('second');
        result.current.addRecentSearch('third');
        result.current.addRecentSearch('first'); // Should move to top
      });

      expect(result.current.recentSearches).toEqual(['first', 'third', 'second']);
    });

    it('should limit to maximum 5 searches', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        for (let i = 1; i <= 7; i++) {
          result.current.addRecentSearch(`search${i}`);
        }
      });

      expect(result.current.recentSearches).toHaveLength(5);
      expect(result.current.recentSearches).toEqual([
        'search7', 'search6', 'search5', 'search4', 'search3'
      ]);
    });

    it('should ignore empty or whitespace-only searches', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addRecentSearch('');
        result.current.addRecentSearch('   ');
        result.current.addRecentSearch('\t\n');
        result.current.addRecentSearch('valid');
      });

      expect(result.current.recentSearches).toEqual(['valid']);
    });

    it('should ignore null or undefined searches', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addRecentSearch(null);
        result.current.addRecentSearch(undefined);
        result.current.addRecentSearch('valid');
      });

      expect(result.current.recentSearches).toEqual(['valid']);
    });

    it('should trim whitespace from search terms', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addRecentSearch('  trimmed  ');
      });

      expect(result.current.recentSearches).toEqual(['trimmed']);
    });

    it('should truncate searches longer than 100 characters', () => {
      const { result } = renderHook(() => useRecentSearches());
      const longSearch = 'a'.repeat(150);

      act(() => {
        result.current.addRecentSearch(longSearch);
      });

      expect(result.current.recentSearches[0]).toHaveLength(100);
      expect(result.current.recentSearches[0]).toBe('a'.repeat(100));
    });

    it('should ignore non-string search terms', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addRecentSearch(123);
        result.current.addRecentSearch({});
        result.current.addRecentSearch([]);
        result.current.addRecentSearch('valid');
      });

      expect(result.current.recentSearches).toEqual(['valid']);
    });
  });

  describe('removeRecentSearch', () => {
    it('should remove a specific search term', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addRecentSearch('first');
        result.current.addRecentSearch('second');
        result.current.addRecentSearch('third');
      });

      // Clear previous calls to focus on the removal call
      vi.clearAllMocks();

      act(() => {
        result.current.removeRecentSearch('second');
      });

      expect(result.current.recentSearches).toEqual(['third', 'first']);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'recent-searches',
        JSON.stringify(['third', 'first'])
      );
    });

    it('should handle removing non-existent search term', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addRecentSearch('existing');
      });

      act(() => {
        result.current.removeRecentSearch('non-existent');
      });

      expect(result.current.recentSearches).toEqual(['existing']);
    });

    it('should ignore null or undefined removal requests', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addRecentSearch('existing');
      });

      act(() => {
        result.current.removeRecentSearch(null);
        result.current.removeRecentSearch(undefined);
      });

      expect(result.current.recentSearches).toEqual(['existing']);
    });
  });

  describe('clearAllRecentSearches', () => {
    it('should clear all recent searches', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addRecentSearch('first');
        result.current.addRecentSearch('second');
      });

      act(() => {
        result.current.clearAllRecentSearches();
      });

      expect(result.current.recentSearches).toEqual([]);
      expect(result.current.hasRecentSearches).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('recent-searches');
    });
  });

  describe('localStorage error handling', () => {
    it('should handle localStorage quota exceeded error', () => {
      const { result } = renderHook(() => useRecentSearches());
      
      // Mock quota exceeded error
      localStorageMock.setItem.mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      act(() => {
        result.current.addRecentSearch('test');
      });

      expect(result.current.error).toContain('Storage quota exceeded');
    });

    it('should handle localStorage access denied error', () => {
      const { result } = renderHook(() => useRecentSearches());
      
      // Mock access denied error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Access denied');
      });

      act(() => {
        result.current.addRecentSearch('test');
      });

      expect(result.current.error).toContain('Unable to access browser storage');
    });

    it('should handle localStorage read errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Read error');
      });

      const { result } = renderHook(() => useRecentSearches());
      
      expect(result.current.recentSearches).toEqual([]);
      expect(result.current.error).toContain('Unable to load recent searches');
    });

    it('should clear error after timeout', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useRecentSearches());
      
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Test error');
      });

      act(() => {
        result.current.addRecentSearch('test');
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.error).toBe(null);
      
      vi.useRealTimers();
    });
  });

  describe('storage availability', () => {
    it('should detect when localStorage is available', () => {
      const { result } = renderHook(() => useRecentSearches());
      
      expect(result.current.isStorageAvailable).toBe(true);
    });

    it('should detect when localStorage is not available', () => {
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Not available');
      });

      const { result } = renderHook(() => useRecentSearches());
      
      expect(result.current.isStorageAvailable).toBe(false);
      
      localStorageMock.setItem = originalSetItem;
    });
  });

  describe('utility properties', () => {
    it('should provide correct constants', () => {
      const { result } = renderHook(() => useRecentSearches());
      
      expect(result.current.maxRecentSearches).toBe(5);
      expect(result.current.storageKey).toBe('recent-searches');
    });

    it('should correctly report hasRecentSearches', () => {
      const { result } = renderHook(() => useRecentSearches());
      
      expect(result.current.hasRecentSearches).toBe(false);

      act(() => {
        result.current.addRecentSearch('test');
      });

      expect(result.current.hasRecentSearches).toBe(true);

      act(() => {
        result.current.clearAllRecentSearches();
      });

      expect(result.current.hasRecentSearches).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid successive additions', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addRecentSearch(`rapid${i}`);
        }
      });

      expect(result.current.recentSearches).toHaveLength(5);
      expect(result.current.recentSearches[0]).toBe('rapid9');
    });

    it('should handle mixed valid and invalid operations', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addRecentSearch('valid1');
        result.current.addRecentSearch('');
        result.current.addRecentSearch('valid2');
        result.current.removeRecentSearch(null);
        result.current.addRecentSearch('   ');
        result.current.addRecentSearch('valid3');
      });

      expect(result.current.recentSearches).toEqual(['valid3', 'valid2', 'valid1']);
    });
  });
});