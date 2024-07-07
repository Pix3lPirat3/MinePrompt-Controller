// We should process commands in the child
// because the logic will be applied easier.

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.pid });
let runtime = {
  start: null,
  end: null
}

let comms = null;

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    let data = JSON.parse(message);
    switch(data.task) {
      case 'command':
        runCommand(data.cmd, data.args)
        break;

      case 'startBot':
        startBot()
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
  comms = ws;

  // On page refresh, send the start/end time for the runtime
  if(runtime.start) comms.json({ task: 'heartbeat', event: 'start', time: runtime.start });
  if(runtime.end) comms.json({ task: 'heartbeat', event: 'end', time: runtime.end });

});


// Server-command logic vs Client-command-recieved logic
let mineflayer = require('mineflayer');

// We pass a JSON.stringify'd version of createBot() options to process.env
let bot = null;
const sleep = ms => new Promise((resolve) => setTimeout(resolve, ms))

async function startBot() {
  bot = mineflayer.createBot(JSON.parse(process.env.createBot));

  bot.on('error', comms.echo);
  bot.on('kicked', comms.echo);

  bot.once('spawn', function() {
    //startPotionEffectsTimer();
    runtime.start = new Date();
    comms.json({ task: 'heartbeat', event: 'start', time: runtime.start });
    comms.json({ task: 'card', username: bot.username });
  });

  bot.on('health', function() {
    comms.json({ task: 'card', health: bot.health, hunger: bot.food })
  });

  bot.on('end', function(reason) {
    runtime.end = new Date();
    comms.json({ task: 'heartbeat', event: 'end', time: runtime.end })
    comms.echo(`\n[[u;indianred;]MinePrompt - Session Ended]\n  ${reason}`)
  });

  bot.on('kicked', function(reason) {
    let json = JSON.parse(reason);
    let field = json.text || json.translate;
    let message = field; // TODO: Patch ChatMessage.toAnsi
    //let message = ChatMessage.fromNotch(field).toAnsi(bot.registry.language, ansiMap)
    comms.echo(`\n[[u;indianred;]MinePrompt - Session Kicked]\n  "${message}"`)
  });

  let lastPosition;
  bot.on('move', function() {
    if(lastPosition && bot.entity.position.floored().equals(lastPosition.floored())) return;
    lastPosition = bot.entity.position;
    comms.json({ task: 'card', position: bot.entity.position.floored() })
  });

  bot.on('message', function(jsonMsg, position, sender) {
    if(position == 'chat') {
      // TODO: Add support for toAnsi() once it's patched for unsigned/signed in prismarine-chat

      let sender_obj = Object.values(bot.players).find(pl => pl.uuid == sender);

      let username = sender_obj.username || 'Unknown Sender'; // If server sends fake player 'Unknown Sender'

      let message = jsonMsg?.unsigned?.toString() || jsonMsg.toString();

      comms.echo(`[[;gold;]\u00bb] ${message}`)
      // TODO: parse chat commands
    } else {
      comms.echo(`[[;gray;]\u00bb] ${jsonMsg.toString()}` || '\n' ); // If a server sends a blank line use \n
    }

  });
}
