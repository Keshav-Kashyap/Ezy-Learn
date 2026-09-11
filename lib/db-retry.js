/**
 * Global Database Retry Utility
 * 
 * Handles database connection timeouts and transient errors
 * with exponential backoff retry strategy
 */

/**
 * Retry database operation with exponential backoff
 * 
 * @param {Function} operation - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {boolean} options.silent - Suppress console logs (default: false)
 * @returns {Promise} Result of the operation
 */
export async function retryDbOperation(operation, options = {}) {
    const {
        maxRetries = 3,
        initialDelay = 1000,
        silent = false
    } = options;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            // Check if error is retryable
            const isTimeoutError =
                error.message?.includes('Connect Timeout') ||
                error.message?.includes('Connection terminated') ||
                error.message?.includes('fetch failed') ||
                error.message?.includes('ECONNREFUSED') ||
                error.message?.includes('ETIMEDOUT') ||
                error.code === 'UND_ERR_CONNECT_TIMEOUT' ||
                error.code === 'ECONNREFUSED' ||
                error.code === 'ETIMEDOUT';

            // Don't retry if max attempts reached
            if (attempt >= maxRetries) {
                if (!silent) {
                    console.error(`❌ Database operation failed after ${maxRetries + 1} attempts:`, {
                        error: error.message,
                        code: error.code
                    });
                }
                break;
            }

            // Only retry on timeout/connection errors
            if (!isTimeoutError) {
                if (!silent) {
                    console.error('❌ Non-retryable database error:', error.message);
                }
                throw error;
            }

            // Calculate delay with exponential backoff
            const delay = initialDelay * Math.pow(2, attempt);

            if (!silent) {
                console.warn(` Database ${isTimeoutError ? 'timeout' : 'error'}, retrying in ${delay}ms (attempt ${attempt + 2}/${maxRetries + 1})...`);
            }

            // Wait before next retry
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // All retries exhausted
    throw lastError;
}

/**
 * Create a retry wrapper for specific database operation
 * 
 * @param {Function} operation - Database operation to wrap
 * @param {Object} retryOptions - Retry configuration
 * @returns {Function} Wrapped operation with retry logic
 */
export function withRetry(operation, retryOptions = {}) {
    return async (...args) => {
        return retryDbOperation(() => operation(...args), retryOptions);
    };
}

/**
 * Check if database is healthy
 * 
 * @param {Object} db - Drizzle database instance
 * @returns {Promise<boolean>} True if database is accessible
 */
export async function checkDatabaseHealth(db) {
    try {
        await retryDbOperation(async () => {
            // Simple query to check connection
            const result = await db.execute('SELECT 1 as health');
            return result;
        }, { maxRetries: 2, silent: true });

        return true;
    } catch (error) {
        console.error('❌ Database health check failed:', error.message);
        return false;
    }
}

export default retryDbOperation;
