<template>
  <div>
    <h3>{{  item.hitokoto  }}</h3>
    <div>- {{  item.creator  }}</div>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  asyncData({ store }) {
    return store.dispatch('fetchItem')
  },
  computed: {
    item() {
      return this.$store.state.item
    }
  },
  mounted() { }
}
</script>

<style scoped>
</style>