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
            types: ["no-abstract"],
            formats: ["json", "csv"],
          },
          summary: { title: "Full report", totalErrors: 3, formats: ["json"] },
        },
      },
    })

    expect(wrapper.get("h1").text()).toBe("Statistics")
    expect(wrapper.get("a[href='/vocabularies']").text()).toBe("2345 vocabularies")
    expect(wrapper.get("a[href='/data/reports/growth.csv']").exists()).toBe(true)
    expect(wrapper.get("a[href='/data/reports/stats.json']").exists()).toBe(true)
    expect(wrapper.text()).toContain("Missing abstract (42 warnings)")
    expect(wrapper.get("h5 a").attributes("href")).toBe("/vocabularies/?filter=error%3Ano-abstract")
    expect(wrapper.get("h5 a").text()).toBe("42 warnings")
    expect(wrapper.findAll("h5 a")).toHaveLength(1)
    expect(wrapper.get("a[href='/data/reports/no-abstract.csv']").text()).toBe("CSV")
  })
})
