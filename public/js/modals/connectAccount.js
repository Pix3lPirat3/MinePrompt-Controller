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

let render_types = ['default', 'marching', 'walking', 'crouching', 'crossed', 'criss_cross', 'ultimate', 'isometric', 'head', 'cheering', 'relaxing', 'trudging', 'cowering', 'pointing', 'lunging', 'dungeons', 'facepalm', 'sleeping', 'dead', 'archer', 'kicking', 'mojavatar', 'reading', 'bitzel', 'pixel'];
function getRenderType() {
  return render_types[Math.floor(Math.random() * render_types.length)];
}

let modals = {
  connectAccount: {
    elModal: new bootstrap.Modal('#connectAccount'),
    show: function({ username, auth, host, port }) {

      let el = $(this.elModal._element);



      el.find('#connectAccountUsername').val(username);
      el.find('#connectAccountAuth').val(auth);
      el.find('#connectAccountHost').val(host)
      el.find('#connectAccountPort').val(port)
      el.find('#connectAccountHead').attr('src', `https://starlightskins.lunareclipse.studio/render/${getRenderType()}/${username.toLowerCase()}/full`)
      el.find('#connectAccountSkin').attr('src', `https://starlightskins.lunareclipse.studio/render/${getRenderType()}/${username}/full`)

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
  $('#connectAccountHead').attr('src', `https://starlightskins.lunareclipse.studio/render/${getRenderType()}/${username}/full`)
  $('#connectAccountSkin').attr('src', `https://starlightskins.lunareclipse.studio/render/${getRenderType()}/${username}/full`)
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