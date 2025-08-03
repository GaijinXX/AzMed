import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import LanguageSelector from '../LanguageSelector';
import { LanguageProvider } from '../../../contexts/LanguageContext';

// Mock the translation hook
vi.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'language.selector': 'Language',
        'language.english': 'English',
        'language.azeri': 'Azərbaycan',
        'language.russian': 'Русский'
      };
      return translations[key] || key;
    }
  })
}));

// Create a mock language context with state
let mockCurrentLanguage = 'en';
const mockSetLanguage = vi.fn((lang) => {
  mockCurrentLanguage = lang;
});

// Mock the language context hook
vi.mock('../../../contexts/LanguageContext', () => ({
  useLanguageContext: () => ({
    currentLanguage: mockCurrentLanguage,
    setLanguage: mockSetLanguage,
    t: (key) => {
      const translations = {
        'language.selector': 'Language',
        'language.english': 'English',
        'language.azeri': 'Azərbaycan',
        'language.russian': 'Русский'
      };
      return translations[key] || key;
    }
  }),
  LanguageProvider: ({ children }) => children
}));

// Test wrapper component
const TestWrapper = ({ children }) => (
  <div>
    {children}
  </div>
);

describe('LanguageSelector', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    // Reset mock language
    mockCurrentLanguage = 'en';
    mockSetLanguage.mockClear();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with default English language', () => {
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /language: english/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('displays correct flag and label for current language', () => {
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      expect(screen.getByText('🇺🇸')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
    });

    it('renders with different language when mock is updated', () => {
      // Update mock language
      mockCurrentLanguage = 'az';
      
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      expect(screen.getByText('🇦🇿')).toBeInTheDocument();
      expect(screen.getByText('Azərbaycan')).toBeInTheDocument();
      
      // Reset mock
      mockCurrentLanguage = 'en';
    });
  });

  describe('Dropdown Functionality', () => {
    it('opens dropdown when button is clicked', async () => {
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /language: english/i });
      await user.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('listbox', { name: /language options/i })).toBeInTheDocument();
    });

    it('displays all language options in dropdown', async () => {
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /language: english/i });
      await user.click(button);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);

      expect(screen.getByRole('option', { name: /english/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /azərbaycan/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /русский/i })).toBeInTheDocument();
    });

    it('shows checkmark for currently selected language', async () => {
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /language: english/i });
      await user.click(button);

      const englishOption = screen.getByRole('option', { name: /english/i });
      expect(englishOption).toHaveAttribute('aria-selected', 'true');
      expect(englishOption).toHaveTextContent('✓');
    });

    it('closes dropdown when option is selected', async () => {
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /language: english/i });
      await user.click(button);

      const azeriOption = screen.getByRole('option', { name: /azərbaycan/i });
      await user.click(azeriOption);

      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('closes dropdown when clicking outside', async () => {
      render(
        <div>
          <TestWrapper>
            <LanguageSelector />
          </TestWrapper>
          <div data-testid="outside">Outside element</div>
        </div>
      );

      const button = screen.getByRole('button', { name: /language: english/i });
      await user.click(button);

      expect(screen.getByRole('listbox')).toBeInTheDocument();

      const outsideElement = screen.getByTestId('outside');
      fireEvent.mouseDown(outsideElement);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Language Selection', () => {
    it('calls setLanguage when option is selected', async () => {
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /language: english/i });
      await user.click(button);

      const azeriOption = screen.getByRole('option', { name: /azərbaycan/i });
      await user.click(azeriOption);

      expect(mockSetLanguage).toHaveBeenCalledWith('az');
    });

    it('calls setLanguage with correct language code', async () => {
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /language: english/i });
      await user.click(button);

      const russianOption = screen.getByRole('option', { name: /русский/i });
      await user.click(russianOption);

      expect(mockSetLanguage).toHaveBeenCalledWith('ru');
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens dropdown with Enter key', async () => {
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /language: english/i });
      button.focus();
      await user.keyboard('{Enter}');

      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('opens dropdown with Space key', async () => {
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /language: english/i });
      button.focus();
      await user.keyboard(' ');

      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('closes dropdown with Escape key', async () => {
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /language: english/i });
      await user.click(button);

      expect(screen.getByRole('listbox')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('navigates options with arrow keys', async () => {
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /language: english/i });
      button.focus();
      await user.keyboard('{ArrowDown}');

      expect(screen.getByRole('listbox')).toBeInTheDocument();

      // Test arrow navigation within options
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowUp}');
    });

    it('selects option with Enter key', async () => {
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /language: english/i });
      await user.click(button);

      const azeriOption = screen.getByRole('option', { name: /azərbaycan/i });
      azeriOption.focus();
      await user.keyboard('{Enter}');

      expect(mockSetLanguage).toHaveBeenCalledWith('az');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /language: english/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-haspopup', 'listbox');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('has proper ARIA attributes for dropdown options', async () => {
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /language: english/i });
      await user.click(button);

      const options = screen.getAllByRole('option');
      options.forEach((option, index) => {
        expect(option).toHaveAttribute('role', 'option');
        expect(option).toHaveAttribute('type', 'button');
        expect(option).toHaveAttribute('data-language');
        
        if (index === 0) { // English option should be selected by default
          expect(option).toHaveAttribute('aria-selected', 'true');
        } else {
          expect(option).toHaveAttribute('aria-selected', 'false');
        }
      });
    });

    it('has proper tabindex for dropdown options', async () => {
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /language: english/i });
      await user.click(button);

      const options = screen.getAllByRole('option');
      options.forEach(option => {
        expect(option).toHaveAttribute('tabIndex', '0');
      });
    });

    it('has aria-hidden attributes for decorative elements', () => {
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const flagIcon = screen.getByText('🇺🇸');
      const dropdownArrow = screen.getByText('▼');

      expect(flagIcon).toHaveAttribute('aria-hidden', 'true');
      expect(dropdownArrow).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Error Handling', () => {
    it('handles missing translation gracefully', () => {
      // Mock useTranslation to return undefined for some keys
      vi.doMock('../../../hooks/useTranslation', () => ({
        useTranslation: () => ({
          t: (key) => {
            if (key === 'language.english') return undefined;
            const translations = {
              'language.selector': 'Language',
              'language.azeri': 'Azərbaycan',
              'language.russian': 'Русский'
            };
            return translations[key] || key;
          }
        })
      }));

      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      // Should still render without crashing
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('applies mobile styles correctly', () => {
      // This test would require more complex setup to test CSS media queries
      // For now, we'll just verify the component renders
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});