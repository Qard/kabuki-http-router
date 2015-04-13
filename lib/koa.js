
export default function* (next) {
  return [this.req, this.res, next]
}
