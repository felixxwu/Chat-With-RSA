const e = id => document.getElementById(id)
const RSA = new JSEncrypt({default_key_size: 512})
const keylength = 52

let public = localStorage.getItem('public')
let private = localStorage.getItem('private')
console.log({public})
console.log({private})
if (!public || public === 'null') {
  public = RSA.getPublicKeyB64()
  localStorage.setItem('public', public)
}
if (!private || private === 'null') {
  private = RSA.getPrivateKeyB64()
  localStorage.setItem('private', private)
}

const delimiter = ';'

let state = 'start'
let senderpublic = null
let secret = null

const randomKey = () => CryptoJS.lib.WordArray.random(keylength/2).toString()

const AES = {
  encrypt: (msg, pass) => {
    return CryptoJS.AES.encrypt(msg, pass).toString();
  },
  decrypt: (encrypted, pass) => {
    var decrypted = CryptoJS.AES.decrypt(encrypted, pass);
    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}

const copy = message => {
  state = 'copy'
  e('instruction').innerHTML = 'Copy me and send to a friend'
  e('copyme').innerHTML = message
  e('action').innerHTML = 'I\'ve received a reply'
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
  e('sender').innerHTML = senderpublic
  if (input.length === 1) {
    e('copyme').innerHTML = 'Hey, let\' start a conversation!'
  } else {
    const rsaEncryptedSecret = input[1]
    const aesEncryptedMsg = input[2]
    RSA.setPrivateKey(private)
    secret = RSA.decrypt(rsaEncryptedSecret)
    e('secret').innerHTML = secret
    const decryptedmsg = AES.decrypt(aesEncryptedMsg, secret)
    e('copyme').innerHTML = decryptedmsg
  }
  e('instruction').innerHTML = 'Your sender says:'
  e('input').style.display = 'none'
  e('action').innerHTML = 'Reply'
}

const reply = () => {
  state = 'reply'
  e('instruction').innerHTML = 'Write a reply'
  e('copyme').innerHTML = ''
  e('input').style.display = ''
  e('input').value = ''
  e('input').focus()
  e('action').innerHTML = 'Encrypt'
}

const encrypt = () => {
  state = 'encrypt'
  const message = e('input').value
  secret = secret === null ? randomKey() : secret
  e('secret').innerHTML = secret
  const aesEncryptedMsg = AES.encrypt(message, secret)
  RSA.setPublicKey(senderpublic)
  const rsaEncryptedSecret = RSA.encrypt(secret)
  copy([public, rsaEncryptedSecret, aesEncryptedMsg].join(delimiter))
}

const test = () => {
  const p = decodeURIComponent(encodeURIComponent(public))
  RSA.setPublicKey(p)
  RSA.setPrivateKey(private)
  console.log(RSA.decrypt(RSA.encrypt('Test passed.')))
}

const action = () => {
  if (state === 'start') {
    copy('https://chatwithrsa.web.app?m=' + encodeURIComponent(public))
    // test()
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
  e('input').style.display = 'none'
  e('public').innerHTML = public
  e('private').innerHTML = private

  const urlParams = new URLSearchParams(window.location.search)
  const message = urlParams.get('m')
  if (message !== null) {
    state = 'decrypt'
    decrypt(decodeURIComponent(message))
    const clean_uri = location.protocol + "//" + location.host + location.pathname;
    window.history.replaceState({}, document.title, clean_uri)
  }
}
