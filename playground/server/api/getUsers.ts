import { defineEventHandler } from 'h3'
import users from '~/data/users.json'

export default defineEventHandler(() => {
  return users
})
