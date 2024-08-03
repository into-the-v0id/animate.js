export interface TimingFunction {
    /**
     * @param {Number} Time progress in percent between 0.0 and 1.0
     *
     * @return {Number} State progress in percent between 0.0 and 1.0
     */
    (progress: number): number
}

export function linear(): TimingFunction {
    return function (progress: number): number {
        return progress
    }
}

export function cubicBezier(x1: number, y1: number, x2: number, y2: number): TimingFunction {
    const _x1 = x1
    const _y1 = y1
    const _x2 = x2
    const _y2 = y2

    return function (progress: number): number {
        const diff1 = _x1
        const diff2 = 1 - _x2

        const delta1 = _y1 - progress
        const delta2 = _y2 - progress

        const progress1 = 1 - progress
        const progress2 = progress

        const power1 = progress1 ** 2
        const power2 = progress2 ** 2

        const influence1 = delta1 * (diff1 * power1)
        const influence2 = delta2 * (diff2 * power2)

        return progress + influence1 + influence2
    }
}

export function easeInOut(strength: number = 0.5): TimingFunction {
    return cubicBezier(1 * strength, 0, 1 - (1 * strength), 1);
}

export function easeIn(strength: number = 0.5): TimingFunction {
    return cubicBezier(1 * strength, 0, 1, 1);
}

export function easeOut(strength: number = 0.5): TimingFunction {
    return cubicBezier(0, 0, 1 - (1 * strength), 1);
}
