// We should process commands in the child
// because the logic will be applied easier.

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.pid });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    let data = JSON.parse(message);
    switch(data.task) {
      case 'command':
        runCommand(data.cmd, data.args)
        break;
      default:
        console.log('UNCAUGHT TASK:', data)
    }
  });
  ws.echo = (msg) => {
    console.log('[Process] Echo:', msg)
    ws.send(JSON.stringify({
      task: 'echo',
      msg: msg
    }))
  }

  ws.json = (msg) => {
    ws.send(JSON.stringify(msg))
  }

  function runCommand(cmd, args) {
    if(cmd === 'exit') {
      bot.end()
      ws.json({ task: 'exit' });
    }
    if(cmd === 'disconnect') {
      ws.echo('Gracefully disconnecting from the server..')
      bot.end();
    }
  }

  connect(ws)
});


// Server-command logic vs Client-command-recieved logic
let mineflayer = require('mineflayer');

// We pass a JSON.stringify'd version of createBot() options to process.env
let bot = null;
const sleep = ms => new Promise((resolve) => setTimeout(resolve, ms))

async function connect(ws) {
  console.log('createBot:', process.env.createBot)

  bot = mineflayer.createBot(JSON.parse(process.env.createBot));
  
  bot.on('error', ws.echo);
  bot.on('kicked', ws.echo);

  bot.once('spawn', function() {
    //startPotionEffectsTimer();
    ws.json({ task: 'heartbeat', event: 'start' });
    ws.json({ task: 'card', username: bot.username });
  });

  bot.on('health', function() {
    ws.json({ task: 'card', health: bot.health, hunger: bot.food })
  });

  bot.on('end', function(reason) {
    ws.json({ task: 'heartbeat', event: 'end' })
    ws.echo(`\n[[u;indianred;]MinePrompt - Session Ended]\n  ${reason}`)
  });

  bot.on('kicked', function(reason) {
    let json = JSON.parse(reason);
    let field = json.text || json.translate;
    let message = field; // TODO: Patch ChatMessage.toAnsi
    //let message = ChatMessage.fromNotch(field).toAnsi(bot.registry.language, ansiMap)
    ws.echo(`\n[[u;indianred;]MinePrompt - Session Kicked]\n  "${message}"`)
  });

  let lastPosition;
  bot.on('move', function() {
    if(lastPosition && bot.entity.position.floored().equals(lastPosition.floored())) return;
    lastPosition = bot.entity.position;
    ws.json({ task: 'card', position: bot.entity.position.floored() })
  });

  bot.on('messagestr', function(message) {
    ws.echo(message || '\n' ); // If a server sends a blank line use \n
  });
}
