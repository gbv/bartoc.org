// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import SparqlPage from "../../vue/pages/SparqlPage.vue"

const endpoint = "https://example.org/sparql"
const fetchMock = vi.fn()
let matgui
let tab

class MatguiMock {
  constructor(element, options) {
    tab = {
      query: vi.fn(),
      setQuery: vi.fn(),
    }
    this.element = element
    this.options = options
    this.getTab = () => tab
    this.destroy = vi.fn()
    matgui = this
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
    vi.stubGlobal("Yasgui", MatguiMock)
    vi.stubGlobal("Yasr", { defaults: yasrDefaults })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("configures MatGUI, and destroys it", async () => {
    const wrapper = mount(SparqlPage, {
      props: { endpoint },
    })

    expect(matgui.element).toBe(wrapper.get(".sparql-matgui").element)
    expect(matgui.options).toMatchObject({
      autofocus: false,
      persistenceId: null,
      populateFromUrl: false,
      quickStartOnFirstVisit: false,
      requestConfig: { endpoint, method: "POST" },
      yasqe: { value: "ASK {}" },
    })
    expect(window.Yasr.defaults.plugins.Geo).toBe(false)
    expect(matgui.options.endpointCatalogueOptions.getData()).toEqual([{ endpoint }])

    wrapper.unmount()
    expect(matgui.destroy).toHaveBeenCalledOnce()
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

    wrapper.unmount()
  })

  it("shows a danger message when MatGUI cannot be initialized", async () => {
    const initializationError = new Error("MatGUI failed")
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    vi.stubGlobal("Yasgui", class {
      constructor() {
        throw initializationError
      }
    })
    const wrapper = mount(SparqlPage, { props: { endpoint } })
    await wrapper.vm.$nextTick()

    const errorMessage = wrapper.get(".cc-message")
    expect(errorMessage.classes()).toContain("cc-message--danger")
    expect(errorMessage.attributes("role")).toBe("alert")
    expect(consoleError).toHaveBeenCalledWith(
      "Could not load the SPARQL query editor.",
      initializationError,
    )

    consoleError.mockRestore()
  })
})
