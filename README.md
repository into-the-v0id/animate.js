# Animate

Low level animation library for JavaScript

## Installation

This package is not available on npm. To use it you will have to install it from source:

```bash
npm install git://github.com/into-the-v0id/animate.js
```

## Example

```js
import { animate, timingFunctions } from '@into-the-v0id/animate'

animate({
    from: 50,
    to: 275,
    durationSeconds: 1.5,
    timingFunction: timingFunctions.easeInOut(),
    onUpdate: (state) => console.log(state),
})
```

## License

Copyright (C) Oliver Amann

This project is licensed under the MIT License (MIT). Please see [LICENSE](./LICENSE) for more information.
