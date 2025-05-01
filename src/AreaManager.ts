import Area from './Area.js';
import BehaviorManager from './BehaviorManager.js';
import Room from './Room.js';

/**
 * Stores references to, and handles distribution of, active areas
 * @property {Map<string,Area>} areas
 */
export class AreaManager {
    areas: Map<string, Area>;
    scripts: BehaviorManager;
    private _placeholder?: Area;

    constructor() {
        this.areas = new Map();
        this.scripts = new BehaviorManager();
    }

    /**
     * @param {string} name
     * @return Area
     */
    getArea(name: string): Area | undefined {
        return this.areas.get(name);
    }

    /**
     * @param {string} entityRef
     * @return Area
     */
    getAreaByReference(entityRef: string): Area | undefined {
        const [name] = entityRef.split(':');
        return this.getArea(name);
    }

    /**
     * @param {Area} area
     */
    addArea(area: Area): void {
        this.areas.set(area.name, area);
    }

    /**
     * @param {Area} area
     */
    removeArea(area: Area): void {
        this.areas.delete(area.name);
    }

    /**
     * Apply `updateTick` to all areas in the game
     * @param {GameState} state
     * @fires Area#updateTick
     */
    tickAll(state: any): void {
        for (const [name, area] of this.areas) {
            /**
             * @see Area#update
             * @event Area#updateTick
             */
            area.emit('updateTick', state);
        }
    }

    /**
     * Get the placeholder area used to house players who were loaded into
     * an invalid room
     *
     * @return {Area}
     */
    getPlaceholderArea(): Area {
        if (this._placeholder) {
            return this._placeholder;
        }

        this._placeholder = new Area(null, 'placeholder', {
            title: 'Placeholder',
        });

        const placeholderRoom = new Room(this._placeholder, {
            id: 'placeholder',
            title: 'Placeholder',
            description:
        'You are not in a valid room. Please contact an administrator.',
        });

        this._placeholder.addRoom(placeholderRoom);

        return this._placeholder;
    }
}
export default AreaManager;
