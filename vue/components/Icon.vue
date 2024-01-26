<template>
  <span
    v-if="icon"
    :style="padding ? `padding-right: ${padding}` : undefined">
    <font-awesome-icon
      :icon="icon[0]"
      :flip="icon[1]" />
  </span>
  <span v-else>
    {{ name }}
  </span>
</template>

<script>
// this component abstracts from font-awesome technical details
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { library } from "@fortawesome/fontawesome-svg-core"
import { faLevelUpAlt, faLevelDownAlt, faLink, faCalendar, faCalendarDay } from "@fortawesome/free-solid-svg-icons"
library.add(faLevelUpAlt, faLevelDownAlt, faLink, faCalendar, faCalendarDay)

const knownIcons = {
  created: ["calendar"],
  levelUp: ["level-up-alt","horizontal"],
  levelDown: ["level-down-alt","horizontal"],
  link: ["link"],
  modified: ["calendar-day"],
}

export default {
  components: { FontAwesomeIcon },
  props: {
    name: {
      type: String,
      required: true,
    },
    padding: {
      type: String,
      default: "0.5em",
    },
  },
  computed: {
    icon() {
      return knownIcons[this.name] 
    },
  },
}
</script>
