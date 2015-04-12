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
      resolver: (data) => (req, res, next) => next()
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

let get = (address) => {
  let parsed = url.parse(address)
  return new Promise((resolve, reject) => {
    let req = http.get(address, (res) => {
      let chunks = []
      res.on('error', reject)
      res.on('data', (c) => chunks.push(c.toString()))
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: chunks.join('')
        })
      })
    })
  })
}
