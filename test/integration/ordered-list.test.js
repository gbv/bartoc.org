// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import OrderedList from "../../vue/components/OrderedList.vue"

function mountList(modelValue = ["first", "second"]) {
  return mount(OrderedList, {
    props: { modelValue },
    slots: {
      default: `
        <template #default="{ item, update }">
          <button class="replace" @click="update(item + '!')">{{ item }}</button>
        </template>
      `,
    },
  })
}

describe("OrderedList", () => {
  it("updates, moves, and removes items", async () => {
    const wrapper = mountList()

    await wrapper.findAll("button.replace")[0].trigger("click")
    await wrapper.findAll("button[aria-label='Move down']")[0].trigger("click")
    await wrapper.findAll("button[aria-label='Remove']")[0].trigger("click")

    expect(wrapper.emitted("update:modelValue").map(([value]) => value)).toEqual([
      ["first!", "second"],
      ["second", "first"],
      ["second"],
    ])
  })
})
