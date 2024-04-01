var express = require('express');
var router = express.Router();

const fs = require('fs');

let servers = {
  get: function() {
    if (!fs.existsSync('./servers.json')) fs.writeFileSync('servers.json', JSON.stringify({ servers: [] }));
    return JSON.parse(fs.readFileSync('./servers.json', 'utf8')).servers;
  },
  put: function(hostname, port, version, authentication) {
    let servers = this.get();
    if(!hostname || this.has(hostname)) return; // Don't add an empty or existing server (TODO: Override?)
    servers.push({ hostname: hostname, port: port, version: version, authentication: authentication });
    fs.writeFileSync('servers.json', JSON.stringify({ servers: servers }));
    return this.get();
  },
  has: function(hostname) {
    let servers = this.get();
    return servers.find(obj => obj.hostname.toLowerCase() == hostname.toLowerCase());
  },
  delete: function(hostname) {
    let servers = this.get();
    let index = servers.findIndex(obj => obj.hostname == hostname);
    if(index > -1) servers.splice(index, 1)
    fs.writeFileSync('servers.json', JSON.stringify({ servers: servers }));
    return servers;
  }
}

console.log('Saved Servers:', servers.get())

router.get('/get', function(req, res, next) {
  res.json({ servers: servers.get() });
});

router.put('/put', function(req, res, next) {
  res.json({ servers: servers.put(req.body.hostname, req.body.port, req.body.version, req.body.authentication) });
});

router.delete('/delete', function(req, res, next) {
  res.json({ servers: servers.delete(req.body.hostname) });
});

module.exports = router;
