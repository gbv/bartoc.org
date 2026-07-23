// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"

const editorInstances = vi.hoisted(() => [])
const rendererInstances = vi.hoisted(() => [])

vi.mock("@zazuko/yasqe", () => ({
  default: class YasqeMock {
    constructor(_element, options) {
      this.options = options
      this.setValue = vi.fn()
      this.query = vi.fn()
      this.on = vi.fn()
      this.off = vi.fn()
      this.destroy = vi.fn()
      this.refresh = vi.fn()
      this.getPrefixesFromQuery = vi.fn(() => ({}))
      editorInstances.push(this)
    }
  },
}))

vi.mock("@zazuko/yasr", () => ({
  default: class YasrMock {
    constructor() {
      this.setResponse = vi.fn()
      this.destroy = vi.fn()
      rendererInstances.push(this)
    }
  },
}))

import SparqlPage from "../../vue/pages/SparqlPage.vue"

function sparqlJsonResponse(data) {
  return {
    content: JSON.stringify(data),
    headers: new Headers({
      "content-type": "application/sparql-results+json",
    }),
  }
}

describe("SparqlPage", () => {
  beforeEach(() => {
    editorInstances.length = 0
    rendererInstances.length = 0
  })

  it("loads two named-graph examples without executing them", async () => {
    const wrapper = mount(SparqlPage, {
      props: {
        endpoint: "https://example.org/sparql",
      },
    })

    const loadingStatus = wrapper.get("[role='status']")
    expect(loadingStatus.attributes("aria-label")).toBe("Loading SPARQL query editor…")
    expect(loadingStatus.get(".jskos-vue-loadingIndicator").attributes("aria-hidden")).toBe("true")

    await vi.waitFor(() => {
      expect(editorInstances).toHaveLength(1)
    })

    const editor = editorInstances[0]
    const select = wrapper.get("#sparql-example")
    const loadButton = wrapper.get("button")

    await vi.waitFor(() => {
      expect(editor.refresh).toHaveBeenCalledOnce()
    })

    const exampleIds = select.findAll("option").slice(1).map(option => option.element.value)
    expect(exampleIds).toEqual(["triples-by-graph", "sample-triples"])

    for (const exampleId of exampleIds) {
      await select.setValue(exampleId)
      await loadButton.trigger("click")
    }

    expect(editor.setValue).toHaveBeenCalledTimes(2)
    for (const [query] of editor.setValue.mock.calls) {
      expect(query).toContain("GRAPH ?g")
    }
    expect(editor.query).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it("shows query progress, empty results, and safe errors below the editor", async () => {
    const wrapper = mount(SparqlPage, {
      props: {
        endpoint: "https://example.org/sparql",
      },
    })

    await vi.waitFor(() => {
      expect(editorInstances).toHaveLength(1)
      expect(rendererInstances).toHaveLength(1)
    })

    const editor = editorInstances[0]
    const renderer = rendererInstances[0]
    const handler = event => editor.on.mock.calls.find(([name]) => name === event)[1]

    handler("query")(editor)
    await wrapper.vm.$nextTick()

    expect(wrapper.get("[role='status']").text()).toBe("Running query…")
    expect(wrapper.get(".sparql-results").isVisible()).toBe(false)

    await handler("queryResponse")(editor, sparqlJsonResponse({
      head: { vars: ["item"] },
      results: { bindings: [] },
    }), 10)

    expect(wrapper.get("[role='status']").text()).toBe("No results.")
    expect(renderer.setResponse).not.toHaveBeenCalled()

    await handler("queryResponse")(editor, new Error("<script>unsafe details</script>"), 10)

    const alert = wrapper.get("[role='alert']")
    expect(alert.text()).toBe("Query failed. Check the query and try again.")
    expect(alert.text()).not.toContain("unsafe details")

    await handler("queryResponse")(editor, sparqlJsonResponse({
      head: { vars: ["item"] },
      results: { bindings: [{ item: { type: "uri", value: "https://example.org/item" } }] },
    }), 10)

    expect(renderer.setResponse).toHaveBeenCalledOnce()
    expect(wrapper.get(".sparql-results").attributes("style")).not.toContain("display: none")

    wrapper.unmount()
  })
})
