
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface Logger {
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
  debug: (message: string, data?: any) => void;
}

const createLogger = (context: string): Logger => {
  const log = (level: LogLevel, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] ${context}:`;
    
    if (data) {
      console[level](`${prefix} ${message}`, data);
    } else {
      console[level](`${prefix} ${message}`);
    }
  };

  return {
    info: (message: string, data?: any) => log('info', message, data),
    warn: (message: string, data?: any) => log('warn', message, data),
    error: (message: string, data?: any) => log('error', message, data),
    debug: (message: string, data?: any) => log('debug', message, data)
  };
};

export { createLogger };
export type { Logger };
