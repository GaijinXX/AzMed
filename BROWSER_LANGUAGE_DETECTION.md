# Browser Language Detection

The Azerbaijan Drug Database now automatically detects and sets the user's preferred language based on their browser settings.

## How It Works

### 1. Language Detection Priority
The system follows this priority order:
1. **Saved Preference**: If user has previously selected a language, use that
2. **Browser Detection**: Detect from `navigator.language` and `navigator.languages`
3. **Default Fallback**: English if detection fails

### 2. Language Mapping
The system includes special language mappings:

| Browser Language | Website Language | Notes |
|------------------|------------------|-------|
| `en`, `en-US`, `en-GB`, etc. | English (`en`) | All English variants |
| `ru`, `ru-RU` | Russian (`ru`) | Russian variants |
| `az`, `az-AZ`, `az-Latn` | Azeri (`az`) | Azeri variants |
| **`tr`, `tr-TR`** | **Azeri (`az`)** | **Turkish maps to Azeri** |
| Other languages | English (`en`) | Fallback for unsupported languages |

### 3. Special Feature: Turkish → Azeri
As requested, users with Turkish browser language (`tr` or `tr-TR`) will automatically get the Azeri language interface, since Turkish and Azeri are closely related languages.

## Implementation Details

### Core Functions

#### `detectBrowserLanguage()`
```javascript
import { detectBrowserLanguage } from './utils/languageDetection';

const detectedLang = detectBrowserLanguage();
console.log(detectedLang); // 'en', 'az', or 'ru'
```

#### `getInitialLanguage(storageKey)`
```javascript
import { getInitialLanguage } from './utils/languageDetection';

// Checks localStorage first, then browser detection
const initialLang = getInitialLanguage('my-app-language');
```

#### `getBrowserLanguageInfo()`
```javascript
import { getBrowserLanguageInfo } from './utils/languageDetection';

const info = getBrowserLanguageInfo();
console.log(info);
// {
//   available: true,
//   language: "tr-TR",
//   languages: ["tr-TR", "tr", "en-US"],
//   detected: "az",  // Turkish mapped to Azeri
//   mapping: { ... }
// }
```

### Integration with LanguageContext

The `LanguageProvider` automatically uses browser detection:

```jsx
// In LanguageContext.jsx
useEffect(() => {
  // Uses getInitialLanguage which includes browser detection
  const initialLanguage = getInitialLanguage(LANGUAGE_STORAGE_KEY);
  setCurrentLanguage(initialLanguage);
  
  // Auto-save detected language if not previously saved
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (!savedLanguage && initialLanguage !== getDefaultLanguage()) {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, initialLanguage);
    console.log(`Auto-detected and saved language: ${initialLanguage}`);
  }
}, []);
```

## User Experience

### First Visit
1. User visits the site for the first time
2. System detects browser language (e.g., `tr-TR`)
3. Maps Turkish to Azeri (`az`)
4. Site loads in Azeri
5. Language preference is saved to localStorage
6. Console logs: `"Auto-detected and saved language: az"`

### Subsequent Visits
1. User returns to the site
2. System loads saved preference from localStorage
3. Site loads in previously selected language
4. No detection needed

### Manual Override
1. User can always manually change language using the LanguageSelector
2. Manual selection overrides browser detection
3. New preference is saved and used for future visits

## Browser Compatibility

### Supported Browsers
- ✅ Chrome, Firefox, Safari, Edge (modern versions)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ All browsers with `navigator.language` support

### Fallback Behavior
- ✅ Works without `navigator.language` (falls back to English)
- ✅ Handles missing localStorage gracefully
- ✅ No errors in server-side rendering environments

## Testing

### Manual Testing
To test the language detection:

1. **Change Browser Language**:
   - Chrome: Settings → Languages → Add Turkish
   - Firefox: Settings → General → Language
   - Safari: System Preferences → Language & Region

2. **Clear Site Data**:
   - Open Developer Tools → Application → Storage
   - Clear localStorage for the site

3. **Reload Page**:
   - Site should detect Turkish and show Azeri interface
   - Check console for detection logs

### Automated Testing
```bash
npm test -- --run src/__tests__/BrowserLanguageDetection.test.jsx
npm test -- --run src/contexts/__tests__/LanguageContext.test.jsx
```

## Debug Information

The system logs helpful debug information:

```javascript
// Browser language detection:
console.log('Browser language detection:', {
  detected: 'az',
  browserLanguage: 'tr-TR',
  browserLanguages: ['tr-TR', 'tr', 'en-US'],
  selectedLanguage: 'az'
});

// Auto-save detection:
console.log('Auto-detected and saved language: az');
```

## Configuration

### Adding New Language Mappings
To add support for new languages, update `LANGUAGE_MAPPING` in `src/utils/languageDetection.js`:

```javascript
const LANGUAGE_MAPPING = {
  // Existing mappings...
  
  // Add new language mapping
  'de': LANGUAGES.EN,     // German → English
  'de-DE': LANGUAGES.EN,  // German (Germany) → English
  'fr': LANGUAGES.EN,     // French → English
};
```

### Supported Languages
Currently supported website languages:
- English (`en`) - Default
- Azeri (`az`) - Including Turkish speakers
- Russian (`ru`)

To add more languages, update the translation files and language constants in `src/translations/index.js`.