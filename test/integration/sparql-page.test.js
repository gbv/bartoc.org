// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"

const editorInstances = vi.hoisted(() => [])
const rendererInstances = vi.hoisted(() => [])
const fetchMock = vi.hoisted(() => vi.fn())

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

const configuredExamples = [
  {
    label: "Count triples by graph",
    query: `SELECT ?g (COUNT(*) AS ?triples)
WHERE {
  GRAPH ?g {
    ?s ?p ?o
  }
}
GROUP BY ?g
ORDER BY DESC(?triples)`,
  },
  {
    label: "Construct sample triples",
    query: `CONSTRUCT {
  ?s ?p ?o
}
WHERE {
  GRAPH ?g {
    ?s ?p ?o
  }
}
LIMIT 10`,
  },
]

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
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        head: { vars: ["updated"] },
        results: { bindings: [] },
      }),
    })
    vi.stubGlobal("fetch", fetchMock)
  })

  it("shows the latest knowledge graph update reported by the endpoint", async () => {
    const timestamp = "2026-07-30T10:55:14Z"
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: {
          bindings: [{ updated: { value: timestamp } }],
        },
      }),
    })

    const wrapper = mount(SparqlPage, {
      props: {
        endpoint: "https://example.org/sparql",
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.find(".sparql-last-updated").exists()).toBe(true)
    })

    const time = wrapper.get(".sparql-last-updated time")
    expect(time.attributes("datetime")).toBe(timestamp)
    expect(time.text()).not.toBe("")

    const [url] = fetchMock.mock.calls[0]
    expect(url.searchParams.get("query")).toContain("dct:modified")

    wrapper.unmount()
  })

  it("loads configured examples without executing them", async () => {
    const wrapper = mount(SparqlPage, {
      props: {
        endpoint: "https://example.org/sparql",
        examples: configuredExamples,
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

    expect(wrapper.get("label[for='sparql-example']").text()).toBe("Example queries")

    await vi.waitFor(() => {
      expect(editor.refresh).toHaveBeenCalledOnce()
    })

    expect(editor.options.requestConfig).toEqual({
      endpoint: "https://example.org/sparql",
      method: "POST",
    })

    const exampleIds = select.findAll("option").slice(1).map(option => option.element.value)
    expect(exampleIds).toEqual(["0", "1"])

    for (const exampleId of exampleIds) {
      await select.setValue(exampleId)
    }

    expect(editor.setValue).toHaveBeenCalledTimes(2)
    expect(editor.setValue.mock.calls.map(([query]) => query)).toEqual(
      configuredExamples.map(({ query }) => query),
    )
    expect(editor.query).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it("hides the example controls when no examples are configured", () => {
    const wrapper = mount(SparqlPage, {
      props: {
        endpoint: "https://example.org/sparql",
      },
    })

    expect(wrapper.find(".example-query").exists()).toBe(false)

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
