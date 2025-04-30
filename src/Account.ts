import bcrypt from 'bcryptjs'
import Data from './Data.ts'

export interface AccountData {
    username: string
    characters?: Array<{ username: string, deleted: boolean }>
    password: string
    banned?: boolean
    deleted?: boolean
    metadata?: Record<string, any>
}

/**
 * Representation of a player's account
 *
 * @property {string} username
 * @property {Array<string>} characters List of character names in this account
 * @property {string} password Hashed password
 * @property {boolean} banned Whether this account is banned or not
 */
export default class Account {
    username: string
    characters: Array<{ username: string, deleted: boolean }>
    password: string
    banned: boolean
    deleted: boolean
    metadata: Record<string, any>

    /**
     * @param {object} data Account save data
     */
    constructor(data: AccountData) {
        this.username = data.username
        this.characters = data.characters || []
        this.password = data.password
        this.banned = data.banned || false
        this.deleted = data.deleted || false
        // Arbitrary data bundles are free to shove whatever they want in
        // WARNING: values must be JSON.stringify-able
        this.metadata = data.metadata || {}
    }

    /**
     * @return {string}
     */
    getUsername(): string {
        return this.username
    }

    /**
     * @param {string} username
     */
    addCharacter(username: string): void {
        this.characters.push({ username, deleted: false })
    }

    /**
     * @param {string} name
     * @return {boolean}
     */
    hasCharacter(
        name: string,
    ): { username: string, deleted: boolean } | undefined {
        return this.characters.find(c => c.username === name)
    }

    /**
     * @param {string} name Delete one of the chars
     */
    deleteCharacter(name: string): void {
        const picked = this.characters.find(c => c.username === name)
        if (picked) {
            picked.deleted = true
            this.save()
        }
    }

    /**
     * @param {string} name Removes the deletion of one of the chars
     */
    undeleteCharacter(name: string): void {
        const picked = this.characters.find(c => c.username === name)
        if (picked) {
            picked.deleted = false
            this.save()
        }
    }

    /**
     * @param {string} password Unhashed password. Is hashed inside this function
     */
    setPassword(pass: string): void {
        this.password = this._hashPassword(pass)
        this.save()
    }

    /**
     * @param {string} pass Unhashed password to check against account's password
     * @return {boolean}
     */
    checkPassword(pass: string): boolean {
        return bcrypt.compareSync(pass, this.password)
    }

    /**
     * @param {Function} callback after-save callback
     */
    save(callback?: (err: Error | null) => void): void {
        Data.save('account', this.username, this.serialize(), () => {
            if (callback)
                callback(null)
        })
    }

    /**
     * Set this account to banned
    There is no unban because this can just be done by manually editing the account file
     */
    ban(): void {
        this.banned = true
        this.save()
    }

    /**
     * Set this account to deleted
   There is no undelete because this can just be done by manually editing the account file
     */
    deleteAccount(): void {
        this.characters.forEach((char) => {
            this.deleteCharacter(char.username)
        })
        this.deleted = true
        this.save()
    }

    /**
     * @private
     * @param {string} pass
     * @return {string} Hashed password
     */
    private _hashPassword(pass: string): string {
        const salt = bcrypt.genSaltSync(10)
        return bcrypt.hashSync(pass, salt)
    }

    /**
     * Gather data from account object that will be persisted to disk
     *
     * @return {object}
     */
    serialize(): AccountData {
        const { username, characters, password, metadata } = this

        return {
            username,
            characters,
            password,
            metadata,
        }
    }
}
