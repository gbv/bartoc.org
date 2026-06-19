// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from "vitest"
import { flushPromises, mount } from "@vue/test-utils"
import RegistryVocabularies from "../../vue/components/RegistryVocabularies.vue"

const registryUri = "http://bartoc.org/en/node/18605"
const vocabulariesUrl = "/api/voc?partOf=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F18605&limit=10"
const searchUrl = "/vocabularies?partOf=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F18605"

const LoadingIndicatorStub = {
  template: "<span data-testid=\"loading-indicator\" />",
}

function vocabulary() {
  return {
    uri: "http://bartoc.org/en/node/18606",
    prefLabel: { en: "Chinese Agricultural Thesaurus" },
  }
}

function response(items, count) {
  return {
    headers: {
      get(name) {
        if (name !== "X-Total-Count" || count === undefined) {
          return null
        }

        return String(count)
      },
    },
    json: async () => items,
  }
}

async function mountRegistryVocabularies(fetchImpl) {
  vi.stubGlobal("fetch", vi.fn(fetchImpl))

  const wrapper = mount(RegistryVocabularies, {
    props: {
      registryUri,
    },
    global: {
      stubs: {
        LoadingIndicator: LoadingIndicatorStub,
      },
    },
  })

  await flushPromises()
  return wrapper
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("RegistryVocabularies", () => {
  it("loads and renders vocabularies listed by the registry", async () => {
    const wrapper = await mountRegistryVocabularies(async () =>
      response([vocabulary()], 1),
    )

    expect(fetch).toHaveBeenCalledWith(vocabulariesUrl)
    expect(wrapper.get("a[href='/en/node/18606']").text()).toBe(
      "Chinese Agricultural Thesaurus",
    )
  })

  it("links to all vocabularies with the total count", async () => {
    const wrapper = await mountRegistryVocabularies(async () =>
      response([vocabulary()], 25),
    )

    const link = wrapper.get(`a[href='${searchUrl}']`)
    expect(link.text()).toBe("show all (25)")
    expect(link.classes()).toEqual(expect.arrayContaining([
      "cc-button",
      "cc-button-action",
    ]))
  })

  it("shows an empty state when no vocabularies are listed", async () => {
    const wrapper = await mountRegistryVocabularies(async () =>
      response([], 0),
    )

    expect(wrapper.text()).toContain("No vocabularies listed in BARTOC yet.")
    expect(wrapper.get(`a[href='${searchUrl}']`).text()).toBe("search in BARTOC")
  })

  it("keeps a search link when loading fails", async () => {
    const wrapper = await mountRegistryVocabularies(async () => {
      throw new Error("failed")
    })

    expect(wrapper.get(`a[href='${searchUrl}']`).text()).toBe("search in BARTOC")
  })
})
