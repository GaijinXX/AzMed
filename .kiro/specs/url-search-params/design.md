# Design Document

## Overview

This design implements URL-based state management for the Azerbaijan Drug Database application, enabling users to bookmark, share, and directly access specific search results. The solution leverages the browser's native URL and History APIs to synchronize application state with the URL, providing a seamless user experience while maintaining performance and accessibility.

The design integrates with the existing React 19 optimizations, state management patterns, and component architecture without requiring external routing libraries.

## Architecture

### URL State Management Strategy

The application will use a centralized URL state management approach with the following key components:

1. **URLStateManager**: A custom hook that manages URL synchronization
2. **URL Parameter Schema**: Standardized parameter names and encoding
3. **State Synchronization**: Bidirectional sync between URL and application state
4. **History Management**: Browser history integration with back/forward support

### URL Parameter Schema

```
Base URL: https://example.com/
Search URL: https://example.com/?q=aspirin&page=2&sort=product_name&dir=asc&cols=number,product_name,retail_price
```

**Parameter Definitions:**
- `q`: Search query string (URL encoded)
- `page`: Current page number (omitted if page 1)
- `size`: Page size (omitted if default 10)
- `sort`: Sort column key (omitted if no sorting)
- `dir`: Sort direction ('asc' or 'desc', omitted if 'asc')
- `cols`: Comma-separated visible column keys (omitted if default columns)

### State Flow Architecture

```
User Action → URL Update → State Sync → Component Re-render → API Call
     ↑                                                            ↓
Browser Navigation ← History API ← URL Change Detection ← Response
```

## Components and Interfaces

### Core Hook: useURLState

```javascript
interface URLStateConfig {
  searchText: string;
  currentPage: number;
  pageSize: number;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  visibleColumns: Record<string, boolean>;
}

interface URLStateReturn {
  urlState: URLStateConfig;
  updateURL: (partialState: Partial<URLStateConfig>) => void;
  replaceURL: (fullState: URLStateConfig) => void;
  isURLLoading: boolean;
}

function useURLState(initialState: URLStateConfig): URLStateReturn
```

### URL Parameter Utilities

```javascript
interface URLParamUtils {
  encodeState: (state: URLStateConfig) => URLSearchParams;
  decodeState: (params: URLSearchParams) => Partial<URLStateConfig>;
  validateState: (state: Partial<URLStateConfig>) => URLStateConfig;
  isDefaultState: (state: URLStateConfig) => boolean;
}
```

### Browser History Integration

```javascript
interface HistoryManager {
  pushState: (state: URLStateConfig) => void;
  replaceState: (state: URLStateConfig) => void;
  onPopState: (callback: (state: URLStateConfig) => void) => () => void;
}
```

## Data Models

### URL State Model

```javascript
const URLStateSchema = {
  searchText: {
    param: 'q',
    default: '',
    encode: (value) => encodeURIComponent(value),
    decode: (value) => decodeURIComponent(value || ''),
    validate: (value) => typeof value === 'string' ? value.slice(0, 200) : ''
  },
  currentPage: {
    param: 'page',
    default: 1,
    encode: (value) => value > 1 ? value.toString() : null,
    decode: (value) => Math.max(1, parseInt(value) || 1),
    validate: (value) => Math.max(1, Math.min(1000, value))
  },
  pageSize: {
    param: 'size',
    default: 10,
    encode: (value) => [10, 25, 50, 100].includes(value) && value !== 10 ? value.toString() : null,
    decode: (value) => [10, 25, 50, 100].includes(parseInt(value)) ? parseInt(value) : 10,
    validate: (value) => [10, 25, 50, 100].includes(value) ? value : 10
  },
  sortColumn: {
    param: 'sort',
    default: null,
    encode: (value) => value || null,
    decode: (value) => value || null,
    validate: (value) => SORTABLE_COLUMNS.find(col => col.key === value)?.key || null
  },
  sortDirection: {
    param: 'dir',
    default: 'asc',
    encode: (value) => value === 'desc' ? 'desc' : null,
    decode: (value) => ['asc', 'desc'].includes(value) ? value : 'asc',
    validate: (value) => ['asc', 'desc'].includes(value) ? value : 'asc'
  },
  visibleColumns: {
    param: 'cols',
    default: DEFAULT_VISIBLE_COLUMNS,
    encode: (value) => {
      const visible = Object.entries(value).filter(([_, isVisible]) => isVisible).map(([key]) => key);
      const defaultVisible = Object.entries(DEFAULT_VISIBLE_COLUMNS).filter(([_, isVisible]) => isVisible).map(([key]) => key);
      return JSON.stringify(visible) === JSON.stringify(defaultVisible) ? null : visible.join(',');
    },
    decode: (value) => {
      if (!value) return DEFAULT_VISIBLE_COLUMNS;
      const visibleKeys = value.split(',');
      return Object.keys(DEFAULT_VISIBLE_COLUMNS).reduce((acc, key) => ({
        ...acc,
        [key]: visibleKeys.includes(key)
      }), {});
    },
    validate: (value) => {
      const validKeys = Object.keys(DEFAULT_VISIBLE_COLUMNS);
      return validKeys.reduce((acc, key) => ({
        ...acc,
        [key]: typeof value[key] === 'boolean' ? value[key] : DEFAULT_VISIBLE_COLUMNS[key]
      }), {});
    }
  }
};
```

