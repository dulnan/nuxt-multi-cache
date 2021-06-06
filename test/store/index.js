import API from '~/api'

export const state = () => ({
  menuLinks: [],
})

export const mutations = {
  setMenuLinks(state, links) {
    state.menuLinks = links
  },
}

export const actions = {
  nuxtServerInit({ commit }, { route }) {
    return API.getMenu().then((links) => {
      commit('setMenuLinks', links)
    })
  },
}
