/*!
 * Copyright (C) Oliver Amann
 *
 * Licensed under the MIT License. You may not use this file except
 * according to those terms.
 *
 * @license MIT
 */

import * as timingFunctions from './timing-functions.js'
import { TimingFunction } from './timing-functions.js'

export { timingFunctions }

export interface AnimationConfig {
    from: number,
    to: number,
    durationSeconds: number,
    /** Start progress in percent between 0.0 and 1.0 */
    progress?: number,
    timingFunction?: TimingFunction,
    maxFps?: number,
    onStart?: () => void,
    onUpdate: (state: number, stateProgress: number, timeProgress: number) => void,
    onPause?: (timeProgress: number) => void,
    onResume?: (timeProgress: number) => void,
    onEnd?: () => void,
    onCancel?: () => void,
    /** Getter for a stable source of time for the envioronment */
    relativeTimeSeconds?: () => number,
    /** Hook to schedule a task for the next iteration of the event loop of the envioronment */
    enqueue?: (callback: () => void) => void,
}

export class Animation {
    private config: AnimationConfig

    private getRelativeTimeSeconds: () => number
    private enqueue: (callback: () => void) => void

    private minHandlerCallTimeElapsed: number|null
    private lastHandlerCallTime: number|null = null

    private startTime: number|null = null
    private pauseTime: number|null = null
    private resumeTime: number|null = null
    private endTime: number|null = null
    private cancelTime: number|null = null

    private timeProgress: number

    constructor(config: AnimationConfig) {
        // Copy config in order to avoid modification from caller
        this.config = {...config}

        if (this.config.relativeTimeSeconds) {
            this.getRelativeTimeSeconds = this.config.relativeTimeSeconds
        } else if (typeof performance === 'object' && typeof performance.now === 'function') {
            this.getRelativeTimeSeconds = () => performance.now() / 1000
        } else {
            this.getRelativeTimeSeconds = () => Date.now() / 1000
        }

        if (this.config.enqueue) {
            this.enqueue = this.config.enqueue
        } else if (typeof requestAnimationFrame === 'function') {
            this.enqueue = (callback) => requestAnimationFrame(callback)
        } else if (typeof setImmediate === 'function') {
            this.enqueue = (callback) => setImmediate(callback)
        } else {
            this.enqueue = (callback) => setTimeout(callback, 0)
        }

        this.minHandlerCallTimeElapsed = this.config.maxFps
            ? 1 / this.config.maxFps
            : null

        this.timeProgress = this.config.progress ?? 0.0
    }

    public isRunning(): boolean {
        return this.hasStarted()
            && ! this.hasEnded()
            && ! this.isPaused()
            && ! this.isCanceled()
    }

    public hasStarted(): boolean {
        return this.startTime !== null
    }

    public start(): void {
        if (this.hasStarted() || this.isCanceled()) return

        this.startTime = (this.getRelativeTimeSeconds)()

        if (this.config.onStart) {
            this.config.onStart()

            // set start time again so that we have accurate timings for the handler in case
            // this.config.onStart() took a long time to execute
            this.startTime = (this.getRelativeTimeSeconds)()
        }

        // render initial state and start the loop
        this.handler(this.timeProgress)
    }

    private handler(timeProgress: number|null = null): void {
        // Break the loop since the animation should not be running
        if (! this.isRunning()) return

        const currentTime = (this.getRelativeTimeSeconds)()

        // limit FPS
        if (
            this.config.maxFps
            && this.minHandlerCallTimeElapsed !== null
            && this.lastHandlerCallTime !== null
        ) {
            const lastHandlerCallTimeElapsed = currentTime - this.lastHandlerCallTime
            if (lastHandlerCallTimeElapsed < this.minHandlerCallTimeElapsed) {
                this.scheduleHandlerCall()

                return
            }
        }

        this.lastHandlerCallTime = currentTime

        if (timeProgress === null) {
            const elapsedTime = currentTime - (this.resumeTime ?? this.startTime ?? currentTime)
            const additionalTimeProgress = elapsedTime / this.config.durationSeconds
            timeProgress = this.timeProgress + additionalTimeProgress
        }

        // end animation
        if (timeProgress >= 1.0) {
            this.end()

            return
        }

        this.render(timeProgress)
        this.scheduleHandlerCall()
    }

    private scheduleHandlerCall(): void {
        (this.enqueue)(() => this.handler())
    }

    private render(timeProgress: number): void {
        if (timeProgress > 1.0) {
            timeProgress = 1.0
        }

        if (timeProgress < 0.0) {
            timeProgress = 0.0
        }

        const stateProgress = this.config.timingFunction
            ? this.config.timingFunction(timeProgress)
            : timeProgress

        const state = this.config.from + ((this.config.to - this.config.from) * stateProgress)

        this.config.onUpdate(state, stateProgress, timeProgress)
    }

    public isPaused(): boolean {
        return this.pauseTime !== null
    }

    public pause(): void {
        if (this.isPaused() || this.isCanceled()) return

        const currentTime = (this.getRelativeTimeSeconds)()
        const elapsedTime = currentTime - (this.resumeTime ?? this.startTime ?? currentTime)
        const additionalTimeProgress = elapsedTime / this.config.durationSeconds

        this.timeProgress += additionalTimeProgress

        this.pauseTime = currentTime
        this.resumeTime = null

        if (this.config.onPause) this.config.onPause(this.timeProgress)
    }

    public resume(): void {
        if (! this.isPaused() || this.isCanceled()) return

        this.resumeTime = (this.getRelativeTimeSeconds)()
        this.pauseTime = null

        if (this.config.onResume) {
            this.config.onResume(this.timeProgress)

            // set resume time again so that we have accurate timings for the handler in case
            // this.config.onResume() took a long time to execute
            this.resumeTime = (this.getRelativeTimeSeconds)()
        }

        // start loop again
        this.handler(this.timeProgress)
    }

    public hasEnded(): boolean {
        return this.endTime !== null
    }

    public end(): void {
        if (this.hasEnded() || this.isCanceled()) return

        this.render(1.0)

        this.timeProgress = 1.0
        this.endTime = (this.getRelativeTimeSeconds)()

        if (this.config.onEnd) this.config.onEnd()
    }

    public isCanceled(): boolean {
        return this.cancelTime !== null
    }

    public cancel(): void {
        if (this.isCanceled()) return

        this.cancelTime = (this.getRelativeTimeSeconds)()

        if (this.config.onCancel) this.config.onCancel()
    }

    public promise(): Promise<void> {
        if (this.hasEnded()) {
            return Promise.resolve(undefined)
        }

        if (this.isCanceled()) {
            return Promise.reject(undefined)
        }

        return new Promise((resolve, reject) => {
            const originalOnEnd = this.config.onEnd
            this.config.onEnd = () => {
                if (originalOnEnd) originalOnEnd()
                resolve(undefined)
            }

            const originalOnCancel = this.config.onCancel
            this.config.onCancel = () => {
                if (originalOnCancel) originalOnCancel()
                reject(undefined)
            }
        })
    }
}

export function animate(config: AnimationConfig & {autoStart?: boolean}): Animation {
    const animation = new Animation(config)

    if (config.autoStart ?? true) {
        animation.start()
    }

    return animation
}
