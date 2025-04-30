import type { GameState } from './GameState'
import type Player from './Player'
import type QuestGoal from './QuestGoal'
import { EventEmitter } from 'node:events'

interface QuestConfig {
    entityReference: string
    title: string
    description: string
    completionMessage?: string | null
    requires?: string[]
    level?: number
    autoComplete?: boolean
    repeatable?: boolean
    rewards?: Array<{
        type: string
        config: any
    }>
    goals: Array<{
        type: string
        config: any
    }>
    desc?: string
    [key: string]: any
}

interface QuestProgress {
    percent: number
    display: string
}

/**
 * @property {object} config Default config for this quest, see individual quest types for details
 * @property {Player} player
 * @property {object} state  Current completion state
 * @extends EventEmitter
 */
class Quest extends EventEmitter {
    id: string | number
    entityReference: string
    config: QuestConfig
    player: Player
    goals: QuestGoal[]
    state: any[]
    GameState: GameState

    constructor(
        GameState: GameState,
        id: string | number,
        config: QuestConfig,
        player: Player,
    ) {
        super()

        this.id = id
        this.entityReference = config.entityReference
        this.config = Object.assign(
            {
                title: 'Missing Quest Title',
                description: 'Missing Quest Description',
                completionMessage: null,
                requires: [],
                level: 1,
                autoComplete: false,
                repeatable: false,
                rewards: [],
                goals: [],
            },
            config,
        )

        this.player = player
        this.goals = []
        this.state = []
        this.GameState = GameState
    }

    /**
     * Proxy all events to all the goals
     * @param {string} event
     * @param {...*}   args
     */
    emit(event: string, ...args: any[]): boolean {
        super.emit(event, ...args)

        if (event === 'progress') {
            // don't proxy progress event
            return true
        }

        this.goals.forEach((goal) => {
            goal.emit(event, ...args)
        })

        return true
    }

    addGoal(goal: QuestGoal): void {
        this.goals.push(goal)
        goal.on('progress', () => this.onProgressUpdated())
    }

    /**
     * @fires Quest#turn-in-ready
     * @fires Quest#progress
     */
    onProgressUpdated(): void {
        const progress = this.getProgress()

        if (progress.percent >= 100) {
            if (this.config.autoComplete) {
                this.complete()
            }
            else {
                /**
                 * @event Quest#turn-in-ready
                 */
                this.emit('turn-in-ready')
            }
            return
        }

        /**
         * @event Quest#progress
         * @param {object} progress
         */
        this.emit('progress', progress)
    }

    /**
     * @return {{ percent: number, display: string }}
     */
    getProgress(): QuestProgress {
        let overallPercent = 0
        const overallDisplay: string[] = []
        this.goals.forEach((goal) => {
            const goalProgress = goal.getProgress()
            overallPercent += goalProgress.percent
            overallDisplay.push(goalProgress.display)
        })

        return {
            percent: Math.round(overallPercent / this.goals.length),
            display: overallDisplay.join('\r\n'),
        }
    }

    /**
     * Save the current state of the quest on player save
     * @return {object}
     */
    serialize(): object {
        return {
            state: this.goals.map(goal => goal.serialize()),
            progress: this.getProgress(),
            config: {
                desc: this.config.desc,
                level: this.config.level,
                title: this.config.title,
            },
        }
    }

    hydrate(): void {
        this.state.forEach((goalState, i) => {
            this.goals[i].hydrate(goalState.state)
        })
    }

    /**
     * @fires Quest#complete
     */
    complete(): void {
    /**
     * @event Quest#complete
     */
        this.emit('complete')
        for (const goal of this.goals) {
            goal.complete()
        }
    }
}

export default Quest
