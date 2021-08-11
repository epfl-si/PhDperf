import {Meteor} from 'meteor/meteor'
const CryptoJS = require("crypto-js");

export function encrypt(message: string | [], passphrase: string | undefined = process.env.PHDASSESS_ENCRYPTION_KEY): string {
  if (passphrase === undefined) {
    throw new Meteor.Error('encryption error', 'Trying to encrypt a value without a passphrase set');
  }

  if (message === "") {
    return message;
  } else {
    return CryptoJS.AES.encrypt(JSON.stringify(message), passphrase).toString();
  }

}

export function decrypt(cryptedMessage: string, passphrase: string | undefined = process.env.PHDASSESS_ENCRYPTION_KEY): string {
  if (passphrase === undefined) {
    throw new Meteor.Error('encryption error', 'Trying to encrypt a value without a passphrase set');
  }
  if (cryptedMessage === "") {
    return cryptedMessage;
  } else {
    const bytes = CryptoJS.AES.decrypt(cryptedMessage, passphrase)
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
  }
}
