const e = id => document.getElementById(id)
const RSA = new window.JSEncrypt({default_key_size: 512})
const keylength = 52

let publicKey = window.localStorage.getItem('public')
let privateKey = window.localStorage.getItem('private')
if (!publicKey || publicKey === 'null') {
  publicKey = RSA.getPublicKeyB64()
  window.localStorage.setItem('public', publicKey)
}
if (!privateKey || privateKey === 'null') {
  privateKey = RSA.getPrivateKeyB64()
  window.localStorage.setItem('private', privateKey)
}

const delimiter = ';'

let state = 'start'
let senderpublic = null
let secret = null

const randomKey = () => window.CryptoJS.lib.WordArray.random(keylength/2).toString()

const AES = {
  encrypt: (msg, pass) => {
    return window.CryptoJS.AES.encrypt(msg, pass).toString();
  },
  decrypt: (encrypted, pass) => {
    var decrypted = window.CryptoJS.AES.decrypt(encrypted, pass);
    return decrypted.toString(window.CryptoJS.enc.Utf8);
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
    RSA.setPrivateKey(privateKey)
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
  copy([publicKey, rsaEncryptedSecret, aesEncryptedMsg].join(delimiter))
}

const test = () => {
  const p = decodeURIComponent(encodeURIComponent(publicKey))
  RSA.setPublicKey(p)
  RSA.setPrivateKey(privateKey)
  console.log(RSA.decrypt(RSA.encrypt('Test passed.')))
}

const encodeURL = string => encodeURIComponent(string.split('+').join('-').split('/').join('_').split('=').join('~'))
const decodeURL = string => decodeURIComponent(string).split('-').join('+').split('_').join('/').split('~').join('=')

const action = () => {
  if (state === 'start') {
    copy('https://chatwithrsa.web.app?m=' + encodeURL(publicKey))
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
  e('public').innerHTML = publicKey
  e('private').innerHTML = privateKey
  
  const urlParams = new URLSearchParams(window.location.search)
  const message = urlParams.get('m')
  if (message !== null) {
    state = 'decrypt'
    decrypt(decodeURL(message))
    const clean_uri = location.protocol + "//" + location.host + location.pathname;
    window.history.replaceState({}, document.title, clean_uri)
  }
}
