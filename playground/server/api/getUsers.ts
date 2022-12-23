import users from '~/data/users.json'

export default defineEventHandler((event) => {
  return users
})
