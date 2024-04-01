$('#connectAccountSubmit').on('click', function() {
  modals.connectAccount.hide();

  let settings = {
    username: $('#connectAccountUsername').val(),
    auth: $('#connectAccountAuth').val() || 'microsoft',
    host: $('#connectAccountHost').val(),
    port: $('#connectAccountPort').val() || 25565,
    version: $('#connectAccountVersion').val(),
    viewDistance: $('#connectAccountViewDistance').val() || 'far',
    respawn: $('#connectAccountRespawn').val() || true,
    fakeHost: $('#connectAccountFakeHost').val() || this.host
  }

  accounts.launch(settings)
})

$('#connectAccountShowAdvancedSettings').on('click', function(e) {
  e.preventDefault();
  $('#connectAccountAdvancedSettings').toggle();
})

let modals = {
  connectAccount: {
    elModal: new bootstrap.Modal('#connectAccount'),
    show: function({ username, auth }) {

      let el = $(this.elModal._element);

      el.find('#connectAccountUsername').val(username);
      el.find('#connectAccountAuth').val(auth);
      el.find('#connectAccountHead').attr('src', `https://mc-heads.net/head/${username.toLowerCase()}`)
      el.find('#connectAccountSkin').attr('src', `https://mc-heads.net/body/${username.toLowerCase()}`)

      return this.elModal.show();
    },
    hide: function() {
      return this.elModal.hide();
    }
  }
}

// Update the skin visual when connect an account
$('#connectAccountUsername').on('keyup', function() {
  let username = $(this).val();
  if(!isValidUsername(username)) return;
  $('#connectAccountHead').attr('src', `https://mc-heads.net/head/${username.toLowerCase()}`)
  $('#connectAccountSkin').attr('src', `https://mc-heads.net/body/${username.toLowerCase()}`)
})

let accounts = {
  launch: async function(settings) {

    // Save the server to servers for future use
    let { host, port, version, auth } = settings;

    await $.ajax({ url: './servers/put', type: 'PUT', data: { hostname: host, port: port, version: version, authentication: auth } });
    navbar.servers.set();

    let player_card = new Card(settings);
    // TODO: Launch Account
    player_card.startChild();
  }
}