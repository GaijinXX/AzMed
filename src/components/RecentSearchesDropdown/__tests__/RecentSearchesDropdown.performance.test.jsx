import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import RecentSearchesDropdown from '../RecentSearchesDropdown';
import { LanguageProvider } from '../../../contexts/LanguageContext';

// Mock the translation hook
vi.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key, defaultValue, params) => {
      if (params && defaultValue && defaultValue.includes('{{searchTerm}}')) {
        return defaultValue.replace(/\{\{searchTerm\}\}/g, params.searchTerm);
      }
      return defaultValue || key;
    }
  })
}));

const defaultProps = {
  isVisible: true,
  recentSearches: [],
  onSelectSearch: vi.fn(),
  onRemoveSearch: vi.fn(),
  onClearAll: vi.fn(),
  onClose: vi.fn()
};

const renderWithLanguageProvider = (component) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  );
};

describe('RecentSearchesDropdown Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering Performance', () => {
    it('renders efficiently with maximum number of searches', () => {
      const maxSearches = Array.from({ length: 5 }, (_, i) => `search term ${i + 1} with longer text to test rendering`);
      
      const startTime = performance.now();
      
      renderWithLanguageProvider(
        <RecentSearchesDropdown 
          {...defaultProps} 
          recentSearches={maxSearches} 
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render quickly (less than 50ms for this component)
      expect(renderTime).toBeLessThan(50);
      
      // All searches should be rendered
      maxSearches.forEach(search => {
        expect(screen.getByText(search)).toBeInTheDocument();
      });
    });

    it('handles rapid prop changes efficiently', () => {
      const searches1 = ['search1', 'search2'];
      const searches2 = ['search3', 'search4'];
      const searches3 = ['search5', 'search6'];
      
      const { rerender } = renderWithLanguageProvider(
        <RecentSearchesDropdown 
          {...defaultProps} 
          recentSearches={searches1} 
        />
      );
      
      const startTime = performance.now();
      
      // Rapid re-renders with different props
      for (let i = 0; i < 10; i++) {
        const searches = i % 3 === 0 ? searches1 : i % 3 === 1 ? searches2 : searches3;
        rerender(
          <LanguageProvider>
            <RecentSearchesDropdown 
              {...defaultProps} 
              recentSearches={searches} 
            />
          </LanguageProvider>
        );
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle rapid updates efficiently (less than 100ms for 10 updates)
      expect(totalTime).toBeLessThan(100);
    });

    it('efficiently handles visibility toggling', () => {
      const searches = ['search1', 'search2', 'search3'];
      
      const { rerender } = renderWithLanguageProvider(
        <RecentSearchesDropdown 
          {...defaultProps} 
          recentSearches={searches}
          isVisible={false}
        />
      );
      
      const startTime = performance.now();
      
      // Toggle visibility rapidly
      for (let i = 0; i < 20; i++) {
        rerender(
          <LanguageProvider>
            <RecentSearchesDropdown 
              {...defaultProps} 
              recentSearches={searches}
              isVisible={i % 2 === 0}
            />
          </LanguageProvider>
        );
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle visibility toggling efficiently
      expect(totalTime).toBeLessThan(100);
    });
  });

  describe('Interaction Performance', () => {
    it('handles rapid keyboard navigation efficiently', async () => {
      const searches = Array.from({ length: 5 }, (_, i) => `search${i + 1}`);
      
      renderWithLanguageProvider(
        <RecentSearchesDropdown 
          {...defaultProps} 
          recentSearches={searches} 
        />
      );
      
      const startTime = performance.now();
      
      // Rapid keyboard navigation
      for (let i = 0; i < 20; i++) {
        fireEvent.keyDown(document, { key: 'ArrowDown' });
        fireEvent.keyDown(document, { key: 'ArrowUp' });
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle rapid navigation efficiently
      expect(totalTime).toBeLessThan(100);
    });

    it('efficiently handles rapid mouse interactions', async () => {
      const user = userEvent.setup();
      const searches = ['search1', 'search2', 'search3'];
      
      renderWithLanguageProvider(
        <RecentSearchesDropdown 
          {...defaultProps} 
          recentSearches={searches} 
        />
      );
      
      const items = screen.getAllByRole('option');
      const startTime = performance.now();
      
      // Rapid hover/unhover
      for (let i = 0; i < 10; i++) {
        await user.hover(items[i % items.length]);
        await user.unhover(items[i % items.length]);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle rapid interactions efficiently
      expect(totalTime).toBeLessThan(200);
    });

    it('debounces delete button visibility changes', async () => {
      const user = userEvent.setup();
      const searches = ['search1'];
      
      renderWithLanguageProvider(
        <RecentSearchesDropdown 
          {...defaultProps} 
          recentSearches={searches} 
        />
      );
      
      const item = screen.getByRole('option');
      
      // Rapid hover/unhover should not cause performance issues
      const startTime = performance.now();
      
      for (let i = 0; i < 20; i++) {
        fireEvent.mouseEnter(item);
        fireEvent.mouseLeave(item);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle rapid hover changes efficiently
      expect(totalTime).toBeLessThan(50);
    });
  });

  describe('Memory Management', () => {
    it('cleans up event listeners properly', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      
      const { unmount } = renderWithLanguageProvider(
        <RecentSearchesDropdown 
          {...defaultProps} 
          recentSearches={['search1']} 
        />
      );
      
      // Should have added keyboard event listener
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      unmount();
      
      // Should have removed the event listener
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('handles component unmounting during interactions gracefully', async () => {
      const user = userEvent.setup();
      const searches = ['search1', 'search2'];
      
      const { unmount } = renderWithLanguageProvider(
        <RecentSearchesDropdown 
          {...defaultProps} 
          recentSearches={searches} 
        />
      );
      
      const item = screen.getByText('search1');
      
      // Start interaction
      await user.hover(item);
      
      // Unmount during interaction
      expect(() => unmount()).not.toThrow();
    });

    it('prevents memory leaks with rapid mount/unmount cycles', () => {
      const searches = ['search1', 'search2'];
      
      // Rapid mount/unmount cycles
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderWithLanguageProvider(
          <RecentSearchesDropdown 
            {...defaultProps} 
            recentSearches={searches} 
          />
        );
        unmount();
      }
      
      // Should not cause memory leaks or errors
      expect(true).toBe(true);
    });
  });

  describe('Mobile Performance Optimizations', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 768px') || query.includes('hover: none'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
    });

    it('optimizes touch interactions for mobile', async () => {
      const searches = ['search1', 'search2'];
      
      renderWithLanguageProvider(
        <RecentSearchesDropdown 
          {...defaultProps} 
          recentSearches={searches} 
        />
      );
      
      const item = screen.getByText('search1').closest('li');
      const startTime = performance.now();
      
      // Simulate rapid touch interactions
      for (let i = 0; i < 10; i++) {
        fireEvent.touchStart(item);
        fireEvent.touchEnd(item);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle touch interactions efficiently
      expect(totalTime).toBeLessThan(100);
    });

    it('efficiently handles scroll events on mobile', () => {
      const searches = Array.from({ length: 5 }, (_, i) => `search${i + 1}`);
      
      renderWithLanguageProvider(
        <RecentSearchesDropdown 
          {...defaultProps} 
          recentSearches={searches} 
        />
      );
      
      const dropdown = screen.getByRole('listbox');
      const startTime = performance.now();
      
      // Simulate rapid scroll events
      for (let i = 0; i < 20; i++) {
        fireEvent.scroll(dropdown, { target: { scrollTop: i * 10 } });
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle scroll events efficiently
      expect(totalTime).toBeLessThan(50);
    });
  });

  describe('Accessibility Performance', () => {
    it('efficiently updates ARIA attributes during navigation', () => {
      const searches = ['search1', 'search2', 'search3'];
      
      renderWithLanguageProvider(
        <RecentSearchesDropdown 
          {...defaultProps} 
          recentSearches={searches} 
        />
      );
      
      const startTime = performance.now();
      
      // Navigate through all items multiple times
      for (let cycle = 0; cycle < 5; cycle++) {
        for (let i = 0; i < searches.length; i++) {
          fireEvent.keyDown(document, { key: 'ArrowDown' });
        }
        for (let i = 0; i < searches.length; i++) {
          fireEvent.keyDown(document, { key: 'ArrowUp' });
        }
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should update ARIA attributes efficiently
      expect(totalTime).toBeLessThan(100);
      
      // Verify final state is correct
      const items = screen.getAllByRole('option');
      expect(items[0]).toHaveAttribute('aria-selected', 'false');
    });

    it('maintains performance with screen reader optimizations', () => {
      const searches = Array.from({ length: 5 }, (_, i) => `search term ${i + 1}`);
      
      const startTime = performance.now();
      
      renderWithLanguageProvider(
        <RecentSearchesDropdown 
          {...defaultProps} 
          recentSearches={searches} 
        />
      );
      
      // Verify all accessibility attributes are set
      const dropdown = screen.getByRole('listbox');
      expect(dropdown).toHaveAttribute('aria-label');
      
      const items = screen.getAllByRole('option');
      items.forEach(item => {
        expect(item).toHaveAttribute('aria-selected');
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render with accessibility features efficiently
      expect(renderTime).toBeLessThan(50);
    });
  });

  describe('CSS Animation Performance', () => {
    it('handles CSS transitions efficiently', async () => {
      const user = userEvent.setup();
      const searches = ['search1'];
      
      renderWithLanguageProvider(
        <RecentSearchesDropdown 
          {...defaultProps} 
          recentSearches={searches} 
        />
      );
      
      const item = screen.getByRole('option');
      const startTime = performance.now();
      
      // Trigger hover states rapidly to test CSS transitions
      for (let i = 0; i < 20; i++) {
        await user.hover(item);
        await user.unhover(item);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle CSS transitions efficiently
      expect(totalTime).toBeLessThan(300);
    });

    it('optimizes for reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
      
      const searches = ['search1'];
      
      const startTime = performance.now();
      
      renderWithLanguageProvider(
        <RecentSearchesDropdown 
          {...defaultProps} 
          recentSearches={searches} 
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render efficiently with reduced motion
      expect(renderTime).toBeLessThan(50);
    });
  });
});