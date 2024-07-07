class Card {

// Pass a Process ID for continuing an existing session only!
constructor(client_options, pid) {
  this.username = client_options.username;
  this.client_options = client_options;
  this.pid = pid;
}

async startChild() {
  this.generateCard()
  let parent = this;

  // Continuing Existing Session

  let newSession = this.pid ? false : true;
  console.log('New Session?', newSession);
  if(this.pid) {
    this.term.debug(`[Connection] Reconnecting an existing session on port ${this.pid}`)
    parent.socket = new WebSocket(`ws://localhost:${this.pid}`);
  }

  // New Session
  if(!this.pid) {
    let socket = parent.socket;
    parent.pid = (await $.ajax({ url: './process/create', type: 'PUT', data: this.client_options })).child;
    this.term.debug(`[Connection] Creating a new session on port ${this.pid}`)
    parent.socket = new WebSocket(`ws://localhost:${this.pid}`);
  }

  this.socket.onopen = function(e) {
    parent.term.debug(`[Connection] Established a connection with websocket ${parent.pid}`)
    if(newSession) parent.socket.send(JSON.stringify({ task: 'startBot' }))
  };

  // Server (Child Process) sends a message to the terminal
  this.socket.onmessage = function(event) {
    let data = JSON.parse(event.data);
    switch(data.task) {
      case 'echo':
        parent.term.echo(data.msg)
        break;
      case 'card':
        parent.updateCard(data)
        break;
      case 'heartbeat':
        if(data.event === 'start') parent.startRuntime();
        if(data.event === 'end') parent.stopRuntime();
        break;
      case 'exit':
        parent.removeCard();
        break;
      default:
        console.log('UNCAUGHT DATA:', data)
    }

  };

  this.socket.onclose = function(event) {
    console.log('onclose:', event)
    parent.term.echo('Connection Terminated:')
    if (event.wasClean) return parent.term.echo(`${event.code}: ${event.reason}`);
    parent.term.echo('Process Terminated - The connection was terminated (Check Errors)');
  };

  this.socket.onerror = function(error) {
    console.log('onerror:', error)
    parent.term.echo(`[Connection] There was an error with the connection: ${error.code}`)
  };

}

removeCard() {
  // TODO: Also send something to SESSIONS SERVER to delete the session
  this.elCard.remove();
  this.socket.send(JSON.stringify({ task: 'command', cmd: 'exit' }))
}

parseCommand(input, term) {
  if(!input.length) return; // blank line sent

  var parsed_command = $.terminal.parse_command(input);
  let cmd = parsed_command.name;
  let args = parsed_command.args;

  // Command Logic (Web Side - less logic)
  // TODO: Add (Yargs?) command system

  if(cmd === 'exit') this.removeCard();
  this.socket.send(JSON.stringify({ task: 'command', cmd: cmd, args: args }))
}

generateCard() {

  // TODO: Get element from findByElement, but HOW DO I GET TERM??

  let parent = this;
  //let pid = this.pid;
  this.elCard = $("#player-card").clone().prop('id', '').insertAfter("#player-card:last");
  this.elRuntime = this.elCard.find('.runtime');

  let elCard = this.elCard;

  //elCard.attr('data-pid', this.pid)
  elCard.find('[data-fill="username"]').text(this.username)
  elCard.find('.avatar-head').attr('src', `https://mc-heads.net/avatar/${this.username.toLowerCase()}/100/nohelm.png`);
  elCard.find('.avatar-body').attr('src', `https://mc-heads.net/body/${this.username.toLowerCase()}/100/nohelm.png`);
  function createTerminal() {
      let element = elCard.find('.terminal');
      let term = element.terminal(function(command, term) {
          parent.parseCommand(command, term)
      }, {
          exit: false,
          onInit: function() {
              //console.log('[Event] onInit');
          },
          onClear: function() {
              console.log('[Event] onClear');
          },
          greetings: function(set) {
              set(function() {
                  return `MinePrompt` // (PID: ${pid})`
              });
          },
          enabled: false, // Disable auto-focus (Issue fix)
          name: 'electron',
          prompt: '\u00bb ',
          scrollOnEcho: false
      });

      term.debug = function(message) {
        // TODO: Create per-terminal setting for debug
        //if(debug) {}
        term.echo(`[[;indianred;]DEBUG] \u00bb ${message}`)
      }
      return term;
  }
  this.term = createTerminal();
  return elCard.show();

}

updateCard(data) {
  if(data.username) this.elCard.find('[data-fill="username"]').text(data.username);
  if(data.username) this.elCard.find('.avatar').attr('src', `https://mc-heads.net/avatar/${data.username.toLowerCase()}/100/nohelm.png`);
  if(data.health) this.setHealth(data.health);
  if(data.hunger) this.setHunger(data.hunger);
  if(data.effects) this.setEffects(data.effects);
  if(data.position) this.setPosition(data.position)
}

setHealth(health) {
   // Giant thanks to Tom16 for helping me finish this at 2:19am, now I can go to bed.. (Health and Hunger)
  let elHealth = this.elCard.find('.health');
  elHealth.empty();
  for (let i = 0; i < Math.floor(Math.ceil(health) / 2); i++) elHealth.append(`<img src="./imgs/hearts/heart-full.png"> `);
  if (Math.round(health) % 2 === 1) elHealth.append(`<img src="./imgs/hearts/heart-half.png"> `);
  for (let i = Math.ceil(health / 2); i < 10; i++) elHealth.append(`<img src="./imgs/hearts/heart-empty.png"> `);
}

setHunger(hunger) {
  let elHunger = this.elCard.find('.hunger');
  elHunger.empty();
  for (let i = 0; i < Math.floor(Math.ceil(hunger) / 2); i++) elHunger.append(`<img src="./imgs/hunger/hunger-full.webp"> `);
  if (Math.round(hunger) % 2 === 1) elHunger.append(`<img src="./imgs/hunger/hunger-half.webp"> `);
  for (let i = Math.ceil(hunger / 2); i < 10; i++) elHunger.append(`<img src="./imgs/hunger/hunger-empty.webp"> `);
}

setEffects(effects) {
  let elPotionEffects = this.elCard.find('.effects')
  elPotionEffects.empty();
  for(let a = 0; a < effects.length; a++) {
    let effect = effects[a];
    elPotionEffects.append(`<img src="./imgs/effects/${effect.effect.toLowerCase()}.png" data-tippy-content="${effect.displayName}">`);
  }
}

setPosition(position) {
  let elPosition = this.elCard.find('.position');
  let { x, y, z } = position;
  elPosition.text(`${x}, ${y}, ${z}`)
}

startRuntime() {
  this.sessionStart = new Date();
  let parent = this;
  this.timerRuntime = setInterval(function() {
      parent.elRuntime.text(parent.getRuntime()).css('color', '#fff').pulsate('destroy')
    }, 1000)
}

stopRuntime() {
  clearInterval(this.timerRuntime)
  if(!this.elRuntime.text().length) this.elRuntime.text('NaN'); // timer not started
  this.elRuntime.prepend('Connection Ended: ').pulsate({
    color: '#cd5c5c',
    reach: 5,
    speed: 500,
    pause: 300,
    glow: true,
    repeat: true,
    onHover: false
  }).css('color', 'indianred');
}

getRuntime() {
  let seconds_passed = Math.abs(this.sessionStart.getTime() - new Date().getTime()) / 1000;
  return this.forHumans(seconds_passed);
}

/**
 * Translates seconds into human readable format of seconds, minutes, hours, days, and years
 * 
 * @param  {number} seconds The number of seconds to be processed
 * @return {string}         The phrase describing the amount of time
 */
forHumans(seconds) {
  let levels = [
    [Math.floor(seconds / 31536000), 'y'], // years
    [Math.floor((seconds % 31536000) / 86400), 'd'], // days
    [Math.floor(((seconds % 31536000) % 86400) / 3600), 'h'], // hours
    [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), 'm'], // minutes
    [(((Math.floor(seconds) % 31536000) % 86400) % 3600) % 60, 's'], // seconds
  ];
  let returntext = '';

  for (let i = 0, max = levels.length; i < max; i++) {
    if (levels[i][0] === 0) continue;
    returntext += ' ' + levels[i][0] + levels[i][1];
  };
  return returntext.trim();
}


}