import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import RecentSearchesDropdown from '../RecentSearchesDropdown';
import { LanguageProvider } from '../../../contexts/LanguageContext';

// Mock the translation hook
vi.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key
  })
}));

const defaultProps = {
  isVisible: true,
  recentSearches: ['aspirin', 'ibuprofen'],
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

describe('RecentSearchesDropdown Hooks Order Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle visibility changes without hooks order errors', () => {
    const { rerender } = renderWithLanguageProvider(
      <RecentSearchesDropdown {...defaultProps} isVisible={false} />
    );

    // Should not render when not visible
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    // Make visible - this should not cause hooks order errors
    rerender(
      <LanguageProvider>
        <RecentSearchesDropdown {...defaultProps} isVisible={true} />
      </LanguageProvider>
    );

    // Should render when visible
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Make invisible again - this should not cause hooks order errors
    rerender(
      <LanguageProvider>
        <RecentSearchesDropdown {...defaultProps} isVisible={false} />
      </LanguageProvider>
    );

    // Should not render when not visible
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should handle empty searches without hooks order errors', () => {
    const { rerender } = renderWithLanguageProvider(
      <RecentSearchesDropdown {...defaultProps} recentSearches={[]} />
    );

    // Should not render when no searches
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    // Add searches - this should not cause hooks order errors
    rerender(
      <LanguageProvider>
        <RecentSearchesDropdown {...defaultProps} recentSearches={['aspirin']} />
      </LanguageProvider>
    );

    // Should render when searches exist
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Remove searches again - this should not cause hooks order errors
    rerender(
      <LanguageProvider>
        <RecentSearchesDropdown {...defaultProps} recentSearches={[]} />
      </LanguageProvider>
    );

    // Should not render when no searches
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should handle rapid prop changes without hooks order errors', () => {
    const { rerender } = renderWithLanguageProvider(
      <RecentSearchesDropdown {...defaultProps} />
    );

    // Rapid changes that previously caused hooks order errors
    for (let i = 0; i < 5; i++) {
      rerender(
        <LanguageProvider>
          <RecentSearchesDropdown 
            {...defaultProps} 
            isVisible={i % 2 === 0}
            recentSearches={i % 2 === 0 ? ['search1', 'search2'] : []}
          />
        </LanguageProvider>
      );
    }

    // Should not throw any errors
    expect(true).toBe(true);
  });
});