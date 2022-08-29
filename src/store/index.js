import Vue from 'vue'
import Vuex from 'vuex'
import fetch from 'node-fetch'
Vue.use(Vuex)

export function createStore() {
  return new Vuex.Store({
    state: {
      item: {},
    },
    mutations: {
      setItem(state, payload) {
        state.item = payload
      },
    },
    actions: {
      fetchItem({ commit }) {
        return fetch('https://v1.hitokoto.cn')
          .then(response => response.json())
          .then(data => {
            commit('setItem', data)
          })
          .catch(console.error)
      },
    },
  })
}
