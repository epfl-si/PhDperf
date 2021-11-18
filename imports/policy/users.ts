import { User } from '/imports/model/user'
import findUp from "find-up";

require("dotenv").config({path: findUp.sync(".env")})

// assert roles are set at start, or crash
const adminsGroup = process.env.PHDASSESS_ROLE_ADMIN
const programAssistantsGroup = process.env.PHDASSESS_ROLE_PROGRAM_ASSISTANT

if (!adminsGroup || !programAssistantsGroup) {
  console.error(`Permissions are not set correctly.
 Please fix this env vars: PHDASSESS_ROLE_ADMIN and PHDASSESS_ROLE_PROGRAM_ASSISTANT`)
  process.exit()
}

User.transform.addComputedField('groupList', (user) => {
  return user.tequila?.group?.split(',') || [];
})

User.transform.addComputedField('isAdmin', (user) => {
    return user.tequila?.group?.split(',').includes(adminsGroup)
  }
)

User.transform.addComputedField('isProgramAssistant', (user) => {
    return user.tequila?.group?.split(',').includes(programAssistantsGroup)
  }
)
