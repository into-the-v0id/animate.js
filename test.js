import { animate, timingFunctions } from './dist/index.js'

animate({
    from: 50,
    to: 275,
    durationSeconds: 1.5,
    timingFunction: timingFunctions.easeInOut(1.0),
    onStart: () => console.log('start'),
    onUpdate: (state) => console.log(state),
    onEnd: () => console.log('end'),
})
