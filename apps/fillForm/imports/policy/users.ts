import {Meteor} from "meteor/meteor";
import { User } from '/imports/model/user'

User.transform.addComputedField('groupList', (user) => {
  return user.tequila?.group?.split(',') || [];
})

User.transform.addComputedField('isAdmin', (user) => {
    const adminsGroup = Meteor.settings.public.phdAssessRoleAdmin
    if (!adminsGroup) {
      console.warn('Unable to read the admins group. Nobody will have the admin right')
      return false
    } else {
      return user.tequila?.group?.split(',').includes(adminsGroup)
    }
  }
)

User.transform.addComputedField('isUberProgramAssistant', (user) => {
    const programAssistantsGroup = Meteor.settings.public.phdAssessRoleProgramAssistant
    if (!programAssistantsGroup) {
      console.warn('Unable to read the program assistants group. Nobody will have this right')
      return false
    } else {
      return user.tequila?.group?.split(',').includes(programAssistantsGroup)
    }
  }
)
