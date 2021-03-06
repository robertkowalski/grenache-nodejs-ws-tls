'use strict'

const { PeerRPCServer, Link } = require('../../')
const _ = require('lodash')
const fs = require('fs')
const path = require('path')

const CLIENT_FINGERPRINT = process.argv[2]
if (!CLIENT_FINGERPRINT) throw new Error('please supply a fingerprint as first argument')

const link = new Link({
  grape: 'http://127.0.0.1:30001'
})
link.start()

const opts = {
  secure: {
    key: fs.readFileSync(path.join(__dirname, 'server-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'server-crt.pem')),
    ca: fs.readFileSync(path.join(__dirname, 'ca-crt.pem')),
    requestCert: true,
    rejectUnauthorized: false, // take care, can be dangerous in production!
    verifyClient: (info, cb) => {
      // eslint-disable-next-line
      cb(true)
    }
  }
}
const peer = new PeerRPCServer(
  link,
  opts
)
peer.init()

const service = peer.transport('server')
service.listen(_.random(1000) + 1024)

setInterval(function () {
  link.announce('rpc_test', service.port, {})
}, 1000)

service.on('request', (rid, key, payload, handler, cert) => {
  let res = 'fingerprint did not match! :('
  if (cert.fingerprint === CLIENT_FINGERPRINT) {
    res = 'fingerprint validated'
  }

  handler.reply(null, res)
})
