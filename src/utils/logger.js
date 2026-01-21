/**
 * Simple logger utility for Ooryxx backend
 */

const formatMessage = (level, message, data) => {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (data) {
        return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`;
    }
    return `${prefix} ${message}`;
};

const logger = {
    info: (message, data) => {
        console.log(formatMessage('info', message, data));
    },

    warn: (message, data) => {
        console.warn(formatMessage('warn', message, data));
    },

    error: (message, data) => {
        console.error(formatMessage('error', message, data));
    },

    debug: (message, data) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(formatMessage('debug', message, data));
        }
    },

    http: (message, data) => {
        console.log(formatMessage('http', message, data));
    }
};

module.exports = logger;
