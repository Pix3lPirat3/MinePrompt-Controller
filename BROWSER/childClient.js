// We should process commands in the child
// because the logic will be applied easier.

// Server-command logic vs Client-command-recieved logic
let mineflayer = require('mineflayer');
let ChatMessage;

let Storage = require('./../storage.js');
let store_reconnect = Storage.get('modules/reconnect');

// We pass a JSON.stringify'd version of createBot() options to process.env
let bot = null;
const sleep = ms => new Promise((resolve) => setTimeout(resolve, ms))

async function connect() {
  let env = JSON.parse(process.env.createBot);
  console.log(env)
  // process.send({ task: 'echo', message: `Connecting ${env.username} to ${env.host}:${env.port}, version ${env.version}` });
  if(bot) {
    await bot.end();
    await sleep(store_reconnect.get('reconnect.delay'));
  }
  try {
    bot = mineflayer.createBot(env);
    process.send({ task: 'echo', message: `[MinePrompt] ${env.username} \u00bb ${env.host}:${env.port} (Ver: ${env.version}) (Auth: ${env.auth})` });
  } catch(e) {
    process.send({ task: 'echo', message: `[${e.code}] ${e.message}` });
  }

  bot.on('error', (error) => process.send({ task: 'echo', message: error.message }));
  bot.on('kicked', console.log);

  bot.once('login', function() {
    ChatMessage = require('prismarine-chat')(bot.registry);
  })

  bot.once('spawn', function() {
    //startPotionEffectsTimer();
    process.send({ task: 'heartbeat', event: 'start' });
    process.send({ task: 'card', username: bot.username });
  });

  bot.on('health', function() {
    process.send({ task: 'card', health: bot.health, hunger: bot.food })
  })

  bot.on('end', function(reason) {
    process.send({ task: 'heartbeat', event: 'end' })
    process.send({ task: 'echo', message: `\n[[u;indianred;]MinePrompt - Session Ended]\n  ${reason}` })
  })

  // TODO: JSON.parse may need to be changed depending on version..?
  bot.on('kicked', function(reason) {
    let json = JSON.parse(reason);
    let field = json.text || json.translate;
    let message = field; // TODO: Patch ChatMessage.toAnsi
    //let message = ChatMessage.fromNotch(field).toAnsi(bot.registry.language, ansiMap)
    process.send({ task: 'echo', message: `\n[[u;indianred;]MinePrompt - Session Kicked]\n  "${message}"` })
  })

  let lastPosition;
  bot.on('move', function() {
    if(lastPosition && bot.entity.position.floored().equals(lastPosition.floored())) return;
    lastPosition = bot.entity.position;
    process.send({ task: 'card', position: bot.entity.position.floored() })
  })

  /*
  // Potion Effects Timer
  let potionEffectsTimer;
  function startPotionEffectsTimer() {
    if(potionEffectsTimer) return;
    potionEffectsTimer = setInterval(function() {
        if(!bot || !bot?.entity) clearInterval(potionEffectsTimer);
        let potion_effects = Object.values(bot.entity.effects).map(e => bot.registry.effects[e.id]).map(effect => ({ effect: effect.name, displayName: effect.displayName }));
        process.send({ task: 'card', effects: potion_effects })
      }, 2500) // Every 2.5s
  }
  */

  // TODO: invalidate message format so players can't send links to terminal or break color stuff
  bot.on('messagestr', function(message) {
    process.send({ task: 'echo', message: message || '\n' }); // If a server sends a blank line use \n

    // TODO: work on 'colored chat'

  });
}
connect()

let commander = require('../commander.js')
commander.bot = bot;
commander.setCommander('mineflayer', true);
async function parseCommand(bot, cmd, args) {

  let combined = args ? [cmd].concat(args) : [cmd];
  let command = commander.getCommand(cmd, bot);
  if(!command) return process.send({ task: 'echo', message: 'command not found.'})
  command.parse(combined, { from: 'user' })
}

if (process.send) {
  //process.send(`[Child] Process #${process.pid}`);
}

process.on('message', function onProcessMessage(data) {
  console.log(`[Child #${process.pid}] Parent sent: ${data}`);
});

process.on('message', function(data) {
  console.log('message from parent:', data);
  switch(data.task) {
    case "command":
      let cmd = data.cmd;
      let args = data.args;
      if(cmd === "reconnect") return connect();
      if(cmd === "exit") {
        if(!bot) return process.send({ task: 'echo', message: '[Error] The bot is not connected.'});
        process.send({ task: 'echo', message: `[Session] Ending the session of ${bot.username}`});
        process.send({ task: 'exit' });
        return bot.end();
      }
      parseCommand(bot, cmd, args);
      break;
    default:

      break;
  }
});