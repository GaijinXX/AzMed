# React Hooks Order Fix

## Issue
The `RecentSearchesDropdown` component was experiencing a "Rendered more hooks than during the previous render" error when used in the application. This error occurs when React hooks are not called in the same order on every render, violating the Rules of Hooks.

## Root Cause
The issue was in the `RecentSearchesDropdown.jsx` component where `useCallback` hooks were being called after an early return statement:

```javascript
// PROBLEMATIC CODE (BEFORE FIX)
const RecentSearchesDropdown = memo(({ ... }) => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  // ... other hooks

  // Early return here
  if (!isVisible || recentSearches.length === 0) {
    return null;
  }

  // These useCallback hooks were called AFTER the early return
  const handleItemSelect = useCallback((searchTerm) => {
    onSelectSearch(searchTerm);
  }, [onSelectSearch]);

  const handleItemRemove = useCallback((searchTerm) => {
    // ...
  }, [onRemoveSearch, selectedIndex, recentSearches.length]);

  // ...
});
```

When the component would render with `isVisible=false` or empty `recentSearches`, it would return early and skip the `useCallback` hooks. On subsequent renders where the component needed to show content, React would try to call more hooks than in the previous render, causing the error.

## Solution
Moved all hooks (including `useCallback`) to be called before any early return statements:

```javascript
// FIXED CODE (AFTER FIX)
const RecentSearchesDropdown = memo(({ ... }) => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const itemRefs = useRef([]);

  // All useCallback hooks moved to the top, before any early returns
  const handleItemSelect = useCallback((searchTerm) => {
    onSelectSearch(searchTerm);
  }, [onSelectSearch]);

  const handleItemRemove = useCallback((searchTerm) => {
    onRemoveSearch(searchTerm);
    if (selectedIndex >= recentSearches.length - 1) {
      setSelectedIndex(Math.max(-1, recentSearches.length - 2));
    }
  }, [onRemoveSearch, selectedIndex, recentSearches.length]);

  // All useEffect hooks
  useEffect(() => {
    // ...
  }, [isVisible, recentSearches]);

  useEffect(() => {
    // ...
  }, [isVisible, selectedIndex, recentSearches, onSelectSearch, onClose]);

  useEffect(() => {
    // ...
  }, [selectedIndex]);

  // Early return AFTER all hooks
  if (!isVisible || recentSearches.length === 0) {
    return null;
  }

  // Component JSX...
});
```

## Rules of Hooks Compliance
This fix ensures compliance with the Rules of Hooks:

1. **Always call hooks at the top level** - All hooks are now called before any early returns
2. **Don't call hooks inside loops, conditions, or nested functions** - All hooks are at the component's top level
3. **Call hooks in the same order every time** - The hook order is now consistent across all renders

## Testing
Added specific tests to verify the fix works correctly:
- `RecentSearchesDropdown.hooks.test.jsx` - Tests rapid prop changes and visibility toggles
- Existing integration tests continue to pass
- No more "hooks order" errors in the browser console

## Impact
- ✅ Fixed the runtime error that was breaking the search functionality
- ✅ Component now renders correctly in all visibility states
- ✅ Performance optimizations (React.memo, useCallback) still work as intended
- ✅ All existing functionality preserved