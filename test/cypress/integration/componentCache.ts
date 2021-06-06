describe('The component cache', () => {
  it('should cache a component', () => {
    const random = Math.round(Math.random() * 100000).toString()
    cy.purgeAll()
    cy.visit('/lorem?hash=' + random)

    cy.get('.foo .hash').eq(0).contains(random)

    cy.visit('/lorem?hash=' + random)
    cy.get('.foo .hash').eq(0).contains(random)

    cy.visit('/lorem?hash=another_hash_random')
    cy.get('.foo .hash').eq(0).contains(random)
  })

  it('should cache multiple variations of a component', () => {
    cy.purgeAll()
    cy.visit('/lorem')
    cy.get('.foo p').eq(0).contains('1')
    cy.get('.foo p').eq(1).contains('2')
    cy.get('.foo p').eq(2).contains('3')
    cy.get('.foo p').eq(3).contains('4')

    cy.getComponentStats().then((stats) => {
      console.log(stats)
    })
  })

  it('should return stats about cached components', () => {
    cy.purgeAll()
    cy.visit('/lorem')
    cy.getComponentStats().then((stats) => {
      expect(stats.rows.length).to.be.eq(5)

      const allKeys = stats.rows.map((v) => v.key)
      assert.isTrue(allKeys.includes('Foo::1'))
      assert.isTrue(allKeys.includes('Foo::2'))
      assert.isTrue(allKeys.includes('Foo::3'))
      assert.isTrue(allKeys.includes('Foo::4'))
      assert.isTrue(allKeys.includes('Navbar::default'))

      const item = stats.rows.find((v) => v.key === 'Foo::1')
      assert.include(item.tags, 'foo:1')
      assert.equal(item.tags.length, 1)
    })
  })

  it('should update stats after purging', () => {
    cy.purgeAll()
    cy.visit('/lorem')
    cy.getComponentStats().then((stats) => {
      expect(stats.rows.length).to.be.eq(5)

      cy.purgeComponents(['Foo::1'])
      cy.getComponentStats().then((newStats) => {
        expect(newStats.rows.length).to.be.eq(4)
      })
    })
  })

  it('should purge components by tag', () => {
    cy.purgeAll()
    cy.visit('/lorem')
    cy.getComponentStats().then((stats) => {
      expect(stats.rows.length).to.be.eq(5)

      cy.purgeTags(['foo:1'])
      cy.getComponentStats().then((newStats) => {
        expect(newStats.rows.length).to.be.eq(4)
      })
    })
  })
})
