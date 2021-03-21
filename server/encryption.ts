import crypto from "crypto"

export class Encryption {
  private key : crypto.KeyObject
  private iv : Buffer

  private static hashToBytes(phrase : string, bits : number = 0) {
    const hasher = crypto.createHash('sha512')
    hasher.update(phrase, 'utf8')
    let bytes = Buffer.from(hasher.digest('hex'), 'hex')

    if (! bits) return bytes
    if (bytes.byteLength == 0) {
      throw new RangeError
    }

    const octets = bits / 8

    while(bytes.byteLength < octets) {
      bytes = Buffer.from([...bytes, ...bytes])
    }
    return bytes.slice(0, octets)
  }

  constructor(passphrase : string, iv : string) {
    this.key = crypto.createSecretKey(Encryption.hashToBytes(passphrase, 256))
    this.iv = Encryption.hashToBytes(iv, 128)  // https://stackoverflow.com/a/59300054/435004
  }

  public encrypt(struct: any) : string {
    const cipher = crypto.createCipheriv('aes-256-cbc', this.key, this.iv)
    let encryptedData : string = cipher.update(JSON.stringify(struct), 'utf8', 'base64')
    encryptedData += cipher.final('base64')
    return encryptedData
  }

  public decrypt(encrypted: string) : any {
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, this.iv)
    let decryptedData = decipher.update(encrypted, 'base64', 'utf8')
    decryptedData += decipher.final('utf8')
    return JSON.parse(decryptedData)
  }
}
