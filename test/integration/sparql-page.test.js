// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import SparqlPage from "../../vue/pages/SparqlPage.vue"

const endpoint = "https://example.org/sparql"
const fetchMock = vi.fn()
let yasgui
let tab

class YasguiMock {
  constructor(element, options) {
    tab = {
      query: vi.fn(),
      setQuery: vi.fn(),
    }
    this.element = element
    this.options = options
    this.getTab = () => tab
    this.destroy = vi.fn()
    yasgui = this
  }
}

const yasrDefaults = {
  plugins: {
    Geo: { enabled: true },
  },
}

describe("SparqlPage", () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({
      ok: true,
      json: async () => ({ results: { bindings: [] } }),
    })
    vi.stubGlobal("fetch", fetchMock)
    vi.stubGlobal("Yasgui", YasguiMock)
    vi.stubGlobal("Yasr", { defaults: yasrDefaults })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("configures YASGUI, loads an example, and destroys it", async () => {
    const example = { label: "Construct triples", query: "CONSTRUCT WHERE { ?s ?p ?o }" }
    const wrapper = mount(SparqlPage, {
      props: { endpoint, examples: [example] },
    })

    expect(yasgui.element).toBe(wrapper.get(".sparql-yasgui").element)
    expect(yasgui.options).toMatchObject({
      autofocus: false,
      persistenceId: null,
      populateFromUrl: false,
      requestConfig: { endpoint, method: "POST" },
      yasqe: { value: "ASK {}" },
    })
    expect(window.Yasr.defaults.plugins.Geo).toBe(false)
    expect(yasgui.options.endpointCatalogueOptions.getData()).toEqual([{ endpoint }])

    await wrapper.get("#sparql-example").setValue("0")
    expect(tab.setQuery).toHaveBeenCalledWith(example.query)
    expect(tab.query).not.toHaveBeenCalled()

    wrapper.unmount()
    expect(yasgui.destroy).toHaveBeenCalledOnce()
  })

  it("shows the knowledge graph update time", async () => {
    const timestamp = "2026-08-04T09:42:14"
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: { bindings: [{ updated: { value: timestamp } }] },
      }),
    })

    const wrapper = mount(SparqlPage, { props: { endpoint } })
    await vi.waitFor(() => expect(wrapper.find("time").exists()).toBe(true))

    const time = wrapper.get("time")
    expect(time.attributes("datetime")).toBe(`${timestamp}Z`)
    expect(time.text()).toBe(new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(`${timestamp}Z`)))
    expect(fetchMock.mock.calls[0][0].searchParams.get("query")).toContain("dct:modified")
    expect(wrapper.find(".example-query").exists()).toBe(false)

    wrapper.unmount()
  })
})
