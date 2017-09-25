# kabuki-http-router

[![Greenkeeper badge](https://badges.greenkeeper.io/Qard/kabuki-http-router.svg)](https://greenkeeper.io/)

This is an experimental module to allow interacting with a
[kabuki](http://npm.im/kabuki) service through HTTP. It has basic session
support and works with any framework supported by
[promise-route](http://npm.im/promise-route).

## Install

```sh
npm install kabuki-http-router
```

## Usage

```js
import routeBuilder from 'kabuki-http-router'
import router from 'koa-router'
import koa from 'koa'

// Define a kabuki service
let api = (session) => {
  return session.register('hello', (name) => {
    return `Hello, ${name}`
  })
}

// Build router to map request handlers to service calls
let build = routeBuilder(api, {
  framework: 'koa'
})

// Create koa app
let app = koa()
app.use(router(app))

// Translate GET /hello/:name requests to service.hello(name) calls
app.get('/hello/:name', build('hello', [
  { get: 'params.name' }
]))

app.listen(3000)
```

---

### Copyright (c) 2015 Stephen Belanger
#### Licensed under MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
