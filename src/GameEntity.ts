import { EventEmitter } from 'node:events';
import Metadatable from './Metadatable.js';
import Scriptable from './Scriptable.js';

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
