/**
 * Everything that go from this app to zeebe
 */
// what is sent as result
// should be the whole form, or an ACL decided value
interface OutputVariables {
  [key: string]: any
}
