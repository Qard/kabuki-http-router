import Promise from 'bluebird'
import {v4 as id} from 'uuid'

const SESSION_ID = 'kabuki-http-router-id'

export default class Session {
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

  static load(req, cache, api) {
    let id = (req.session && req.session[SESSION_ID]) || req[SESSION_ID]
    let p

    if (id) {
      let session = cache.get(id)
      if (session) {
        req.kabuki = session
        return Promise.resolve(session)
      }
    }

    let session = new Session()
    return Promise.resolve(api(session)).then(() => {
      req[SESSION_ID] = session.id
      if (req.session) {
        req.session[SESSION_ID] = session.id
      }
      cache.set(session.id, session)
      req.kabuki = session
      return session
    })
  }
}
