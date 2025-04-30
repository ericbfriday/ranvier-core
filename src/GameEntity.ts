import { EventEmitter } from 'node:events';
import Metadatable from './Metadatable';
import Scriptable from './Scriptable';

/**
 * Base entity class for all game objects
 * @extends EventEmitter
 * @mixes Metadatable
 * @mixes Scriptable
 */
export default class GameEntity extends Scriptable(Metadatable(EventEmitter)) {
    constructor() {
        super();
    }
}
