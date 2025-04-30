import type { Player } from './Player'
import { Party } from './Party'

/**
 * Keeps track of active in game parties and is used to create new parties
 * @extends Set
 */
class PartyManager extends Set<Party> {
    /**
     * Create a new party from with a given leader
     * @param {Player} leader
     * @return {Party} The newly created party
     */
    create(leader: Player): Party {
        const party = new Party(leader)
        this.add(party)
        return party
    }

    /**
     * @param {Party} party
     */
    disband(party: Party): void {
        this.delete(party)
        party.disband()
    }
}

export default PartyManager
