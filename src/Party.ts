import type { Player } from './Player';

/**
 * Representation of an adventuring party
 */
class Party extends Set<Player> {
    invited: Set<Player>;
    leader: Player;

    constructor(leader: Player) {
        super();
        this.invited = new Set<Player>();
        this.leader = leader;
        this.add(leader);
    }

    delete(member: Player): boolean {
        const result = super.delete(member);
        member.party = null;
        return result;
    }

    add(member: Player): this {
        super.add(member);
        member.party = this;
        this.invited.delete(member);
        return this;
    }

    disband(): void {
        for (const member of this) {
            this.delete(member);
        }
    }

    invite(target: Player): void {
        this.invited.add(target);
    }

    isInvited(target: Player): boolean {
        return this.invited.has(target);
    }

    removeInvite(target: Player): boolean {
        return this.invited.delete(target);
    }

    getBroadcastTargets(): Player[] {
        return [...this];
    }
}

export default Party;
