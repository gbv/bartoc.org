// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import StatsPage from "../../vue/pages/StatsPage.vue"

describe("StatsPage", () => {
  it("shows available reports with records", () => {
    const wrapper = mount(StatsPage, {
      props: {
        schemesCount: 2345,
        reports: ["no-abstract.csv", "no-license.json", "no-kos-type.json", "quality-stats.json"],
        warningCounts: { "no-abstract": 1, "no-license": 2, "no-kos-type": 0 },
      },
    })

    expect(wrapper.get("h1").text()).toBe("Statistics")
    expect(wrapper.get("a[href='/vocabularies']").text()).toBe("2345 vocabularies")
    expect(wrapper.get("a[href='/data/reports/growth.csv']").exists()).toBe(true)
    expect(wrapper.get("a[href='/data/reports/stats.json']").exists()).toBe(true)
    expect(wrapper.text()).toContain("Missing abstract")
    expect(wrapper.text()).toContain("Missing license")
    expect(wrapper.text()).not.toContain("Missing KOS type")
    expect(wrapper.get("a[href='/data/reports/no-abstract.csv']").text()).toBe("CSV")
    expect(wrapper.get("a[href='/data/reports/no-license.json']").text()).toBe("JSON")
    expect(wrapper.get("a[href='/data/reports/quality-stats.json']").text()).toBe("JSON")
    expect(wrapper.find("a[href='/data/reports/no-kos-type.json']").exists()).toBe(false)
  })

  it("hides the daily report section when there are no reports", () => {
    const wrapper = mount(StatsPage, {
      props: {
        schemesCount: 0,
      },
    })

    expect(wrapper.text()).not.toContain("Daily Data Quality Reports")
  })
})
