let timeout

document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());
  document.querySelector('#compose-form').onsubmit = submit_mail;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(email_id = null) {
  // Remove alert
  document.querySelector("[role='alert']").style.display = 'none';
  clearTimeout(timeout)
  if (email_id) {
    retrieve_full_email(email_id)
      .then(response => {
        document.querySelector('#compose-recipients').value = response.sender;
        document.querySelector('#compose-subject').value = 'Re: ' +
          response.subject.replace(/^Re:\s/, '');
        document.querySelector('#compose-body').value = 'On ' +
          `${response.timestamp} ${response.sender} wrote:\n"${response.body}"`;
      })
  } else {
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = ''
  }

  // console.log(body)

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#show-email').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
}

function load_mailbox(mailbox) {
  // Remove alert
  document.querySelector("[role='alert']").style.display = 'none';
  clearTimeout(timeout)

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#show-email').style.display = 'none';

  // console.log(`/emails/${mailbox}`)

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(result => {
      create_shortMail_element(result);
    })
    .catch(error => {
      console.log('Error:', error);
    });

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
      const alert = document.querySelector("[role='alert']");
      alert.style.display = "block";

      if (result.ok) {
        alert.setAttribute('class', 'alert alert-success')
        alert.innerHTML = `${result.body.message}`

        timeout = setTimeout(function () {
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

function create_shortMail_element(result) {
  let div = document.createElement('div')

  for (let email in result) {
    let div_email = document.createElement('div')
    div_email.setAttribute('class', `email-line ${result[email].read ? '' : 'unread'}`)
    div_email.addEventListener('click', () => show_email(result[email].id));

    let span_sender = document.createElement('span')
    span_sender.setAttribute('class', 'span-sender')
    span_sender.textContent = result[email].sender

    let span_subject = document.createElement('span')
    span_subject.setAttribute('class', 'span-subject')
    span_subject.textContent = result[email].subject

    let span_timestamp = document.createElement('span')
    span_timestamp.setAttribute('class', 'span-timestamp')
    span_timestamp.textContent = result[email].timestamp


    div_email.append(span_sender)
    div_email.append(span_subject)
    div_email.append(span_timestamp)
    div.append(div_email)
  }

  document.querySelector('#emails-view').append(div);
}

function show_email(id) {

  fetch(`emails/${id}`)
    .then(response => response.json())
    .then(result => {
      create_fullEmail_element(result);
      if (!result.read) put_read();
    })
    .catch(error => {
      console.log('Error:', error);
    });

  function put_read() {
    fetch(`emails/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify({
        read: 'True'
      })
    })
      .catch(error => {
        console.log('Error:', error);
      });
  }

}

function create_fullEmail_element(result) {
  div_show_email = document.querySelector('#show-email')
  div_show_email.innerHTML = ''

  let div_email = document.createElement('div')
  div_email.setAttribute('class', 'full-email')
  div_email.innerHTML = `
  <div class="email-info">
    <span class="email-sender">${result.sender}</span>
    <span class="span-timestamp">${result.timestamp}</span>
  </div>
  <div class="div-email-subject">
    <span>${sanitize(result.subject)}</span>
  </div>
  <div class="div-body">${sanitize(result.body)}</div>
  <div class="email-btn mt-3">
    ${result.archived ? '' : `<button class="btn btn-outline-secondary btn-sm"
    onClick="compose_email(${result.id})">
    Reply</button>`}
    <button class="archive-btn btn btn-outline-secondary btn-sm"
    onClick="archive(${result.archived}, ${result.id})">
    ${result.archived ? 'Unarchive' : 'Archive'}
    </button>
  </div>
  `;

  div_show_email.append(div_email)

  document.querySelector('#emails-view').style.display = 'none';
  div_show_email.style.display = 'block';
}

function sanitize(string) {
  let div = document.createElement('div')
  div.textContent = string
  return div.innerText
}

function archive(bool, id) {

  fetch(`emails/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json;charset=utf-8'
    },
    body: JSON.stringify({
      archived: !bool
    })
  })
    .then(response => {
      const alert = document.querySelector("[role='alert']");
      alert.style.display = "block";

      if (response.ok) {
        alert.setAttribute('class', 'alert alert-success')
        alert.innerHTML = bool ? 'Email unarchived' : 'Email archived'

        timeout = setTimeout(function () {
          load_mailbox('inbox');
        }, 2000);

      } else {
        alert.setAttribute('class', 'alert alert-danger')
        alert.innerHTML = bool ? 'Fail to unarchive email' : 'Fail to archive email'
      }
    })
    .catch(error => {
      console.log('Error:', error);
    });

}

async function retrieve_full_email(email_id) {
  const response = await fetch(`emails/${email_id}`);
  return response.json()
}