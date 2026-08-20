// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { nextTick, ref } from "vue"
import { describe, expect, it } from "vitest"
import EditPage from "../../vue/pages/EditPage.vue"

const ItemEditorStub = {
  name: "ItemEditor",
  props: {
    user: Object,
    auth: Object,
    current: Object,
    versionMain: Object,
    hasIncomingVersions: Boolean,
  },
  template: "<div data-test=\"item-editor\" />",
}

function mountPage(props, loginRefs = {}) {
  return mount(EditPage, {
    props,
    global: {
      provide: { "login-refs": loginRefs },
      stubs: { ItemEditor: ItemEditorStub },
    },
  })
}

describe("EditPage", () => {
  it("renders an existing item and forwards reactive login state", async () => {
    const item = {
      uri: "http://bartoc.org/en/node/123",
      prefLabel: { en: ["Example vocabulary"] },
    }
    const token = ref("token-123")
    const user = ref({ login: "editor" })
    const versionMain = {
      uri: "http://bartoc.org/en/node/122",
      prefLabel: { en: "Main vocabulary" },
    }
    const wrapper = mountPage({
      title: "Edit vocabulary",
      item,
      versionMain,
      cancelUrl: "/vocabularies?uri=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F123",
      hasIncomingVersions: true,
    }, { token, user })

    expect(wrapper.get("h1").text()).toBe("Edit vocabulary")
    const cancelAction = wrapper.get("a")
    expect(cancelAction.attributes("href")).toBe(
      "/vocabularies?uri=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F123",
    )
    expect(cancelAction.classes()).toContain("page-action")

    const editor = wrapper.getComponent(ItemEditorStub)
    expect(editor.props("current")).toEqual(item)
    expect(editor.props("versionMain")).toEqual(versionMain)
    expect(editor.props("hasIncomingVersions")).toBe(true)
    expect(editor.props("auth")).toEqual({ token: "token-123" })
    expect(editor.props("user")).toEqual({ login: "editor" })

    token.value = null
    await nextTick()

    expect(editor.props("auth")).toBeNull()
  })

  it("uses an empty item when adding a vocabulary", () => {
    const wrapper = mountPage({
      title: "Add vocabulary",
      item: null,
      cancelUrl: "/vocabularies?uri=",
    })

    expect(wrapper.get("h1").text()).toBe("Add vocabulary")
    expect(wrapper.getComponent(ItemEditorStub).props("current")).toEqual({})
    expect(wrapper.getComponent(ItemEditorStub).props("versionMain")).toBeNull()
  })
})
