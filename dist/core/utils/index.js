export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const retry = async (fn, options = {}) => {
    const attempts = options.attempts ?? 3;
    const backoff = options.backoff ?? 1000;
    let lastError = null;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt < attempts) {
                const delayMs = backoff * (2 ** (attempt - 1));
                await delay(delayMs);
            }
        }
    }
    throw lastError;
};
export const formatBytes = (bytes) => {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / (k ** i)) * 100) / 100 + ' ' + sizes[i];
};
export const generateId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};
export const chunk = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
};
//# sourceMappingURL=index.js.map