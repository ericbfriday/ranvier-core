let __cache: Record<string, any> | null = null

/**
 * Access class for the `ranvier.json` config
 */
class Config {
    /**
     * @param {string} key
     * @param {any} fallback fallback value
     */
    static get(key: string, fallback?: any): any {
        return __cache && key in __cache ? __cache[key] : fallback
    }

    /**
     * Load `ranvier.json` from disk
     */
    static load(data: Record<string, any>): void {
        __cache = data
    }
}

export default Config
