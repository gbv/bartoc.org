
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
  it("shows both URL roles and updates a complete distribution", async () => {
    const distributions = [
      { download: "https://example.org/data.ndjson" },
      {
        accessURL: "https://example.org/landing-page",
        format: "http://format.gbv.de/jskos",
        mimetype: "text/turtle",
      },
    ]
    const wrapper = mountEditor(distributions)

    const urls = wrapper.findAll("input[aria-label^=\"Distribution URL\"]")
    const directDownloads = wrapper.findAll("input[type=\"checkbox\"]")

    expect(urls.map(input => input.element.value)).toEqual([
      "https://example.org/data.ndjson",
      "https://example.org/landing-page",
    ])
    expect(directDownloads.slice(0, 2).map(input => input.element.checked))
      .toEqual([true, false])

    await urls[1].setValue("https://example.org/new-landing-page")

    expect(updatedDistributions(wrapper)).toEqual([
      distributions[0],
      {
        ...distributions[1],
        accessURL: "https://example.org/new-landing-page",
      },
    ])
  })

  it("moves the URL between roles without losing metadata", async () => {
    const distribution = {
      accessURL: "https://example.org/vocabulary",
      format: "http://format.gbv.de/jskos",
      mimetype: "text/turtle",
      version: "2026-11",
      license: [{ uri: "https://example.org/license" }],
      size: "1.5 MB",
    }
    const wrapper = mountEditor([distribution])
    const { accessURL, ...metadata } = distribution

    await wrapper.get("input[type=\"checkbox\"]").setValue(true)

    const directDownload = [{
      ...metadata,
      download: accessURL,
    }]
    expect(updatedDistributions(wrapper)).toEqual(directDownload)

    await wrapper.setProps({ modelValue: directDownload })
    await wrapper.get("input[type=\"checkbox\"]").setValue(false)

    expect(updatedDistributions(wrapper)).toEqual([distribution])
  })

  it("shows available metadata as read-only labelled rows", () => {
    const wrapper = mountEditor([
      {
        accessURL: "https://example.org/vocabulary",
        format: "http://format.gbv.de/jskos",
        mimetype: "application/x-ndjson",
        version: "2026-11",
        license: [{ uri: "https://example.org/license" }],
      },
    ])

    const metadata = wrapper.get(".cc-distributions-editor__metadata")
    const rows = metadata.findAll(".cc-distributions-editor__metadata-item").map(row =>
      [row.get("dt").text(), row.get("dd").text()],
    )

    expect(rows).toEqual([
      ["Format", "http://format.gbv.de/jskos"],
      ["MIME type", "application/x-ndjson"],
      ["Version", "2026-11"],
      ["License", "https://example.org/license"],
    ])
    expect(metadata.findAll("input, select, textarea")).toHaveLength(0)
  })

  it("adds and removes a complete distribution", async () => {
    const existing = {
      accessURL: "https://example.org/vocabulary",
      format: "http://format.gbv.de/jskos",
    }
    const wrapper = mountEditor([existing])

    await wrapper.get("input[aria-label=\"New distribution URL\"]")
      .setValue("https://example.org/vocabulary")
    await wrapper.get(".cc-distributions-editor__new button").trigger("click")

    expect(updatedDistributions(wrapper)).toEqual([
      existing,
      { accessURL: "https://example.org/vocabulary" },
    ])

    await wrapper.setProps({ modelValue: updatedDistributions(wrapper) })
    await wrapper.get("button[aria-label=\"Remove distribution 2\"]")
      .trigger("click")

    expect(updatedDistributions(wrapper)).toEqual([existing])
  })
})
