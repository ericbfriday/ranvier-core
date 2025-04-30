import winston from 'winston';

// Reset Console transport and configure it to include ISO timestamp.
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    timestamp: true,
});

const logExt = '.log';

/**
 * Wrapper around Winston
 */
class Logger {
    static getLevel(): string {
        return winston.level || process.env.LOG_LEVEL || 'debug';
    }

    static setLevel(level: string): void {
        winston.level = level;
    }

    /*
    Medium priority logging, default.
  */
    static log(...messages: any[]): void {
        winston.log('info', ...messages);
    }

    /*
    Appends red "ERROR" to the start of logs.
    Highest priority logging.
  */
    static error(...messages: any[]): void {
        winston.log('error', ...messages);
    }

    /*
    Less high priority than error, still higher visibility than default.
  */
    static warn(...messages: any[]): void {
        winston.log('warn', ...messages);
    }

    /*
    Lower priority logging.
    Only logs if the environment variable is set to VERBOSE.
  */
    static verbose(...messages: any[]): void {
        winston.log('verbose', ...messages);
    }

    // TODO: Be able to set and deactivate file logging via a server command.
    static setFileLogging(path: string): void {
        if (!path.endsWith(logExt)) {
            path += logExt;
        }
        console.log(`Adding file logging at ${path}`);
        winston.add(winston.transports.File, { filename: path, timestamp: true });
    }

    static deactivateFileLogging(): void {
        winston.remove(winston.transports.File);
    }

    static enablePrettyErrors(): void {
        const longjohn = require('longjohn');
        const pe = require('pretty-error').start();
        pe.skipNodeFiles(); // Ignore native node files in stacktrace.
    }
}

export default Logger;
