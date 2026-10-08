// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import StatsPage from "../../vue/pages/StatsPage.vue"

describe("StatsPage", () => {
  it("shows available reports with records", () => {
    const wrapper = mount(StatsPage, {
      props: {
        schemesCount: 2345,
        reports: {
          "no-abstract": {
            title: "Missing abstract",
            level: "warning",
            totalErrors: 42,
            formats: ["json", "csv"],
          },
        },
      },
    })

    expect(wrapper.get("h1").text()).toBe("Statistics")
    expect(wrapper.get("a[href='/vocabularies']").text()).toBe("2345 vocabularies")
    expect(wrapper.get("a[href='/data/reports/growth.csv']").exists()).toBe(true)
    expect(wrapper.get("a[href='/data/reports/stats.json']").exists()).toBe(true)
    expect(wrapper.text()).toContain("Missing abstract (42 warnings)")
    expect(wrapper.get("a[href='/data/reports/no-abstract.csv']").text()).toBe("CSV")
  })
})
