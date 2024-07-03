var express = require('express');
var router = express.Router();

const path = require('path')
const fork = require('child_process').fork;

// const program = path.resolve('../child_proces/client.js');

let child_processes = [];

router.get('/get', function(req, res, next) {
  if(!req.query.pid) return res.json({ error: `There was no process with PID ${req.query.pid}.`})

  let child = child_processes.find(ch => ch.pid === req.query.pid);

  res.json({ child: child.pid })
});

// Get the websocket connections, for refreshing page, or reconnecting if the website fails (but bots stay up)
router.get('/fetch', function(req, res, next) {

  let sessions = child_processes.map(ch => ({ env: ch.env, port: ch.pid }));

  // TODO: Respond with data for createBot to pass to card
  res.json({ sessions: sessions })
});

router.put('/send', function(req, res, next) {
  let { pid, command } = req.body;

  console.log(`[Command #${pid}] Sending: "${command}"`)

  res.json({ temp: 'idk what to respond with' })
})

// Start a child process
router.put('/create', function(req, res, next) {

  let environment = JSON.stringify(req.body);
  let child = fork(path.resolve('./child_process/client.js'), [], {
     stdio: [ 'inherit', 'inherit', 'inherit', 'ipc' ],
     env: Object.assign(process.env, {
       createBot: environment
     })
  })
  child.env = req.body;

  child_processes.push(child)

  res.json({ child: child.pid });
});


module.exports = router;