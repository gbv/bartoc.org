// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import StatsPage from "../../vue/pages/StatsPage.vue"

describe("StatsPage", () => {
  it("renders the vocabulary count and report links", () => {
    const wrapper = mount(StatsPage, {
      props: {
        schemesCount: 2345,
        reports: ["no-abstract.csv", "no-license.json"],
      },
    })

    expect(wrapper.get("h1").text()).toBe("Statistics")
    expect(wrapper.get("a[href='/vocabularies']").text()).toBe("2345 vocabularies")
    expect(wrapper.get("a[href='/data/reports/growth.csv']").exists()).toBe(true)
    expect(wrapper.get("a[href='/data/reports/stats.json']").exists()).toBe(true)

    const reportLinks = wrapper.findAll(".action-group a")
    expect(reportLinks.map(link => link.text())).toEqual([
      "no-abstract.csv",
      "no-license.json",
    ])
    expect(reportLinks.map(link => link.attributes("href"))).toEqual([
      "/data/reports/no-abstract.csv",
      "/data/reports/no-license.json",
    ])
  })

  it("hides the daily report section when there are no reports", () => {
    const wrapper = mount(StatsPage, {
      props: {
        schemesCount: 0,
      },
    })

    expect(wrapper.text()).not.toContain("Daily Data Quality Reports")
    expect(wrapper.find(".action-group").exists()).toBe(false)
  })
})
