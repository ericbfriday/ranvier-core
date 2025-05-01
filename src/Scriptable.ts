import type BehaviorManager from './BehaviorManager.js';
import Logger from './Logger.js';

/**
 * @ignore
 * @exports ScriptableFn
 * @param {*} parentClass
 * @return {module:ScriptableFn~Scriptable}
 */
export function Scriptable<T extends new (...args: any[]) => any>(parentClass: T) {
    return class extends parentClass {
        behaviors: Map<string, any>;
        __pruned?: boolean;

        emit(name: string, ...args: any[]): void {
            // Squelch events on a pruned entity. Attempts to prevent the case where an entity has been effectively removed
            // from the game but somehow still triggered a listener. Set by respective entity Manager class
            if (this.__pruned) {
                this.removeAllListeners();
                return;
            }

            super.emit(name, ...args);
        }

        /**
         * @param {string} name
         * @return {boolean}
         */
        hasBehavior(name: string): boolean {
            return this.behaviors.has(name);
        }

        /**
         * @param {string} name
         * @return {*}
         */
        getBehavior(name: string): any {
            return this.behaviors.get(name);
        }

        /**
         * Attach this entity's behaviors from the manager
         * @param {BehaviorManager} manager
         */
        setupBehaviors(manager: BehaviorManager): void {
            for (let [behaviorName, config] of this.behaviors) {
                const behavior = manager.get(behaviorName);
                if (!behavior) {
                    Logger.warn(
                        `No script found for [${this.constructor.name}] behavior '${behaviorName}'`,
                    );
                    continue;
                }

                // behavior may be a boolean in which case it will be `behaviorName: true`
                config = config === true ? {} : config;
                behavior.attach(this, config);
            }
        }

        removeAllListeners(): void {
            // This method is implemented by EventEmitter which is assumed to be a parent class
            super.removeAllListeners();
        }
    };
}

export default Scriptable;
