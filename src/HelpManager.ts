import type Helpfile from './Helpfile.js';

/**
 * Contain/look up helpfiles
 */
export default class HelpManager {
    private helps: Map<string, Helpfile>;

    constructor() {
        this.helps = new Map();
    }

    /**
     * Get a helpfile by name
     * @param help - Helpfile name
     */
    get(help: string): Helpfile | undefined {
        return this.helps.get(help);
    }

    /**
     * Add a helpfile to the manager
     * @param help - Helpfile to add
     */
    add(help: Helpfile): void {
        this.helps.set(help.name, help);
    }

    /**
     * Find helpfiles matching a search term
     * @param search - Search term
     */
    find(search: string): Map<string, Helpfile> {
        const results = new Map<string, Helpfile>();
        for (const [name, help] of this.helps.entries()) {
            if (name.indexOf(search) === 0) {
                results.set(name, help);
                continue;
            }
            if (help.keywords.some(keyword => keyword.includes(search))) {
                results.set(name, help);
            }
        }
        return results;
    }

    /**
     * Returns first help matching keywords
     * @param help - Search term
     */
    getFirst(help: string): Helpfile | null {
        const results = this.find(help);

        if (!results.size) {
            /**
             * No results found
             */
            return null;
        }

        const [_, hfile] = [...results][0];

        return hfile;
    }
}
