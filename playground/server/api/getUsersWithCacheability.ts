import { defineEventHandler } from 'h3'
import users from '~/data/users.json'

export type UsersWithCacheability = {
  users: (typeof users)[number][]
  cacheTags: string[]
  maxAge: number
  currentTime: number
}

export default defineEventHandler<UsersWithCacheability>(() => {
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
