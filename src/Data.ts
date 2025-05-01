import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'js-yaml';

let dataPath: string | null = null;

type DataType = 'player' | 'account';
type Callback = () => void;

/**
 * Class for loading/parsing data files from disk
 */
export class Data {
    static setDataPath(newPath: string): void {
        dataPath = newPath;
    }

    /**
     * Read in and parse a file. Current supports yaml and json
     * @param {string} filepath
     * @return {*} parsed contents of file
     */
    static parseFile(filepath: string): any {
        if (!fs.existsSync(filepath)) {
            throw new Error(`File [${filepath}] does not exist!`);
        }

        const contents = fs
            .readFileSync(fs.realpathSync(filepath))
            .toString('utf8');
        const parsers: { [key: string]: (content: string) => any } = {
            '.yml': yaml.load,
            '.yaml': yaml.load,
            '.json': JSON.parse,
        };

        const ext = path.extname(filepath);
        if (!(ext in parsers)) {
            throw new Error(`File [${filepath}] does not have a valid parser!`);
        }

        return parsers[ext](contents);
    }

    /**
     * Write data to a file
     * @param {string} filepath
     * @param {*} data
     * @param {Function} callback
     */
    static saveFile(filepath: string, data: any, callback?: Callback): void {
        if (!fs.existsSync(filepath)) {
            throw new Error(`File [${filepath}] does not exist!`);
        }

        const serializers: { [key: string]: (data: any) => string } = {
            '.yml': yaml.safeDump,
            '.yaml': yaml.safeDump,
            '.json': function (data) {
                // Make it prettttty
                return JSON.stringify(data, null, 2);
            },
        };

        const ext = path.extname(filepath);
        if (!(ext in serializers)) {
            throw new Error(`File [${filepath}] does not have a valid serializer!`);
        }

        const dataToWrite = serializers[ext](data);
        fs.writeFileSync(filepath, dataToWrite, 'utf8');

        if (callback) {
            callback();
        }
    }

    /**
     * load/parse a data file (player/account)
     * @param {string} type
     * @param {string} id
     * @return {*}
     */
    static load(type: DataType, id: string): any {
        return this.parseFile(this.getDataFilePath(type, id));
    }

    /**
     * Save data file (player/account) data to disk
     * @param {string} type
     * @param {string} id
     * @param {*} data
     * @param {Function} callback
     */
    static save(
        type: DataType,
        id: string,
        data: any,
        callback?: Callback,
    ): void {
        if (!dataPath) {
            throw new Error('Data path not set');
        }

        fs.writeFileSync(
            this.getDataFilePath(type, id),
            JSON.stringify(data, null, 2),
            'utf8',
        );
        if (callback) {
            callback();
        }
    }

    /**
     * Check if a data file exists
     * @param {string} type
     * @param {string} id
     * @return {boolean}
     */
    static exists(type: DataType, id: string): boolean {
        return fs.existsSync(this.getDataFilePath(type, id));
    }

    /**
     * get the file path for a given data file by type (player/account)
     * @param {string} type
     * @param {string} id
     * @return {string}
     */
    static getDataFilePath(type: DataType, id: string): string {
        if (!dataPath) {
            throw new Error('Data path not set');
        }

        switch (type) {
            case 'player': {
                return `${dataPath}player/${id}.json`;
            }
            case 'account': {
                return `${dataPath}account/${id}.json`;
            }
            default:
                throw new Error(`Invalid data type: ${type}`);
        }
    }

    /**
     * Determine whether or not a path leads to a legitimate JS file or not.
     * @param {string} path
     * @param {string} [file]
     * @return {boolean}
     */
    static isScriptFile(filePath: string, file?: string): boolean {
        file = file || filePath;
        return fs.statSync(filePath).isFile() && !!file.match(/js$/);
    }

    /**
     * load the MOTD for the intro screen
     * @return string
     */
    static loadMotd(): string {
        if (!dataPath) {
            throw new Error('Data path not set');
        }

        const motd = fs.readFileSync(`${dataPath}motd`).toString('utf8');
        return motd;
    }
}

export default Data;
