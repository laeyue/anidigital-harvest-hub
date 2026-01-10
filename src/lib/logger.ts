/**
 * Logger utility that can be toggled via environment variable
 * 
 * To enable logging: Set NEXT_PUBLIC_ENABLE_DEBUG_LOGS=true in your .env file
 * To disable logging: Set NEXT_PUBLIC_ENABLE_DEBUG_LOGS=false or omit it
 * 
 * Default behavior:
 * - If NEXT_PUBLIC_ENABLE_DEBUG_LOGS is set to 'true', logging is enabled
 * - If NEXT_PUBLIC_ENABLE_DEBUG_LOGS is set to 'false', logging is disabled
 * - If NEXT_PUBLIC_ENABLE_DEBUG_LOGS is not set, logging is disabled by default
 * 
 * To always log errors even when debug logs are disabled:
 * Set NEXT_PUBLIC_LOG_ERRORS=true
 */

const isDebugLoggingEnabled = (): boolean => {
  // Check the env var (works in all environments)
  const enableLogs = process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS;
  
  // If not set, default to false (no logging)
  if (!enableLogs) {
    return false;
  }
  
  // Check for 'true' string (case-insensitive)
  return enableLogs.toLowerCase() === 'true';
};

// Check at runtime instead of module load time to ensure env vars are available
const shouldLog = () => isDebugLoggingEnabled();

// Export logger functions that only log if enabled
export const logger = {
  log: (...args: unknown[]) => {
    if (shouldLog()) {
      console.log(...args);
    }
  },
  
  warn: (...args: unknown[]) => {
    if (shouldLog()) {
      console.warn(...args);
    }
  },
  
  error: (...args: unknown[]) => {
    // Errors can be controlled separately via NEXT_PUBLIC_LOG_ERRORS
    // If NEXT_PUBLIC_LOG_ERRORS is not set, it follows the debug logs setting
    const logErrors = process.env.NEXT_PUBLIC_LOG_ERRORS;
    const shouldLogErrors = logErrors 
      ? logErrors.toLowerCase() === 'true'
      : shouldLog(); // Default to debug logs setting
    
    if (shouldLogErrors) {
      console.error(...args);
    }
  },
  
  info: (...args: unknown[]) => {
    if (shouldLog()) {
      console.info(...args);
    }
  },
  
  debug: (...args: unknown[]) => {
    if (shouldLog()) {
      console.debug(...args);
    }
  },
};

// Export a function to check if logging is enabled (for conditional logic)
export const isLoggingEnabled = () => shouldLog();

// Export default for convenience
export default logger;
