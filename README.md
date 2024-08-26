# Animate

Low level animation library for JavaScript

## Installation

This package is not available on npm. To use it you will have to build it from source:

```bash
git clone https://github.com/into-the-v0id/animate.js.git ./animate
cd ./animate
npm install
npm pack
cd ..
cd your-project
npm install ../animate/into-the-v0id-animate-0.1.0.tgz
```

## Example

```js
import { animate, timingFunctions } from '@into-the-v0id/animate'

const element = document.querySelector('#animateMe')

animate({
    from: 0,
    to: 300,
    durationSeconds: 1.5,
    timingFunction: timingFunctions.easeInOut(),
    onUpdate: (state) => element.style.left = state + 'px',
})
```

```js
import { animate, timingFunctions } from '@into-the-v0id/animate'

const animation = animate({
    from: 0,
    to: 100,
    durationSeconds: 2.0,
    timingFunction: timingFunctions.gravitate(
        timingFunctions.allOrNothing(),
        timingFunctions.linear(),
    ),
    maxFps: 10,
    progress: 0.5, // Start at 50% animation progress
    onStart: () => console.log('start via callback'),
    onUpdate: (state) => console.log(state),
    onEnd: () => console.log('end via callback'),
    autoStart: false,
})

animation.start()

setTimeout(() => animation.pause(), 400)
setTimeout(() => animation.resume(), 800)

animation.promise()
    .then(() => conosle.log('end via promise'))
```

## License

Copyright (C) Oliver Amann

This project is licensed under the MIT License (MIT). Please see [LICENSE](./LICENSE) for more information.
