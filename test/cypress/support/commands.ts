// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --

// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add('purgeTags', (tags: string[]) => {
  return cy.request({
    url: '/__nuxt_multi_cache/purge/tags',
    method: 'POST',
    body: tags,
  })
})

Cypress.Commands.add('purgePages', (pages: string[]) => {
  return cy.request({
    url: '/__nuxt_multi_cache/purge/page',
    method: 'POST',
    body: pages,
  })
})

Cypress.Commands.add('purgeComponents', (keys: string[]) => {
  return cy.request({
    url: '/__nuxt_multi_cache/purge/component',
    method: 'POST',
    body: keys,
  })
})

Cypress.Commands.add('purgeAll', () => {
  return cy.request({
    url: '/__nuxt_multi_cache/purge/all',
    method: 'POST',
  })
})

Cypress.Commands.add('getComponentStats', () => {
  return cy
    .request({
      url: '/__nuxt_multi_cache/stats/component',
    })
    .then((response) => response.body)
})
