import proxy from "express-http-proxy"
import config from "../config/index.js"

// HTTP proxy to JSKOS-server backend
export default (req, res, next) => {
  if (!req.originalUrl.startsWith("/api/")) {
    const query = req.url.slice(req.path.length)
    return res.redirect(301, `/api/${query}`)
  } else {
    // Deconstruct backend API URL to proxy requests
    const url = new URL(config.backend.api)
    proxy(url.origin, {
      proxyReqPathResolver(req) {
        const path = url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname
        return path + req.url
      },
    })(req, res, next)
  }
}
