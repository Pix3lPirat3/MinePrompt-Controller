// bot may be optional, non-bot-required commands AND terminal-side only code

let path = require('path');
let fs = require('fs');

class Command {

  constructor() {
    this._name = null;
    this._alias = [];
    this._handler = null;
    this._filePath = null; // Used in file system for the reloading system
    /*
    .consoleOnly() .playerOnly() .args([]), .flags()
    */
  }

  name(val) {
    if(!val) return this._name;
    this._name = val;
    return this;
  }

  alias(val) {
    if(!val) return this._alias;
    if(val.constructor === Array) this._alias = val; // Passed an Array
    if(val.constructor === String) this._alias.push(val); // Passed a String
    return this;
  }

  handler(func, filePath) {
    if(!func) return this._handler;

    console.log('constructor:', func.constructor)
    if(func.constructor === Function) this._handler = func; // They passed a Function as an argument
    else throw new Error('You must pass a Function as a handler.');
    if(filePath) this._filePath = filePath; // They passed a File as an arugment

    return this;
  }

  execute(bot, sender, message, args) {
      return this._handler(bot, sender, message, args);
  }

  reload() {
    if(this._filePath) {
      console.log(`[Commander] Reloading the command ${this.name()} (Path: ${this._filePath})`)
      delete require.cache[require.resolve(this._filePath)] // This is required otherwise the cache will override the new require()
      this._handler = require(this._filePath);
    }
  }

}

class CommandManager {
  constructor(bot, listener) {
    let parent = this;
    this.bot = bot;
    this.commands = {};

    if(!listener) listener = {}
    if(!listener.event) listener.event = 'chat';
    if(!listener.handler) listener.handler = function(sender, message) {
      parent.parse({ type: 'player', username: sender }, message);
    }

    this.listener = listener;

    this.addReloadCommand();
  }

  addReloadCommand() {
    let parent = this;
    let command = new Command();
    command.name('reload');
    command.handler(() => parent.reload())
    this.commands[command.name()] = command
  }

  addCommandFile(filePath) {
    if(!fs.existsSync(filePath)) throw new Error(`The file ${filePath} was not found.`);
    let cmdFile = require(filePath);

    let commandConstr = new Command().name(cmdFile.name).handler(cmdFile.handler, filePath).alias(cmdFile.alias);
    
    for (const [key, value] of Object.entries(cmdFile)) {
      let field = commandConstr[key];
      if(field) commandConstr[key](value);
      else console.log('Unknown field in command file:', key);
    }
    this.addCommand(commandConstr)
  }

  addCommandFolder(dir) {
    fs.readdirSync(dir).forEach(file => this.addCommandFile(path.join(dir, file)));
  }

  addCommand(command) {
    if(command.constructor != Command) throw new Error('You must pass a "new Command()" into addCommand(command)');
    if(!command.name()) throw new Error(`You must set a .name(String) on the command.`);
    if(!command.handler()) throw new Error(`You must set a .handler(Function) or .handler(Path) on the command.`);
    this.commands[command.name()] = command;
  }

  parse(sender, message) {
    if(!message) return false;
    const args = message.trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    let cmd = this.commands[command];
    if(!cmd) return false;
    return cmd.execute(this.bot, sender, message, args);
  }

  // start/stop listening
  startListener() {
    console.log(`Registering the listener on the "${this.listener.event}" event.`)
    this.bot.on(this.listener.event, this.listener.handler)
  }

  stopListener() {
    this.bot.off(this.listener.event, this.listener.handler)
  }

  reload() {
    Object.values(this.commands).forEach(command => command.reload());
  }

}


let manager = new CommandManager();

// Help command
// let commandHelp = new Command();
// commandHelp.name('help');
// commandHelp.alias(['h', 'menu'])
// commandHelp.handler('../commands/java/help.js') // __dirname + '/commands/java/help.js'
// manager.addCommand(commandHelp)


//manager.addCommandFolder('C:/Users/pix3l/Documents/Repos/MinePrompt Package/MinePrompt-WebInterface/MinePrompt-Controller/commands/java')

// Inventory command
//manager.addCommand(new Command().name('inventory').alias('inv').handler(() => console.log(bot.inventory.items().map(item => item.name))))

//console.log('manager:', manager)

module.exports = {
  Command: Command,
  CommandManager : CommandManager
}