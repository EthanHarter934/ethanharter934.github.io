// Structured logging utility for consistent formatting and levels
export const logger = {
  info: (message, data = {}) => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message,
        ...data,
      }),
    );
  },

  warn: (message, data = {}) => {
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'WARN',
        message,
        ...data,
      }),
    );
  },

  error: (message, error = null, data = {}) => {
    const errorData = error
      ? {
          errorMessage: error.message || String(error),
          errorStack: error.stack,
        }
      : {};

    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message,
        ...errorData,
        ...data,
      }),
    );
  },

  debug: (message, data = {}) => {
    if (process.env.DEBUG === 'true') {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'DEBUG',
          message,
          ...data,
        }),
      );
    }
  },
};
