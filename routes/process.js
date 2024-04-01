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

router.put('/send', function(req, res, next) {
  let { pid, command } = req.body;

  console.log(`[Command #${pid}] Sending: "${command}"`)

  res.json({ temp: 'idk what to respond with' })
})

// Start a child process
router.put('/create', function(req, res, next) {

  let child = fork(path.resolve('./child_process/client.js'), [], {
     stdio: [ 'inherit', 'inherit', 'inherit', 'ipc' ],
     env: Object.assign(process.env, {
       createBot: JSON.stringify(req.body)
     })
  })

  child_processes.push(child)

  res.json({ child: child.pid });
});


module.exports = router;