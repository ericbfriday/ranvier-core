import type { EventEmitter } from 'node:events';
import { isIterable } from './Util.js';

type Listener = (...args: any[]) => void;

/**
 * Generic array hash table to store listener definitions
 * `events` is a `Map` whose keys are event names values are the
 * `Set` of listeners to be attached for that event
 */
export class EventManager {
    private events: Map<string, Set<Listener>>;

    constructor() {
        this.events = new Map();
    }

    /**
     * Fetch all listeners for a given event
     * @param name - Event name
     */
    get(name: string): Set<Listener> | undefined {
        return this.events.get(name);
    }

    /**
     * Add an event listener
     * @param eventName - Name of the event
     * @param listener - Listener function
     */
    add(eventName: string, listener: Listener): void {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, new Set());
        }
        this.events.get(eventName)!.add(listener);
    }

    /**
     * Attach all currently added events to the given emitter
     * @param emitter - Event emitter
     * @param config - Optional configuration object
     */
    attach(emitter: EventEmitter, config?: any): void {
        for (const [event, listeners] of this.events) {
            for (const listener of listeners) {
                if (config) {
                    emitter.on(event, listener.bind(emitter, config));
                }
                else {
                    emitter.on(event, listener.bind(emitter));
                }
            }
        }
    }

    /**
     * Remove all listeners for a given emitter or only those for the given events
     * If no events are given it will remove all listeners from all events defined
     * in this manager.
     *
     * Warning: This will remove _all_ listeners for a given event list, this includes
     * listeners not in this manager but attached to the same event
     *
     * @param emitter - Event emitter
     * @param events - Optional name or list of event names to remove listeners from
     */
    detach(emitter: EventEmitter, events?: string | Iterable<string>): void {
        if (typeof events === 'string') {
            events = [events];
        }
        else if (!events) {
            events = this.events.keys();
        }
        else if (!isIterable(events)) {
            throw new TypeError('events list passed to detach() is not iterable');
        }

        for (const event of events) {
            emitter.removeAllListeners(event);
        }
    }
}
export default EventManager;