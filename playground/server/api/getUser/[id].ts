import { defineEventHandler } from 'h3'
import users from '~/data/users.json'

export default defineEventHandler((event) => {
  const id = event.context.params?.id
  return users.find((v) => v.userId === id)
})
