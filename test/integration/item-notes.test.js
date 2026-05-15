// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import ItemNotes from "../../vue/components/ItemNotes.vue"

function mountItemNotes(item) {
  return mount(ItemNotes, {
    props: { item },
  })
}

describe("ItemNotes", () => {
  it("renders notes with language tags and note type titles", () => {
    const wrapper = mountItemNotes({
      definition: { en: ["English definition"], de: ["Deutsche Definition"] },
      scopeNote: { fr: ["Note de portee"] },
    })

    const notes = wrapper.findAll(".language-tag")
    const listItems = wrapper.findAll("li")

    expect(notes.map(note => note.text())).toEqual([
      "Note de portee",
      "English definition",
      "Deutsche Definition",
    ])
    expect(notes.map(note => note.attributes("lang"))).toEqual([
      "fr",
      "en",
      "de",
    ])
    expect(listItems.map(note => note.attributes("title"))).toEqual([
      "scopeNote",
      "definition",
      "definition",
    ])
  })
})
