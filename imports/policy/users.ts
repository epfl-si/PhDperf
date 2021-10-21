import { User } from '/imports/model/user'

User.transform.addComputedField('groupList', (user) => {
  return user.tequila?.group?.split(',') || [];
})

User.transform.addComputedField('isAdmin', (user) => {
    return user.tequila?.group?.split(',').includes('PhD-annual-report-admin')
  }
)

User.transform.addComputedField('isProgramAssistant', (user) => {
    return user.tequila?.group?.split(',').includes('PhDAssess-Activity_Specify_Participants-Test')
  }
)
