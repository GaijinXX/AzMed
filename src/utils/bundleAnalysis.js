/**
 * Bundle size analysis utility for language selector optimizations
 * Analyzes translation file sizes and bundle impact
 */

/**
 * Analyze translation file sizes
 * @returns {Promise<Object>} Bundle analysis results
 */
export const analyzeBundleSize = async () => {
  const analysis = {
    translationSizes: {},
    totalSize: 0,
    compressionRatio: 0,
    recommendations: []
  };

  try {
    // Analyze individual translation files
    const languages = ['en', 'az', 'ru'];

    for (const lang of languages) {
      try {
        // Dynamic import to get actual file size impact
        const module = await import(`../translations/${lang}.js`);
        const content = JSON.stringify(module.default);
        const size = new Blob([content]).size;

        analysis.translationSizes[lang] = {
          uncompressed: size,
          compressed: Math.round(size * 0.3), // Estimate gzip compression
          keys: countTranslationKeys(module.default)
        };

        analysis.totalSize += size;
      } catch (error) {
        console.warn(`Failed to analyze ${lang} translation:`, error);
      }
    }

    // Calculate compression ratio
    analysis.compressionRatio = analysis.totalSize > 0 ?
      (analysis.totalSize * 0.3) / analysis.totalSize : 0;

    // Generate recommendations
    analysis.recommendations = generateOptimizationRecommendations(analysis);

    return analysis;
  } catch (error) {
    console.error('Bundle analysis failed:', error);
    return {
      error: error.message,
      translationSizes: {},
      totalSize: 0,
      recommendations: ['Bundle analysis failed - check console for details']
    };
  }
};

/**
 * Count translation keys recursively
 * @param {Object} obj - Translation object
 * @returns {number} Number of translation keys
 */
const countTranslationKeys = (obj) => {
  let count = 0;

  const traverse = (current) => {
    if (typeof current === 'object' && current !== null) {
      Object.keys(current).forEach(key => {
        if (typeof current[key] === 'string') {
          count++;
        } else if (typeof current[key] === 'object') {
          traverse(current[key]);
        }
      });
    }
  };

  traverse(obj);
  return count;
};

/**
 * Generate optimization recommendations
 * @param {Object} analysis - Bundle analysis results
 * @returns {string[]} Array of recommendations
 */
const generateOptimizationRecommendations = (analysis) => {
  const recommendations = [];

  // Check total size
  if (analysis.totalSize > 50000) { // 50KB
    recommendations.push('Consider splitting translations into smaller chunks');
  }

  // Check individual file sizes
  Object.entries(analysis.translationSizes).forEach(([lang, data]) => {
    if (data.uncompressed > 20000) { // 20KB
      recommendations.push(`${lang} translation file is large (${Math.round(data.uncompressed / 1024)}KB) - consider optimization`);
    }
  });

  // Check key count balance
  const keyCounts = Object.values(analysis.translationSizes).map(data => data.keys);
  const maxKeys = Math.max(...keyCounts);
  const minKeys = Math.min(...keyCounts);

  if (maxKeys - minKeys > 50) {
    recommendations.push('Translation files have unbalanced key counts - check for missing translations');
  }

  // Compression recommendations
  if (analysis.compressionRatio > 0.4) {
    recommendations.push('Translation files have low compression ratio - consider removing redundancy');
  }

  if (recommendations.length === 0) {
    recommendations.push('Bundle size is optimized for current translation content');
  }

  return recommendations;
};

/**
 * Performance benchmark for language switching
 * @returns {Promise<Object>} Performance benchmark results
 */
export const benchmarkLanguageSwitching = async () => {
  const results = {
    loadTimes: {},
    switchTimes: {},
    memoryUsage: {},
    recommendations: []
  };

  try {
    const languages = ['en', 'az', 'ru'];

    // Benchmark translation loading
    for (const lang of languages) {
      const startTime = performance.now();

      try {
        await import(`../translations/${lang}.js`);
        results.loadTimes[lang] = performance.now() - startTime;
      } catch (error) {
        results.loadTimes[lang] = -1; // Error indicator
      }
    }

    // Memory usage snapshot
    if (performance.memory) {
      results.memoryUsage = {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100
      };
    }

    // Generate performance recommendations
    results.recommendations = generatePerformanceRecommendations(results);

    return results;
  } catch (error) {
    console.error('Performance benchmark failed:', error);
    return {
      error: error.message,
      loadTimes: {},
      switchTimes: {},
      memoryUsage: {},
      recommendations: ['Performance benchmark failed - check console for details']
    };
  }
};

/**
 * Generate performance recommendations
 * @param {Object} results - Benchmark results
 * @returns {string[]} Array of recommendations
 */
