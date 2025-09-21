import { promises as fsp } from 'fs'
import path from 'path'
import { faker } from '@faker-js/faker'

function createRandomUser() {
  return {
    userId: faker.datatype.uuid(),
    username: faker.internet.userName(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    password: faker.internet.password(),
    birthdate: faker.date.birthdate(),
    company: faker.company.name(),
    registeredAt: faker.date.past(),
  }
}

async function generateUsers() {
  faker.seed(43234)
  const users = Array.from({ length: 100 }).map((v) => createRandomUser())
  const destinationFile = path.resolve('./playground/data/users.json')

  await fsp.writeFile(destinationFile, JSON.stringify(users))
}

async function main() {
  await generateUsers()
}

main()
