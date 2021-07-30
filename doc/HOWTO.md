## Howto:

- Edit a formio form
  - take the JSON form definition and paste it into https://formio.github.io/formio.js/app/sandbox, in the "FORM JSON" part
    **Q: Can I decrypt values from meteor shell ?**

- Decrypt data in meteor shell
  ```
  import {decrypt as decrypter, encrypt as encrypter} from './server/encryption.ts'

  to_encrypt = ''
  to_decrypt = ''
  encrypted = encrypter(to_encrypt)
  decrypter(to_decrypt)
  ```
