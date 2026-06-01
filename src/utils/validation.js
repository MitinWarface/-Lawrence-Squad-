import { logger } from './logger.js';

export function validateString(value, fieldName = 'string', maxLength = 2000) {
  if (typeof value !== 'string') {
    logger.warn(`[VALIDATION] ${fieldName} должен быть строкой, получено: ${typeof value}`);
    return null;
  }
  
  if (value.length === 0) {
    logger.warn(`[VALIDATION] ${fieldName} не может быть пустым`);
    return null;
  }
  
  if (value.length > maxLength) {
    logger.warn(`[VALIDATION] Длина ${fieldName} превышает максимальную: ${maxLength}`);
    return value.substring(0, maxLength);
  }
  
  return value;
}

export function validateNumber(value, fieldName = 'number') {
  if (typeof value !== 'number' || isNaN(value)) {
    logger.warn(`[VALIDATION] ${fieldName} должен быть действительным числом, получено: ${value}`);
    return null;
  }
  
  if (value < 0) {
    logger.warn(`[VALIDATION] ${fieldName} не может быть отрицательным`);
    return null;
  }
  
  return value;
}

export function validateDiscordId(value, fieldName = 'ID') {
  if (typeof value !== 'string') {
    logger.warn(`[VALIDATION] ${fieldName} должен быть строкой`);
    return null;
  }
  
  if (!/^\d{18,20}$/.test(value)) {
    logger.warn(`[VALIDATION] Неверный формат ${fieldName}`);
    return null;
  }
  
  return value;
}

export function validateCustomId(value, fieldName = 'customId') {
  if (typeof value !== 'string' || value.length === 0) {
    logger.warn(`[VALIDATION] ${fieldName} должен быть непустой строкой`);
    return null;
  }
  
  if (value.length > 100) {
    logger.warn(`[VALIDATION] Длина ${fieldName} превышает максимальную (100 символов)`);
    return null;
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    logger.warn(`[VALIDATION] ${fieldName} содержит недопустимые символы`);
    return null;
  }
  
  return value;
}

export function validateRequiredProps(obj, requiredProps, objName = 'object') {
  if (!obj || typeof obj !== 'object') {
    logger.warn(`[VALIDATION] ${objName} должен быть объектом`);
    return false;
  }
  
  const missing = requiredProps.filter(prop => !(prop in obj));
  
  if (missing.length > 0) {
    logger.warn(`[VALIDATION] В ${objName} отсутствуют обязательные свойства: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}

export function validateUrl(value, fieldName = 'URL') {
  if (typeof value !== 'string' || value.length === 0) {
    logger.warn(`[VALIDATION] ${fieldName} должен быть непустой строкой`);
    return null;
  }
  
  try {
    new URL(value);
    return value;
  } catch (error) {
    logger.warn(`[VALIDATION] ${fieldName} не является действительным URL`);
    return null;
  }
}

export function validateRange(value, min, max, fieldName = 'value') {
  if (typeof value !== 'number' || isNaN(value)) {
    logger.warn(`[VALIDATION] ${fieldName} должен быть числом`);
    return null;
  }
  
  if (value < min || value > max) {
    logger.warn(`[VALIDATION] ${fieldName} должен быть в диапазоне от ${min} до ${max}`);
    return null;
  }
  
  return value;
}

export function validateEnum(value, allowedValues, fieldName = 'value') {
  if (!allowedValues.includes(value)) {
    logger.warn(`[VALIDATION] ${fieldName} должен быть одним из: ${allowedValues.join(', ')}`);
    return null;
  }
  
  return value;
}

export default {
  validateString,
  validateNumber,
  validateDiscordId,
  validateCustomId,
  validateRequiredProps,
  validateUrl,
  validateRange,
  validateEnum
};
