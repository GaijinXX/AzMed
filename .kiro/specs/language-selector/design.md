# Design Document

## Overview

The language selector feature will add internationalization (i18n) support to the Azerbaijan drug database application. The implementation will follow the existing ThemeSelector component's design patterns to ensure UI consistency while providing a robust translation system that can easily scale to support additional languages in the future.

## Architecture

### Component Structure
```
src/
├── components/
│   └── LanguageSelector/
│       ├── LanguageSelector.jsx          # Main component
│       ├── LanguageSelector.module.css   # Component styles
│       ├── __tests__/
│       │   └── LanguageSelector.test.jsx # Unit tests
│       └── index.js                      # Export file
├── contexts/
│   └── LanguageContext.jsx               # React context for language state
├── hooks/
│   └── useTranslation.js                 # Custom hook for translations
└── translations/
    ├── index.js                          # Translation loader
    ├── en.js                            # English translations
    ├── az.js                            # Azeri translations
    └── ru.js                            # Russian translations
```

### State Management
- **Language Context**: Provides global language state using React Context API
- **localStorage Persistence**: Stores user's language preference across sessions
- **Default Language**: English serves as the default and fallback language
- **Optimistic Updates**: Immediate UI feedback using React 19 optimizations

## Components and Interfaces

### LanguageSelector Component
```jsx
// Core component interface
const LanguageSelector = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en')
  const [isOpen, setIsOpen] = useState(false)
  
  // Handles language change with persistence
  const handleLanguageChange = (languageCode) => { ... }
  
  // Dropdown toggle functionality
  const toggleDropdown = () => { ... }
  
  // Keyboard navigation support
  const handleKeyDown = (e) => { ... }
}
```

### LanguageContext
```jsx
// Context for global language state
const LanguageContext = createContext({
  currentLanguage: 'en',
  setLanguage: () => {},
  t: () => '', // Translation function
  isLoading: false
})

const LanguageProvider = ({ children }) => {
  // Language state management
  // Translation loading logic
  // localStorage persistence
}
```

### useTranslation Hook
```jsx
// Custom hook for component translations
const useTranslation = () => {
  const { currentLanguage, t } = useContext(LanguageContext)
  
  return {
    t, // Translation function
    currentLanguage,
    isRTL: currentLanguage === 'ar' // Future RTL support
  }
}
```

## Data Models

### Language Configuration
```javascript
const LANGUAGES = {
  EN: 'en',
  AZ: 'az', 
  RU: 'ru'
}

const LANGUAGE_LABELS = {
  [LANGUAGES.EN]: 'English',
  [LANGUAGES.AZ]: 'Azərbaycan',
  [LANGUAGES.RU]: 'Русский'
}

const LANGUAGE_FLAGS = {
  [LANGUAGES.EN]: '🇺🇸',
  [LANGUAGES.AZ]: '🇦🇿',
  [LANGUAGES.RU]: '🇷🇺'
}
```

### Translation Structure
```javascript
// Translation file structure (e.g., en.js)
export default {
  common: {
    search: 'Search',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Try Again'
  },
  header: {
    title: 'Azerbaijan Drug Database',
    subtitle: 'Search and browse all officially registered drugs in Azerbaijan'
  },
  table: {
    headers: {
      number: 'Registration #',
      product_name: 'Product Name',
      active_ingredients: 'Active Ingredients',
      // ... other headers
    }
  },
  pagination: {
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    of: 'of'
  }
}
```

## Integration Points

### App Component Integration
The LanguageSelector will be integrated into the App component header alongside the existing ThemeSelector:

```jsx
// In App.jsx header-controls section
<div className="header-controls">
  <LanguageSelector />
  <ThemeSelector />
</div>
```

### Component Translation Updates
All existing components will be updated to use the translation system:

```jsx
// Example component update
const SearchBar = ({ onSearch, placeholder, ...props }) => {
  const { t } = useTranslation()
  
  return (
    <input 
      placeholder={t('search.placeholder')}
      aria-label={t('search.ariaLabel')}
      // ... other props
    />
  )
}
```

## Error Handling

### Translation Fallbacks
- **Missing Translation**: Falls back to English translation
- **Missing Key**: Returns the translation key as fallback
- **Loading Errors**: Shows error message in current language with retry option

### Error Boundaries
- Wrap LanguageProvider in error boundary to handle context failures
- Graceful degradation to English if translation system fails
- User-friendly error messages for translation loading failures

### Validation
- Validate language codes against supported languages
- Handle invalid localStorage values gracefully
- Sanitize translation keys to prevent XSS attacks

## Testing Strategy

### Unit Tests
- **LanguageSelector Component**: Dropdown functionality, keyboard navigation, accessibility
- **LanguageContext**: State management, persistence, error handling
- **useTranslation Hook**: Translation function, fallback behavior
- **Translation Loading**: File loading, error handling, caching

### Integration Tests
- **Language Switching**: End-to-end language change flow
- **Persistence**: localStorage save/load functionality
- **Component Updates**: Verify all components update when language changes
- **Fallback Behavior**: Test missing translations and error scenarios

### Accessibility Tests
- **Screen Reader**: ARIA labels and announcements in multiple languages
- **Keyboard Navigation**: Tab order and keyboard shortcuts
- **High Contrast**: Visual indicators work in high contrast mode
- **Language Announcements**: Screen reader announces language changes

### Performance Tests
- **Translation Loading**: Measure translation file load times
- **Memory Usage**: Monitor memory consumption with multiple languages
- **Render Performance**: Ensure language changes don't cause performance issues
- **Bundle Size**: Verify translation files don't significantly increase bundle size

## Styling and Visual Design

### Design Consistency
The LanguageSelector will mirror the ThemeSelector's visual design:
- Same button styling and dimensions
- Identical dropdown positioning and animation
- Consistent hover and focus states
- Matching color scheme and typography

### Responsive Behavior
- **Desktop**: Positioned in header-controls alongside ThemeSelector
- **Mobile**: Included in mobile-theme-selector section above header
- **Tablet**: Follows mobile layout pattern for consistency

### Visual Indicators
- **Flag Icons**: Country flags for visual language identification
- **Native Labels**: Language names in their native scripts
- **Active State**: Checkmark indicator for currently selected language
- **Loading State**: Subtle loading indicator during language switching

## Performance Considerations

### Translation Loading
- **Lazy Loading**: Load translation files only when needed
- **Caching**: Cache loaded translations in memory
- **Code Splitting**: Separate translation files from main bundle
- **Compression**: Minimize translation file sizes

### React 19 Optimizations
- **Concurrent Features**: Use startTransition for language changes
- **Optimistic Updates**: Immediate UI feedback during language switching
- **Batch Updates**: Group related state updates together
- **Memory Management**: Proper cleanup of translation resources

### Bundle Optimization
- **Tree Shaking**: Remove unused translation keys
- **Compression**: Gzip translation files
- **CDN Delivery**: Serve translation files from CDN if needed
- **Preloading**: Preload likely-to-be-used languages

## Security Considerations

### Input Validation
- Validate language codes against whitelist
- Sanitize translation keys to prevent injection
- Validate localStorage values before use

### XSS Prevention
- Escape translation values when rendering
- Use React's built-in XSS protection
- Validate translation file integrity

### Data Privacy
- No sensitive data in translation files
- Respect user's language preference privacy
- Clear language preference on data clearing requests