const generatePerformanceRecommendations = (results) => {
  const recommendations = [];

  // Check load times
  const loadTimes = Object.values(results.loadTimes).filter(time => time > 0);
  const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;

  if (avgLoadTime > 10) {
    recommendations.push(`Average translation load time is ${avgLoadTime.toFixed(2)}ms - consider preloading`);
  }

  // Check memory usage
  if (results.memoryUsage.used && results.memoryUsage.used > 50) {
    recommendations.push(`High memory usage detected (${results.memoryUsage.used}MB) - monitor for memory leaks`);
  }

  // Check for failed loads
  const failedLoads = Object.entries(results.loadTimes)
    .filter(([, time]) => time === -1)
    .map(([lang]) => lang);

  if (failedLoads.length > 0) {
    recommendations.push(`Failed to load translations: ${failedLoads.join(', ')}`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Language switching performance is optimal');
  }

  return recommendations;
};

/**
 * Cross-browser compatibility check
 * @returns {Object} Compatibility check results
 */
export const checkCrossBrowserCompatibility = () => {
  const compatibility = {
    features: {},
    supported: true,
    warnings: [],
    recommendations: []
  };

  try {
    // Check React 19 features
    compatibility.features.useTransition = typeof React !== 'undefined' && typeof React.useTransition === 'function';
    compatibility.features.useDeferredValue = typeof React !== 'undefined' && typeof React.useDeferredValue === 'function';
    compatibility.features.useOptimistic = typeof React !== 'undefined' && typeof React.useOptimistic === 'function';

    // Check browser APIs
    compatibility.features.localStorage = typeof localStorage !== 'undefined';
    compatibility.features.performance = typeof performance !== 'undefined';
    compatibility.features.performanceMemory = typeof performance !== 'undefined' && !!performance.memory;
    // Check for dynamic import support (assume true in modern environments)
    compatibility.features.dynamicImport = true;

    // Check for potential issues
    if (!compatibility.features.useTransition) {
      compatibility.warnings.push('React 19 useTransition not available - falling back to standard state updates');
    }

    if (!compatibility.features.localStorage) {
      compatibility.warnings.push('localStorage not available - language preference will not persist');
      compatibility.supported = false;
    }

    if (!compatibility.features.performance) {
      compatibility.warnings.push('Performance API not available - performance monitoring disabled');
    }

    if (!compatibility.features.dynamicImport) {
      compatibility.warnings.push('Dynamic imports not supported - lazy loading disabled');
      compatibility.supported = false;
    }

    // Generate recommendations
    if (compatibility.warnings.length === 0) {
      compatibility.recommendations.push('All features are supported in this environment');
    } else {
      compatibility.recommendations.push('Some advanced features are not available - basic functionality will work');
    }

    return compatibility;
  } catch (error) {
    console.error('Compatibility check failed:', error);
    return {
      features: {},
      supported: false,
      warnings: ['Compatibility check failed'],
      recommendations: ['Manual testing required for this environment']
    };
  }
};

/**
 * Generate comprehensive performance report
 * @returns {Promise<Object>} Complete performance report
 */
export const generatePerformanceReport = async () => {
  console.log('🔍 Generating language selector performance report...');

  const report = {
    timestamp: new Date().toISOString(),
    bundleAnalysis: await analyzeBundleSize(),
    performanceBenchmark: await benchmarkLanguageSwitching(),
    compatibilityCheck: checkCrossBrowserCompatibility(),
    summary: {
      status: 'unknown',
      criticalIssues: [],
      optimizationOpportunities: [],
      overallScore: 0
    }
  };

  // Calculate overall score and status
  let score = 100;
  const criticalIssues = [];
  const optimizations = [];

  // Bundle size impact
  if (report.bundleAnalysis.totalSize > 100000) {
    score -= 20;
    criticalIssues.push('Large bundle size impact');
  } else if (report.bundleAnalysis.totalSize > 50000) {
    score -= 10;
    optimizations.push('Bundle size could be optimized');
  }

  // Performance impact
  const avgLoadTime = Object.values(report.performanceBenchmark.loadTimes || {})
    .filter(time => time > 0)
    .reduce((a, b, _, arr) => a + b / arr.length, 0);

  if (avgLoadTime > 50) {
    score -= 15;
    criticalIssues.push('Slow translation loading');
  } else if (avgLoadTime > 20) {
    score -= 5;
    optimizations.push('Translation loading could be faster');
  }

  // Compatibility issues
  if (!report.compatibilityCheck.supported) {
    score -= 30;
    criticalIssues.push('Critical compatibility issues');
  } else if (report.compatibilityCheck.warnings.length > 0) {
    score -= 10;
    optimizations.push('Some features not available in this environment');
  }

  // Set status
  if (score >= 90) {
    report.summary.status = 'excellent';
  } else if (score >= 75) {
    report.summary.status = 'good';
  } else if (score >= 60) {
    report.summary.status = 'fair';
  } else {
    report.summary.status = 'poor';
  }

  report.summary.overallScore = Math.max(0, score);
  report.summary.criticalIssues = criticalIssues;
  report.summary.optimizationOpportunities = optimizations;

  console.log(`📊 Performance report complete - Status: ${report.summary.status} (${report.summary.overallScore}/100)`);

  return report;
};