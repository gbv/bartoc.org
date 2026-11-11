
// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { mount } from "@vue/test-utils"
import DistributionsEditor from "../../vue/components/DistributionsEditor.vue"

function mountEditor(distributions) {
  return mount(DistributionsEditor, {
    props: { modelValue: distributions },
  })
}

function updatedDistributions(wrapper) {
  return wrapper.emitted("update:modelValue").at(-1)[0]
}

describe("DistributionsEditor", () => {
  it("updates a URL without losing distribution metadata", async () => {
    const distribution = {
      download: "https://example.org/old.ttl",
      format: "http://format.gbv.de/jskos",
      mimetype: "text/turtle",
    }
    const wrapper = mountEditor([distribution])

    await wrapper.get("input[aria-label=\"Download URL 1\"]")
      .setValue("https://example.org/new.ttl")

    expect(updatedDistributions(wrapper)).toEqual([{
      ...distribution,
      download: "https://example.org/new.ttl",
    }])
    expect(distribution.download).toBe("https://example.org/old.ttl")
  })

  it("adds a publication URL without changing downloads", async () => {
    const distribution = {
      download: "https://example.org/vocabulary.ttl",
      format: "http://format.gbv.de/jskos",
    }
    const wrapper = mountEditor([distribution])

    await wrapper.get("input[aria-label=\"New publication URL\"]")
      .setValue("https://example.org/vocabulary")
    await wrapper.get(".cc-distributions-editor__section--publications button.cc-button")
      .trigger("click")

    expect(updatedDistributions(wrapper)).toEqual([
      distribution,
      { accessURL: "https://example.org/vocabulary" },
    ])
  })

  it("removes one URL without losing the rest of the distribution", async () => {
    const distribution = {
      download: "https://example.org/vocabulary.ttl",
      accessURL: "https://example.org/vocabulary",
      format: "http://format.gbv.de/jskos",
      mimetype: "text/turtle",
    }
    const wrapper = mountEditor([distribution])

    await wrapper.get(".cc-distributions-editor__section--downloads button[aria-label=\"Remove\"]")
      .trigger("click")

    expect(updatedDistributions(wrapper)).toEqual([{
      accessURL: distribution.accessURL,
      format: distribution.format,
      mimetype: distribution.mimetype,
    }])
  })
})
