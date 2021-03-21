import { User } from '/imports/model/user'

User.transform.addComputedField('isAdmin', () => false)
