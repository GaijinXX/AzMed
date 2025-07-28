import { describe, it, expect } from 'vitest';
import { formatPrice, truncateText, truncateIngredients } from '../formatters.js';

describe('formatPrice', () => {
  it('should format price correctly from qəpik to AZN', () => {
    expect(formatPrice(5789)).toBe('₼57.89');
    expect(formatPrice(678)).toBe('₼6.78');
    expect(formatPrice(100)).toBe('₼1.00');
    expect(formatPrice(50)).toBe('₼0.50');
    expect(formatPrice(1)).toBe('₼0.01');
  });

  it('should handle zero price', () => {
    expect(formatPrice(0)).toBe('₼0.00');
  });

  it('should handle invalid inputs', () => {
    expect(formatPrice(null)).toBe('₼0.00');
    expect(formatPrice(undefined)).toBe('₼0.00');
    expect(formatPrice('invalid')).toBe('₼0.00');
    expect(formatPrice(NaN)).toBe('₼0.00');
  });

  it('should handle large numbers', () => {
    expect(formatPrice(123456789)).toBe('₼1234567.89');
  });

  it('should handle decimal inputs correctly', () => {
    expect(formatPrice(123.45)).toBe('₼1.23');
    expect(formatPrice(99.99)).toBe('₼1.00');
  });
});

describe('truncateText', () => {
  it('should not truncate text shorter than max length', () => {
    const text = 'Short text';
    expect(truncateText(text, 100)).toBe(text);
  });

  it('should truncate text longer than max length', () => {
    const longText = 'This is a very long text that should be truncated because it exceeds the maximum length limit';
    const result = truncateText(longText, 50);
    expect(result).toBe('This is a very long text that should be truncated...');
    expect(result.length).toBe(52); // 49 (after trim) + '...'
  });

  it('should use default max length of 100', () => {
    const longText = 'a'.repeat(150);
    const result = truncateText(longText);
    expect(result.length).toBe(103); // 100 + '...'
  });

  it('should handle invalid inputs', () => {
    expect(truncateText(null)).toBe('');
    expect(truncateText(undefined)).toBe('');
    expect(truncateText(123)).toBe('');
  });

  it('should trim whitespace before adding ellipsis', () => {
    const text = 'This is a text with trailing spaces    that should be truncated';
    const result = truncateText(text, 30);
    expect(result).toBe('This is a text with trailing s...');
  });

  it('should handle empty string', () => {
    expect(truncateText('')).toBe('');
  });
});

describe('truncateIngredients', () => {
  it('should not truncate ingredients shorter than max length', () => {
    const ingredients = 'Paracetamol, Caffeine';
    expect(truncateIngredients(ingredients, 150)).toBe(ingredients);
  });

  it('should truncate at last complete ingredient', () => {
    const ingredients = 'Paracetamol 500mg, Caffeine 65mg, Phenylephrine HCl 10mg, Chlorpheniramine Maleate 4mg, Dextromethorphan HBr 15mg';
    const result = truncateIngredients(ingredients, 80);
    expect(result).toBe('Paracetamol 500mg, Caffeine 65mg, Phenylephrine HCl 10mg...');
  });

  it('should use regular truncation if no comma found', () => {
    const ingredients = 'VeryLongIngredientNameWithoutCommasThatExceedsTheMaximumLengthLimit';
    const result = truncateIngredients(ingredients, 50);
    expect(result).toBe('VeryLongIngredientNameWithoutCommasThatExceedsTheM...');
  });

  it('should use default max length of 150', () => {
    const longIngredients = 'Ingredient1, Ingredient2, Ingredient3, Ingredient4, Ingredient5, Ingredient6, Ingredient7, Ingredient8, Ingredient9, Ingredient10, Ingredient11, Ingredient12';
    const result = truncateIngredients(longIngredients);
    expect(result.length).toBeLessThanOrEqual(153); // 150 + '...'
    expect(result.endsWith('...')).toBe(true);
  });

  it('should handle invalid inputs', () => {
    expect(truncateIngredients(null)).toBe('');
    expect(truncateIngredients(undefined)).toBe('');
    expect(truncateIngredients(123)).toBe('');
  });

  it('should handle empty string', () => {
    expect(truncateIngredients('')).toBe('');
  });

  it('should trim whitespace before adding ellipsis', () => {
    const ingredients = 'Ingredient1, Ingredient2   , Ingredient3 that is very long and should be truncated';
    const result = truncateIngredients(ingredients, 40);
    expect(result).toBe('Ingredient1, Ingredient2...');
  });
});