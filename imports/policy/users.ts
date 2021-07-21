import { User } from '/imports/model/user'

User.transform.addComputedField('groupList', (user) => {
  return user.tequila?.group?.split(',') || [];
})

User.transform.addComputedField('isAdmin', (user) => {
    return user.tequila?.group?.split(',').includes('idev-fsd-membres')
  }
)
