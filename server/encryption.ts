const CryptoJS = require("crypto-js");

export function encrypt(passphrase: string, message: string) {
    return CryptoJS.AES.encrypt(JSON.stringify(message), passphrase).toString();
}

export function decrypt(passphrase: string, cryptedMessage: string) {
  const bytes = CryptoJS.AES.decrypt(cryptedMessage, passphrase)
  return bytes.toString(CryptoJS.enc.Utf8)
}
