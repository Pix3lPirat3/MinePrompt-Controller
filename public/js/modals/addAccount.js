$('#addAccount').on('submit', function(e) {
  e.preventDefault();
})

// Handle adding an account
$('#addAccountSubmit').on('click', function() {
  let elUsername = $('#addAccountUsername')
  let elError = $('#addAccountErrors').empty();
  let username = elUsername.val();
  let auth = $('#addAccountAuth').find(":selected").val();

  if(!isValidUsername(username)) return elError.text('Invalid Username (a-Z,0-9,_)');

  // ADD ACC
  $.ajax({ url: './accounts/put', type: 'PUT', data: { username: username, authentication: auth } });
  
  navbar.accounts.set()

  bootstrap.Modal.getInstance($('#account_add')).hide();
})

// Update the skin visual when adding an account
$('#addAccountUsername').on('keyup', function() {
  let username = $(this).val();
  if(!isValidUsername(username)) return;
  let elSkin = $('#addAccountSkin');
  elSkin.attr('src', `https://starlightskins.lunareclipse.studio/render/${getRenderType()}/${username}/full`)
})

function isValidUsername(username) {
  let pattern = /^[a-zA-Z0-9_]{3,16}$/;
  return username.match(pattern);
}