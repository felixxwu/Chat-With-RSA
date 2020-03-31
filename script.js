const e = id => document.getElementById(id)
let state = 'start'
const jsEncrypt = new JSEncrypt()
const public = jsEncrypt.getPublicKey()
const private = jsEncrypt.getPrivateKey()
const delimiter = ';'
let senderpublic = null

const copy = message => {
  state = 'copy'
  e('instruction').innerHTML = 'Copy me and send to a friend (don\'t refresh this page!)'
  e('copyme').innerHTML = message
  e('action').innerHTML = 'Receive reply'
  e('input').style.display = 'none'
}

const receive = () => {
  state = 'receive'
  e('instruction').innerHTML = 'Paste the encrypted message'
  e('input').style.display = ''
  e('input').value = ''
  e('input').focus()
  e('copyme').innerHTML = ''
  e('action').innerHTML = 'Decrypt'
}

const decrypt = message => {
  state = 'decrypt'
  const input = message === '' ? e('input').value.split(delimiter) : message.split(delimiter)
  senderpublic = input[0]
  if (input.length === 1) {
    e('copyme').innerHTML = 'Hey, let\' start a conversation!'
  } else {
    const encryptedmsg = input[1]
    jsEncrypt.setPrivateKey(private)
    const decryptedmsg = jsEncrypt.decrypt(encryptedmsg)
    e('copyme').innerHTML = decryptedmsg
  }
  e('instruction').innerHTML = 'Your sender says:'
  e('input').style.display = 'none'
  e('action').innerHTML = 'Reply'
}

const reply = () => {
  state = 'reply'
  e('copyme').innerHTML = ''
  e('input').style.display = ''
  e('input').value = ''
  e('input').focus()
  e('action').innerHTML = 'Encrypt'
}

const encrypt = () => {
  state = 'encrypt'
  const message = e('input').value
  jsEncrypt.setPublicKey(senderpublic)
  const encryptedmsg = jsEncrypt.encrypt(message)
  copy([public, encryptedmsg].join(delimiter))
}

const action = () => {
  if (state === 'start') {
    copy('https://chatwithrsa.web.app#' + encodeURIComponent(public))
  } else if (state === 'copy') {
    receive()
  } else if (state === 'receive') {
    decrypt('')
  } else if (state === 'decrypt') {
    reply()
  } else if (state === 'reply') {
    encrypt()
  }
}

window.onload = () => {
  e('input').style.display = 'none'
  e('public').innerHTML = public
  e('private').innerHTML = private

  if (location.hash !== '') {
    state = 'decrypt'
    decrypt(decodeURIComponent(location.hash.slice(1)))
    location.hash = ''
  }
}
