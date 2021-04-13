<template>
  <span
    v-if="iconData"
    style="padding-right: 0.5em">
    <font-awesome-icon
      :icon="iconData[0]"
      :flip="iconData[1]" />
  </span>
  <span v-else>
    {{ icon }}
  </span>
</template>

<script>
// this component abstracts from font-awesome technical details
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { library } from "@fortawesome/fontawesome-svg-core"
import { faLevelUpAlt, faLevelDownAlt } from "@fortawesome/free-solid-svg-icons"
library.add(faLevelUpAlt, faLevelDownAlt)

const knownIcons = {
  levelUp: ["level-up-alt","horizontal"],
  levelDown: ["level-down-alt","horizontal"],
}

export default {
  components: { FontAwesomeIcon },
  props: {
    icon: {
      type: String,
      required: true,
    },
  },
  computed: {
    iconData() { return knownIcons[this.icon] },
  },
}
</script>
