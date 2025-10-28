const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://localhost:7297', // твой API
      changeOrigin: true,
      secure: false // игнорировать self-signed TLS
    })
  );
};
