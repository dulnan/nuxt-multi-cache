describe('The page cache', () => {
  it('should cache the home route', () => {
    cy.purgeAll()
    cy.visit('/')

    cy.get('.title')
      .should('exist')
      .invoke('text')
      .then((text) => {
        cy.visit('/')

        cy.get('.title').contains(text)
      })
  })

  it('should purge the home route by path', () => {
    cy.purgeAll()
    cy.visit('/')

    cy.get('.title')
      .invoke('text')
      .then((text) => {
        cy.visit('/')

        cy.get('.title').contains(text)
        cy.purgePages(['/'])

        cy.wait(1000)
        cy.visit('/')
        cy.get('.title').should('not.contain', text)

        cy.get('.title')
          .invoke('text')
          .then((newText) => {
            cy.visit('/')
            cy.get('.title').contains(newText)
          })
      })
  })

  it.only('should purge the home route by cache tag', () => {
    cy.purgeAll()
    cy.visit('/')

    cy.get('.title')
      .invoke('text')
      .then((text) => {
        cy.visit('/')

        cy.get('.title').contains(text)
        cy.purgeTags(['home'])

        cy.wait(1000)
        cy.visit('/')
        cy.get('.title').should('not.contain', text)
      })
  })
})
