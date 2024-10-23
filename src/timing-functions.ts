export interface TimingFunction {
    /**
     * @param {Number} progress Time progress in percent between 0.0 and 1.0
     *
     * @return {Number} State progress in percent (1.0 = 100%)
     */
    (progress: number): number
}

export function linear(): TimingFunction {
    return function (progress: number): number {
        return progress
    }
}

export function cubicBezier(x1: number, y1: number, x2: number, y2: number): TimingFunction {
    return function (progress: number): number {
        const strength1 = x1
        const strength2 = 1 - x2

        const targetDelta1 = y1 - progress
        const targetDelta2 = y2 - progress

        const progress1 = 1 - progress
        const progress2 = progress

        const power1 = progress1 ** 2
        const power2 = progress2 ** 2

        const shift1 = targetDelta1 * (strength1 * power1)
        const shift2 = targetDelta2 * (strength2 * power2)

        return progress + shift1 + shift2
    }
}

export function easeInOut(strength: number = 0.5): TimingFunction {
    return cubicBezier(strength, 0, 1 - strength, 1);
}

export function easeIn(strength: number = 0.5): TimingFunction {
    return cubicBezier(strength, 0, 1, 1);
}

export function easeOut(strength: number = 0.5): TimingFunction {
    return cubicBezier(0, 0, 1 - strength, 1);
}

export function allOrNothing(threshold: number = 0.5): TimingFunction {
    return function (progress: number): number {
        return progress >= threshold ? 1.0 : 0.0
    }
}

export function steps(count: number): TimingFunction {
    return function (progress: number): number {
        return Math.floor(progress * count) / count
    }
}

export function fixed(progress: number): TimingFunction {
    return function (): number {
        return progress
    }
}

export function filpX(timingFunction: TimingFunction): TimingFunction {
    return function (progress: number): number {
        return timingFunction(1.0 - progress)
    }
}

export function filpY(timingFunction: TimingFunction): TimingFunction {
    return function (progress: number): number {
        return 1.0 - timingFunction(progress)
    }
}

export function gravitate(orbitor: TimingFunction, gravitator: TimingFunction): TimingFunction {
    const getSectionDeltaInfo = (startProgress: number): {maxDelta: number, startProgress: number, endProgress: number} => {
        let maxDelta = 0.0
        let maxDeltaAbs = 0.0
        let endProgress = startProgress;

        for (let progress = startProgress; progress <= 1.0; progress += 0.01) {
            const orbitorState = orbitor(progress)
            const gravitatorState = gravitator(progress)

            const deltaState = orbitorState - gravitatorState

            // break on intersection
            if (
                (deltaState > 0.0 && maxDelta < 0.0)
                || (deltaState < 0.0 && maxDelta > 0.0)
            ) {
                break
            }

            const deltaStateAbs = Math.abs(deltaState)

            if (deltaStateAbs > maxDeltaAbs) {
                maxDelta = deltaState
                maxDeltaAbs = deltaStateAbs
            }

            endProgress = progress
        }

        return {
            maxDelta: maxDeltaAbs,
            startProgress,
            endProgress,
        }
    }

    let currentSectionDeltaInfo = getSectionDeltaInfo(0.0)

    return function (progress: number): number {
        const orbitorState = orbitor(progress)
        const gravitatorState = gravitator(progress)

        if (progress > currentSectionDeltaInfo.endProgress) {
            currentSectionDeltaInfo = getSectionDeltaInfo(progress)
        }

        const deltaState = Math.abs(orbitorState - gravitatorState)
        const deltaStateRelative = currentSectionDeltaInfo.maxDelta === 0.0
            ? 0.0
            : deltaState / currentSectionDeltaInfo.maxDelta

        return orbitorState + ((gravitatorState - orbitorState) * deltaStateRelative)
    }
}

export function random(): TimingFunction {
    return cached(function (progress: number): number {
        return Math.random()
    })
}

export function cached(timingFunction: TimingFunction): TimingFunction {
    const cache = new Map<number, number>();

    return function (progress: number): number {
        const cacheResult = cache.get(progress)
        if (cacheResult !== undefined) {
            return cacheResult
        }

        const result = timingFunction(progress)

        cache.set(progress, result)

        return result
    }
}
