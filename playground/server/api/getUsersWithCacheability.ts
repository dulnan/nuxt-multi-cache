import { defineEventHandler } from 'h3'
import users from '~/data/users.json'

export default defineEventHandler(() => {
  const limitedUsers = users.slice(0, 5)
  const cacheTags = limitedUsers.map((v) => `user:${v.userId}`)
  const maxAge = 5
  return {
    users: limitedUsers,
    cacheTags,
    maxAge,
    currentTime: Date.now(),
  }
})
