var express = require('express');
var router = express.Router();

const fs = require('fs');

let accounts = {
  get: function() {
    if (!fs.existsSync('./accounts.json')) fs.writeFileSync('accounts.json', JSON.stringify({ accounts: [] }));
    return JSON.parse(fs.readFileSync('./accounts.json', 'utf8')).accounts;
  },
  put: function(username, authentication) {
    let accounts = this.get();
    if(!username || this.has(username)) return; // Don't add an empty or existing account (TODO: Override?)
    accounts.push({ username: username, authentication: authentication });
    fs.writeFileSync('accounts.json', JSON.stringify({ accounts: accounts }));
    return this.get();
  },
  has: function(username) {
    let accounts = this.get();
    return accounts.find(obj => obj.username.toLowerCase() == username.toLowerCase());
  },
  delete: function(username) {
    let accounts = this.get();
    let index = accounts.findIndex(obj => obj.username == username);
    if(index > -1) accounts.splice(index, 1)
    fs.writeFileSync('accounts.json', JSON.stringify({ accounts: accounts }));
    return accounts;
  }
}

console.log('Saved Accounts:', accounts.get())

router.get('/get', function(req, res, next) {
  res.json({ accounts: accounts.get() });
});

router.put('/put', function(req, res, next) {
  console.log('PUT:', req.body.authentication)
  res.json({ accounts: accounts.put(req.body.username, req.body.authentication) });
});

router.delete('/delete', function(req, res, next) {
  console.log('Trying to delete:', req.body.username)
  res.json({ accounts: accounts.delete(req.body.username) });
});

module.exports = router;
