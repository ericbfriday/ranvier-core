export interface HelpfileOptions {
    keywords?: string[]
    command?: string
    channel?: string
    related?: string[]
    body: string
}

/**
 * Representation of an in game helpfile
 */
export default class Helpfile {
    bundle: string
    name: string
    keywords: string[]
    command?: string
    channel?: string
    related: string[]
    body: string

    /**
     * @param bundle - Bundle the helpfile comes from
     * @param name - Name of the helpfile
     * @param options - Helpfile configuration
     */
    constructor(bundle: string, name: string, options: HelpfileOptions) {
        this.bundle = bundle
        this.name = name

        if (!options || !options.body) {
            throw new Error(`Help file [${name}] has no content.`)
        }

        this.keywords = options.keywords || [name]
        this.command = options.command
        this.channel = options.channel
        this.related = options.related || []
        this.body = options.body
    }
}
