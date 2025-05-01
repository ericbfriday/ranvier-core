import type EntityLoader from './EntityLoader.js';
import Account from './Account.js';

/**
 * Creates/loads {@linkplain Account|Accounts}
 * @property {Map<string,Account>} accounts
 * @property {EntityLoader} loader
 */
export class AccountManager {
    accounts: Map<string, Account>;
    loader: EntityLoader | null;

    constructor() {
        this.accounts = new Map();
        this.loader = null;
    }

    /**
     * Set the entity loader from which accounts are loaded
     * @param {EntityLoader} loader
     */
    setLoader(loader: EntityLoader): void {
        this.loader = loader;
    }

    /**
     * @param {Account} acc
     */
    addAccount(acc: Account): void {
        this.accounts.set(acc.username, acc);
    }

    /**
     * @param {string} username
     * @return {Account|undefined}
     */
    getAccount(username: string): Account | undefined {
        return this.accounts.get(username);
    }

    /**
     * @param {string} username
     * @param {boolean} force Force reload data from disk
     */
    async loadAccount(username: string, force?: boolean): Promise<Account> {
        if (this.accounts.has(username) && !force) {
            return this.getAccount(username)!;
        }

        if (!this.loader) {
            throw new Error('No entity loader configured for accounts');
        }

        const data = await this.loader.fetch(username);

        const account = new Account(data);
        this.addAccount(account);

        return account;
    }
}

export default AccountManager;
