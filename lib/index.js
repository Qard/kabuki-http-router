import transform from 'transform-arguments'
import defaults from 'defaults'
import Promise from 'bluebird'
import {v4 as id} from 'uuid'
import LRU from 'lru-cache'

const SESSION_ID = 'kabuki-http-router-id'

class Session {
  constructor () {
    this.id = id()
    this.api = {}
  }

  call(name, args) {
    return new Promise((resolve, reject) => {
      let fn = this.api[name]
      if ( ! fn) {
        return reject(name + ' does not exist')
      }
      resolve(fn(...args))
    })
  }

  register(name, fn) {
    if (this.api[name]) {
      return Promise.reject(name + ' already exists')
    }

    this.api[name] = fn
    return Promise.resolve()
  }

  deregister(name) {
    delete this.api[name]
    return Promise.resolve()
  }
}

export default function (api, options) {
  options = defaults(options || {}, {
    resolver,
    rejector,
    finder
  })

  let sessions = LRU({
    maxAge: options.maxAge || 1000 * 60 * 60,
    max: options.max || 10000
  })

  return function (method, spec, localOpts) {
    let opts = defaults(localOpts || {}, options)
    let transformer = transform(spec)

    return opts.finder(function (req, res, next) {
      req.session = req.session || {}
      let id = req.session[SESSION_ID]
      let p

      if (id) {
        req.kabuki = sessions.get(id)
        p = Promise.resolve()
      } else {
        let session = new Session()
        p = Promise.resolve(api(session)).then(() => {
          req.session[SESSION_ID] = session.id
          sessions.set(session.id, session)
          req.kabuki = session
        })
      }

      return p
        .then(() => transformer(req, res, next))
        .then((args) => req.kabuki.call(method, args))
        .then((data) => opts.resolver(data)(req, res, next))
        .catch((err) => opts.rejector(err)(req, res, next))
    })
  }
}

function finder (transform) {
  return function (req, res, next) {
    return transform(req, res, next)
  }
}

function resolver (data) {
  return function (req, res) {
    res.end(data)
  }
}

function rejector (err) {
  return function (req, res, next) {
    next(err)
  }
}
