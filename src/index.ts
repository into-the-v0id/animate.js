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

export interface AnimationConfig {
    from: number,
    to: number,
    durationSeconds: number,
    /** Start progress in percent between 0.0 and 1.0 */
    startProgress?: number,
    timingFunction?: TimingFunction,
    onStart?: () => void,
    onUpdate: (state: number, stateProgress: number, timeProgress: number) => void,
    onEnd?: () => void,
    /** Getter for a stable source of time for the envioronment */
    relativeTimeSeconds?: () => number,
    /** Hook to schedule a task for the next iteration of the event loop of the envioronment */
    enqueue?: (callback: () => void) => void,
}

export { timingFunctions }

export function animate(config: AnimationConfig): void {
    let relativeTimeSeconds = config.relativeTimeSeconds
    if (! relativeTimeSeconds) {
        if (typeof performance === 'object' && typeof performance.now === 'function') {
            relativeTimeSeconds = () => performance.now() / 1000
        } else {
            relativeTimeSeconds = () => Date.now() / 1000
        }
    }

    let enqueue = config.enqueue
    if (! enqueue) {
        if (typeof requestAnimationFrame === 'function') {
            const _requestAnimationFrame = requestAnimationFrame
            enqueue = (callback) => _requestAnimationFrame(callback)
        } else if (typeof setImmediate === 'function') {
            const _setImmediate = setImmediate
            enqueue = (callback) => _setImmediate(callback)
        } else {
            enqueue = (callback) => setTimeout(callback, 0)
        }
    }

    if (config.onStart) config.onStart();

    const startTime = relativeTimeSeconds();

    const handler = function (timeProgress: number|null = null) {
        if (timeProgress === null) {
            const elapsedTime = relativeTimeSeconds() - startTime
            timeProgress = elapsedTime / config.durationSeconds
        }

        if (config.startProgress) {
            timeProgress += config.startProgress
        }

        if (timeProgress > 1.0) {
            timeProgress = 1.0
        }

        if (timeProgress < 0.0) {
            timeProgress = 0.0
        }

        const stateProgress = config.timingFunction
            ? config.timingFunction(timeProgress)
            : timeProgress

        const state = config.from + ((config.to - config.from) * stateProgress);

        config.onUpdate(state, stateProgress, timeProgress)

        if (timeProgress >= 1.0) {
            if (config.onEnd) config.onEnd();

            return;
        }

        enqueue(() => handler());
    }

    handler(0.0);
}

export function animatePromise(config: AnimationConfig): Promise<void> {
    return new Promise((resolve, reject) => {
        const newConfig = {
            ...config,
            onEnd: () => {
                if (config.onEnd) config.onEnd()
                resolve(undefined)
            }
        }

        try {
            animate(newConfig)
        } catch (e) {
            reject(e)
        }
    });
}
