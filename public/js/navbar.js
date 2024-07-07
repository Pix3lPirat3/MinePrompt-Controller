let elAccounts = $('#navbarAccounts');
let elServers = $('#navbarServers');

let navbar = {
  accounts: {
    set: async function() {
      let accounts = (await jQuery.getJSON('./accounts/get')).accounts;
      elAccounts.empty();
      accounts.sort((a, b) => a.username - b.username).forEach(function(account) {
        let username = account.username;
        let auth = account.authentication;
        elAccounts.append(`
          <li>
            <div class="dropdown-item" data-username="${username}" data-auth="${auth}">
              <img src="https://mc-heads.net/head/${username}" style="height: 25px; margin-right: 5px;">${username}
              <span class="delete-account" style="float: right; cursor: pointer; color: indianred; font-weight: bold;">&#10006;</span>
            </div>
          </li>
          `)
      })
    }
  },
  servers: {
    set: async function() {
      let servers = (await jQuery.getJSON('./servers/get')).servers;
      elServers.empty();
      servers.sort((a, b) => a.hostname - b.hostname).forEach(function(server) {
        let { hostname, port, authentication } = server;
        elServers.append(`
          <li>
            <div class="dropdown-item" data-hostname="${hostname}" data-port="${port}" data-auth="${authentication}">
              <img style="height: 25px; margin-right: 5px;">${hostname}
              <span class="delete-account" style="float: right; cursor: pointer; color: indianred; font-weight: bold;">&#10006;</span>
            </div>
          </li>
          `)
      })


    }
  }
}

$(function() {
  navbar.accounts.set()
  navbar.servers.set();
})

$('#navbarAccounts').on('click', 'li > .dropdown-item', async function(e) {
  e.preventDefault();
  
  let elTarget = $(e.currentTarget);
  let username = elTarget.data('username');
  let auth = elTarget.data('auth');

  if($(e.target).hasClass('delete-account')) {
    await $.ajax({ url: './accounts/delete', type: 'DELETE', data: { username: username } });
    navbar.accounts.set();
    return;
  }
  modals.connectAccount.show({ username: username, auth: auth });
})

$('#navbarServers').on('click', 'li > .dropdown-item', async function(e) {
  e.preventDefault();
  
  let elTarget = $(e.currentTarget);
  let hostname = elTarget.data('hostname');
  let port = elTarget.data('port');
  let auth = elTarget.data('auth');

  if($(e.target).hasClass('delete-account')) {
    await $.ajax({ url: './servers/delete', type: 'DELETE', data: { hostname: hostname } });
    navbar.servers.set();
    return;
  }

  console.log('Showing: ', auth, hostname, port)
  modals.connectAccount.show({ username: '', auth: auth, host: hostname, port: port })
 
})