import { koa, express } from 'promise-route'
import transform from 'transform-arguments'
import defaults from 'defaults'
import Promise from 'bluebird'
import LRU from 'lru-cache'

import Session from './session'

export default function (api, options) {
  options = defaults(options || {}, {
    framework: 'express',
    maxAge: 1000 * 60 * 60,
    max: 10000
  })

  let cache = LRU({
    maxAge: options.maxAge,
    max: options.max
  })

  let finder = require('./' + options.framework)
  let interfaces = { koa, express }

  return function (method, spec, localOpts) {
    let opts = defaults(localOpts || {}, options)
    let makeRoute = interfaces[opts.framework]
    let transformer = transform(spec)

    return makeRoute(function (req, res, next) {
      return Session.load(req, cache, api)
        .then((session) => {
          return transformer(req, res, next)
            .then((args) => session.call(method, args))
        })
    }, finder, opts.resolver)
  }
}
