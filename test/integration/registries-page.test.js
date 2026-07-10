// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import RegistriesPage from "../../vue/pages/RegistriesPage.vue"

describe("RegistriesPage", () => {
  it("renders the registry list and poster reference", () => {
    const wrapper = mount(RegistriesPage, {
      global: {
        stubs: {
          RegistryList: {
            template: "<div data-test=\"registry-list\" />",
          },
        },
      },
    })

    expect(wrapper.get("h1").text()).toBe("Terminology Registries")
    expect(wrapper.get("[data-test='registry-list']").exists()).toBe(true)
    expect(wrapper.get("#poster").text()).toContain("Terminology Registries and Services")
    expect(wrapper.get("#poster").text()).toMatch(/SWIB 2016\s+https:\/\/doi\.org/)
    expect(wrapper.get("a[href='https://doi.org/10.5281/zenodo.166717']").exists()).toBe(true)
  })
})
