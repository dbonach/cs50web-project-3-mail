document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').onsubmit = submit_mail;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
  // Remove alert
  document.querySelector("[role='alert']").style.display = 'none';

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  // document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  // Remove alert
  document.querySelector("[role='alert']").style.display = 'none';

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
}

function submit_mail() {

  let recipients = this.querySelector('#compose-recipients').value;
  let subject = this.querySelector('#compose-subject').value;
  let body = this.querySelector('#compose-body').value;

  if (!body && !confirm("Send this message without a subject or text in the body?")) {
    return false;
  }

  fetch('/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8'
    },
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
    .then(response => {
      return response.json().then(data => ({
        ok: response.ok,
        body: data
      }))
    })
    .then(result => {
      console.log(result)
      // console.log(result.ok)
      console.log(result.body.message)

      const alert = document.querySelector("[role='alert']");
      alert.style.display = "block";

      if (result.ok) {
        alert.setAttribute('class', 'alert alert-success')
        alert.innerHTML = `${result.body.message}`

        setTimeout(function () {
          alert.style.display = 'none';
          load_mailbox('inbox');
        }, 2000);

      } else {
        alert.setAttribute('class', 'alert alert-danger')
        alert.innerHTML = `Error: ${result.body.error}`
      }

    })
    .catch(error => {
      console.log('Error:', error);
    });

  return false
}