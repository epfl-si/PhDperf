## Howto:

- Edit a formio form
  - take the JSON form definition and paste it into https://formio.github.io/formio.js/app/sandbox, in the "FORM JSON" part
    **Q: Can I decrypt values from meteor shell ?**

- Decrypt data in meteor shell
  ```
  import {decrypt as decrypter} from './server/encryption.ts'

  let to_decrypt = ''

  decrypter(to_decrypt)
  ```
