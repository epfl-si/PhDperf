## Howto

**Q: How to edit a formio form**

**A:** Take the JSON form definition and paste it into https://formio.github.io/formio.js/app/sandbox, in the "FORM JSON" part


**Q: How to decrypt values from meteor shell ?**

**A:** Be certain to have the correct PHDASSESS_ENCRYPTION_KEY that has served to encrypt into you .env
Then, open a Meteor shell with `meteor shell` and edit + copy-paste the following script:
  ```
  import {decrypt as decrypter, encrypt as encrypter} from './server/encryption.ts'

  to_encrypt = ''
  to_decrypt = ''
  encrypted = encrypter(to_encrypt)
  decrypter(to_decrypt)
  ```
