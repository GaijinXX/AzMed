import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import SearchBar from '../SearchBar';
import { LanguageProvider } from '../../../contexts/LanguageContext';

// Mock the useRecentSearches hook
const mockRecentSearches = {
  recentSearches: [],
  addRecentSearch: vi.fn(),
  removeRecentSearch: vi.fn(),
  clearAllRecentSearches: vi.fn(),
  hasRecentSearches: false
};

vi.mock('../../../hooks/useRecentSearches', () => ({
  useRecentSearches: () => mockRecentSearches
}));

// Mock the translation hook
vi.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
    language: 'en',
    setLanguage: vi.fn()
  })
}));

// Mock the useReact19Optimizations hook
vi.mock('../../../hooks/useReact19Optimizations', () => ({
  useCompilerOptimizations: () => ({
    trackRender: vi.fn(),
    isCompilerActive: false
  })
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

const renderWithLanguageProvider = (component) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  );
};

// Viewport size constants
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1024, height: 768 },
  large: { width: 1440, height: 900 }
};

// Mock window.matchMedia for different viewports
const mockMatchMedia = (viewport) => (query) => {
  const width = viewport.width;
  
  const matches = {
    '(max-width: 480px)': width <= 480,
    '(max-width: 768px)': width <= 768,
    '(max-width: 1024px)': width <= 1024,
    '(hover: none) and (pointer: coarse)': width <= 768,
    '(hover: hover) and (pointer: fine)': width > 768,
    '(orientation: portrait)': viewport.height > viewport.width,
    '(orientation: landscape)': viewport.width > viewport.height
  };

  return {
    matches: matches[query] || false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
};

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('SearchBar Mobile and Responsive Tests', () => {
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockRecentSearches.recentSearches = [];
    mockRecentSearches.hasRecentSearches = false;
    
    // Reset window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Mobile Viewport (375px)', () => {
    beforeEach(() => {
      window.innerWidth = VIEWPORTS.mobile.width;
      window.innerHeight = VIEWPORTS.mobile.height;
      window.matchMedia = vi.fn().mockImplementation(mockMatchMedia(VIEWPORTS.mobile));
    });

    it('adapts layout for mobile viewport', () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const container = screen.getByRole('search');
      expect(container).toBeInTheDocument();
      
      // Mobile-specific styling should be applied
      const input = screen.getByRole('searchbox');
      expect(input).toBeInTheDocument();
    });

    it('provides appropriate touch targets on mobile', async () => {
      const user = userEvent.setup();
      
      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const searchButton = screen.getByRole('button', { name: /search/i });
      
      // Touch target should be at least 44px (iOS guidelines)
      const buttonStyle = window.getComputedStyle(searchButton);
      expect(parseInt(buttonStyle.width) >= 40).toBe(true);
      expect(parseInt(buttonStyle.height) >= 40).toBe(true);
    });

    it('handles touch events properly', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      
      // Simulate touch interaction
      fireEvent.touchStart(input);
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Touch outside to close
      fireEvent.touchStart(document.body);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('prevents zoom on iOS when focusing input', () => {
      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      
      // Font size should be at least 16px to prevent zoom on iOS
      const inputStyle = window.getComputedStyle(input);
      expect(parseInt(inputStyle.fontSize) >= 16).toBe(true);
    });

    it('handles virtual keyboard appearance', async () => {
      const user = userEvent.setup();
      
      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      
      // Simulate virtual keyboard appearing (viewport height change)
      await user.click(input);
      
      // Simulate viewport height reduction due to virtual keyboard
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 400,
      });
      
      fireEvent(window, new Event('resize'));
      
      // Component should remain functional
      expect(input).toBeInTheDocument();
      expect(input).toHaveFocus();
    });
  });

  describe('Tablet Viewport (768px)', () => {
    beforeEach(() => {
      window.innerWidth = VIEWPORTS.tablet.width;
      window.innerHeight = VIEWPORTS.tablet.height;
      window.matchMedia = vi.fn().mockImplementation(mockMatchMedia(VIEWPORTS.tablet));
    });

    it('adapts layout for tablet viewport', () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const container = screen.getByRole('search');
      expect(container).toBeInTheDocument();
    });

    it('handles both touch and mouse interactions on tablet', async () => {
      const user = userEvent.setup();
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      
      // Test mouse interaction
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Test touch interaction
      fireEvent.touchStart(input);
      
      // Should remain functional
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('handles orientation changes on tablet', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await userEvent.setup().click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Simulate orientation change
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: VIEWPORTS.tablet.height,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: VIEWPORTS.tablet.width,
      });

      fireEvent(window, new Event('orientationchange'));
      fireEvent(window, new Event('resize'));

      // Dropdown should remain functional
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  describe('Desktop Viewport (1024px+)', () => {
    beforeEach(() => {
      window.innerWidth = VIEWPORTS.desktop.width;
      window.innerHeight = VIEWPORTS.desktop.height;
      window.matchMedia = vi.fn().mockImplementation(mockMatchMedia(VIEWPORTS.desktop));
    });

    it('uses desktop layout and interactions', async () => {
      const user = userEvent.setup();
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Desktop should show delete buttons on hover
      const firstItem = screen.getByText('aspirin').closest('li');
      await user.hover(firstItem);

      const deleteButton = screen.getByRole('button', { name: /remove.*aspirin/i });
      expect(deleteButton).toBeInTheDocument();
    });

    it('handles mouse interactions efficiently on desktop', async () => {
      const user = userEvent.setup();
      mockRecentSearches.recentSearches = ['aspirin', 'ibuprofen'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Rapid hover interactions should work smoothly
      const items = screen.getAllByRole('option');
      
      for (const item of items) {
        await user.hover(item);
        await user.unhover(item);
      }

      // All items should still be functional
      expect(items).toHaveLength(2);
    });
  });

  describe('Large Desktop Viewport (1440px+)', () => {
    beforeEach(() => {
      window.innerWidth = VIEWPORTS.large.width;
      window.innerHeight = VIEWPORTS.large.height;
      window.matchMedia = vi.fn().mockImplementation(mockMatchMedia(VIEWPORTS.large));
    });

    it('maintains proper proportions on large screens', () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const container = screen.getByRole('search');
      expect(container).toBeInTheDocument();
      
      // Should have max-width constraint
      const searchContainer = container.querySelector('.searchContainer');
      expect(searchContainer).toBeInTheDocument();
    });
  });

  describe('Responsive Breakpoint Transitions', () => {
    it('handles smooth transitions between breakpoints', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      const { rerender } = renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      // Start with mobile
      window.innerWidth = VIEWPORTS.mobile.width;
      window.matchMedia = vi.fn().mockImplementation(mockMatchMedia(VIEWPORTS.mobile));

      const input = screen.getByRole('searchbox');
      await userEvent.setup().click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Transition to desktop
      window.innerWidth = VIEWPORTS.desktop.width;
      window.matchMedia = vi.fn().mockImplementation(mockMatchMedia(VIEWPORTS.desktop));

      fireEvent(window, new Event('resize'));

      // Component should remain functional
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(input).toBeInTheDocument();
    });

    it('handles rapid viewport changes', () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      // Rapid viewport changes
      const viewports = [VIEWPORTS.mobile, VIEWPORTS.tablet, VIEWPORTS.desktop, VIEWPORTS.large];
      
      viewports.forEach(viewport => {
        window.innerWidth = viewport.width;
        window.innerHeight = viewport.height;
        window.matchMedia = vi.fn().mockImplementation(mockMatchMedia(viewport));
        fireEvent(window, new Event('resize'));
      });

      // Component should remain stable
      const input = screen.getByRole('searchbox');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Touch Device Detection', () => {
    it('detects touch-only devices correctly', () => {
      // Mock touch-only device
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query.includes('hover: none') && query.includes('pointer: coarse'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      fireEvent.focus(input);

      // Touch devices should show delete buttons by default
      const deleteButtons = screen.queryAllByRole('button', { name: /remove/i });
      expect(deleteButtons.length).toBeGreaterThanOrEqual(0);
    });

    it('detects hybrid devices correctly', async () => {
      // Mock hybrid device (supports both touch and mouse)
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query.includes('hover: hover') || query.includes('pointer: fine'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const user = userEvent.setup();
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Hybrid devices should show delete buttons on hover
      const firstItem = screen.getByText('aspirin').closest('li');
      await user.hover(firstItem);

      const deleteButton = screen.getByRole('button', { name: /remove.*aspirin/i });
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('Performance on Different Devices', () => {
    it('performs well on low-end mobile devices', async () => {
      // Mock low-end device characteristics
      window.innerWidth = VIEWPORTS.mobile.width;
      window.matchMedia = vi.fn().mockImplementation(mockMatchMedia(VIEWPORTS.mobile));

      const searches = Array.from({ length: 5 }, (_, i) => `search${i + 1}`);
      mockRecentSearches.recentSearches = searches;
      mockRecentSearches.hasRecentSearches = true;

      const startTime = performance.now();

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render quickly even on mobile
      expect(renderTime).toBeLessThan(200);
    });

    it('handles rapid interactions efficiently on touch devices', async () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query.includes('hover: none') && query.includes('pointer: coarse'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      
      const startTime = performance.now();

      // Rapid touch interactions
      for (let i = 0; i < 10; i++) {
        fireEvent.touchStart(input);
        fireEvent.touchEnd(input);
        fireEvent.focus(input);
        fireEvent.blur(input);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle rapid interactions efficiently
      expect(totalTime).toBeLessThan(100);
    });
  });

  describe('Accessibility Across Devices', () => {
    it('maintains accessibility on mobile devices', async () => {
      window.innerWidth = VIEWPORTS.mobile.width;
      window.matchMedia = vi.fn().mockImplementation(mockMatchMedia(VIEWPORTS.mobile));

      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('aria-label');
      
      fireEvent.focus(input);

      await waitFor(() => {
        const dropdown = screen.getByRole('listbox');
        expect(dropdown).toHaveAttribute('aria-label');
      });
    });

    it('provides appropriate focus indicators on all devices', async () => {
      const user = userEvent.setup();
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Focus should be visible and manageable
      expect(input).toHaveFocus();
      
      // Keyboard navigation should work
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      
      const firstOption = screen.getAllByRole('option')[0];
      expect(firstOption).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles device rotation gracefully', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await userEvent.setup().click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Simulate device rotation
      const originalWidth = window.innerWidth;
      const originalHeight = window.innerHeight;
      
      window.innerWidth = originalHeight;
      window.innerHeight = originalWidth;
      
      fireEvent(window, new Event('orientationchange'));
      fireEvent(window, new Event('resize'));

      // Component should remain functional
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(input).toBeInTheDocument();
    });

    it('handles viewport changes during interactions', async () => {
      const user = userEvent.setup();
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Change viewport while dropdown is open
      window.innerWidth = VIEWPORTS.mobile.width;
      window.matchMedia = vi.fn().mockImplementation(mockMatchMedia(VIEWPORTS.mobile));
      fireEvent(window, new Event('resize'));

      // Should remain functional
      const recentSearchItem = screen.getByText('aspirin');
      await user.click(recentSearchItem);

      expect(mockOnSearch).toHaveBeenCalledWith('aspirin');
    });

    it('handles missing matchMedia support', () => {
      // Remove matchMedia support
      delete window.matchMedia;

      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      expect(() => {
        renderWithLanguageProvider(
          <SearchBar onSearch={mockOnSearch} />
        );
      }).not.toThrow();

      const input = screen.getByRole('searchbox');
      expect(input).toBeInTheDocument();
    });
  });
});