## Error Handling

### URL Parameter Validation

1. **Invalid Parameters**: Gracefully handle malformed or invalid URL parameters by falling back to defaults
2. **Out-of-Range Values**: Clamp numeric values to valid ranges (e.g., page numbers, page sizes)
3. **Unknown Columns**: Filter out invalid column names and sort fields
4. **Encoding Issues**: Handle URL encoding/decoding errors with fallbacks

### Browser Compatibility

1. **History API Support**: Detect and gracefully degrade for older browsers
2. **URL Length Limits**: Monitor URL length and truncate if necessary
3. **Special Characters**: Properly encode/decode special characters in search terms

### Error Recovery

```javascript
const ErrorRecoveryStrategy = {
  INVALID_PAGE: 'redirect-to-page-1',
  INVALID_SORT: 'clear-sort-params',
  INVALID_COLUMNS: 'reset-to-default',
  URL_TOO_LONG: 'truncate-search-term',
  ENCODING_ERROR: 'clear-problematic-param'
};
```

## Testing Strategy

### Unit Tests

1. **URL Parameter Encoding/Decoding**: Test all parameter transformations
2. **State Validation**: Verify state validation logic handles edge cases
3. **Default Value Handling**: Ensure proper fallbacks for missing parameters
4. **Error Scenarios**: Test malformed URL handling

### Integration Tests

1. **URL-State Synchronization**: Verify bidirectional sync between URL and state
2. **Browser Navigation**: Test back/forward button functionality
3. **Component Integration**: Ensure components respond correctly to URL changes
4. **Search Flow**: Test complete search-to-URL-to-results flow

### End-to-End Tests

1. **Bookmark Functionality**: Test that bookmarked URLs restore correct state
2. **URL Sharing**: Verify shared URLs work correctly for different users
3. **Deep Linking**: Test direct navigation to specific search results
4. **Performance**: Ensure URL updates don't cause performance issues

### Accessibility Tests

1. **Screen Reader Compatibility**: Verify URL changes are announced appropriately
2. **Keyboard Navigation**: Test URL state changes with keyboard-only navigation
3. **Focus Management**: Ensure focus is maintained during URL-driven state changes

## Performance Considerations

### URL Update Optimization

1. **Debounced Updates**: Prevent excessive URL updates during rapid user interactions
2. **Batch Updates**: Group related state changes into single URL updates
3. **Selective Updates**: Only update URL when state actually changes
4. **History Management**: Limit history entries to prevent browser history pollution

### React 19 Integration

1. **Transition Integration**: Use React 19 transitions for URL-driven state changes
2. **Optimistic Updates**: Maintain optimistic UI updates during URL synchronization
3. **Concurrent Features**: Leverage concurrent rendering for smooth URL transitions
4. **Memory Optimization**: Prevent memory leaks from URL state listeners

### Caching Strategy

1. **URL State Caching**: Cache parsed URL state to avoid repeated parsing
2. **Validation Caching**: Cache validation results for repeated URL patterns
3. **History State**: Efficiently manage browser history state objects

## Implementation Phases

### Phase 1: Core URL State Management
- Implement useURLState hook
- Create URL parameter encoding/decoding utilities
- Add basic URL synchronization

### Phase 2: Component Integration
- Integrate URL state with App.jsx
- Update SearchBar, Pagination, and DrugTable components
- Implement browser history support

### Phase 3: Advanced Features
- Add URL validation and error handling
- Implement performance optimizations
- Add comprehensive error recovery

### Phase 4: Testing and Polish
- Complete test coverage
- Performance optimization
- Accessibility improvements
- Documentation updates

## Security Considerations

1. **XSS Prevention**: Properly sanitize URL parameters before using in DOM
2. **Parameter Validation**: Validate all URL parameters to prevent injection attacks
3. **URL Length Limits**: Prevent DoS through extremely long URLs
4. **Encoding Safety**: Use safe URL encoding practices for all parameters

## Browser Support

- **Modern Browsers**: Full feature support with History API
- **Legacy Browsers**: Graceful degradation with hash-based fallback
- **Mobile Browsers**: Optimized for mobile URL handling and sharing