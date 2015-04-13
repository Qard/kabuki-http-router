import session from 'express-session'
import Promise from 'bluebird'
import express from 'express'
import router from '../'
import http from 'http'
import url from 'url'

describe('basic', () => {
  let servers = []

  afterEach(() => {
    return Promise.all(servers.map((server) => {
      return new Promise((done) => server.close(done))
    }))
  })

  it('should support basic routing', () => {
    let api = (session) => {
      return session.register('hello', (name) => {
        return `Hello, ${name}!`
      })
    }

    let handle = router(api)
    let app = express()

    app.get('/hello/:name', handle('hello', [
      { get: 'params.name' }
    ]))

    return makeServer(app, servers).then((port) => {
      return get(`http://localhost:${port}/hello/world`)
    }).then((res) => {
      res.body.should.equal('Hello, world!')
    })
  })

  it('should support evolving interface', () => {
    let api = (session) => {
      return session.register('auth', (user, pass) => {
        if (user !== 'foo' || pass !== 'bar') {
          return Promise.reject('Invalid username/password')
        }

        return session.register('hello', (name) => {
          return `Hello, ${name}!`
        })
      })
    }

    let handle = router(api)
    let app = express()

    app.use(handle('auth', [
      { get: 'query.user' },
      { get: 'query.pass' }
    ], {
      resolver: (run, req, res, next) => {
        run().then(() => next(), next)
      }
    }))

    app.get('/hello/:name', handle('hello', [
      { get: 'params.name' }
    ]))

    return makeServer(app, servers).then((port) => {
      return get(`http://localhost:${port}/hello/world?user=foo&pass=bar`)
    }).then((res) => {
      res.body.should.equal('Hello, world!')
    })
  })

  it('should fail calls to unregistered functions gracefully', () => {
    let handle = router(() => {})
    let app = express()

    app.get('/hello/:name', handle('hello', [
      { get: 'params.name' }
    ]))

    app.use((err, req, res, next) => {
      res.status(500).send(err)
    })

    return makeServer(app, servers).then((port) => {
      return get(`http://localhost:${port}/hello/world`)
    }).then((res) => {
      res.status.should.equal(500)
      res.body.should.equal('hello does not exist')
    })
  })

  it('should support sessions', () => {
    let api = (session) => {
      let num = 1
      return session.register('increment', () => (num++).toString())
    }

    let handle = router(api)

    let app = express()
    app.use(session({
      cookie: { maxAge: 60000 },
      saveUninitialized: true,
      secret: 'keyboard cat',
      resave: false
    }))

    app.get('/increment', handle('increment', []))

    return makeServer(app, servers).then((port) => {
      return get(`http://localhost:${port}/increment`).then((res) => {
        res.body.should.equal('1')
        return get(`http://localhost:${port}/increment`, res.cookie)
      }).then((res) => {
        res.body.should.equal('2')
      })
    })
  })

})

let makeServer = (app, servers) => {
  let server = http.createServer(app)
  return new Promise((resolve) => {
    server.listen(() => {
      servers.push(server)
      resolve(server.address().port)
    })
  })
}

let get = (address, cookie) => {
  let parsed = typeof address === 'string' ? url.parse(address) : address
  if (cookie) {
    parsed.headers = parsed.headers || {}
    parsed.headers.cookie = cookie
  }

  return new Promise((resolve, reject) => {
    let req = http.get(parsed, (res) => {
      let chunks = []
      res.on('error', reject)
      res.on('data', (c) => chunks.push(c.toString()))
      res.on('end', () => {
        resolve({
          cookie: res.headers['set-cookie'],
          status: res.statusCode,
          body: chunks.join('')
        })
      })
    })
  })
}
