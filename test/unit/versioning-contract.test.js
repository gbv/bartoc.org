import { describe, expect, it } from "vitest"
import {
  DERIVED_VERSION_FIELDS,
  deriveVersionRecord,
  hasMeaningfulValue,
  sortVersionRecordsByStartDate,
  versionNumber,
  versionRole,
} from "../../src/versioning.js"
import {
  THE_SOZ_MAIN_URI,
  storedTheSozMain,
  storedTheSoz2004,
  storedTheSoz2009,
} from "../fixtures/versioning.js"

describe("version records", () => {
  it("lists fields taken from the main record", () => {
    expect(DERIVED_VERSION_FIELDS).toEqual([
      "definition",
      "notation",
      "subject",
      "languages",
      "notationExamples",
    ])
  })

  it("finds empty and saved values", () => {
    expect([
      undefined,
      " ",
      [],
      { en: [" "] },
      false,
      0,
      { en: ["value"] },
    ].map(hasMeaningfulValue)).toEqual([
      false,
      false,
      false,
      false,
      true,
      true,
      true,
    ])
  })

  it("reads version numbers as text", () => {
    expect(versionNumber({ version: " 3.0 beta " })).toBe("3.0 beta")
    expect(versionNumber({ version: 3 })).toBe("")
    expect(versionNumber({})).toBe("")
  })

  it("sorts versions by start date without changing the source list", () => {
    const records = [
      { uri: "undated-1" },
      { uri: "dated-2", startDate: "2009" },
      { uri: "dated-1", startDate: " 2004 " },
      { uri: "dated-3", startDate: "2009" },
      { uri: "undated-2", startDate: " " },
    ]

    expect(sortVersionRecordsByStartDate(records).map(record => record.uri)).toEqual([
      "dated-1",
      "dated-2",
      "dated-3",
      "undated-1",
      "undated-2",
    ])
    expect(records.map(record => record.uri)).toEqual([
      "undated-1",
      "dated-2",
      "dated-1",
      "dated-3",
      "undated-2",
    ])
    expect(sortVersionRecordsByStartDate()).toEqual([])
  })

  it("finds the role of a record", () => {
    expect([
      versionRole({}),
      versionRole(storedTheSozMain, [{}]),
      versionRole(storedTheSoz2004),
      versionRole(storedTheSoz2004, [{}]),
    ]).toEqual(["standalone", "main", "version", "mixed"])
  })

  it("derives missing values from the main record", () => {
    expect(deriveVersionRecord(storedTheSoz2004, storedTheSozMain)).toEqual({
      effectiveItem: {
        ...storedTheSoz2004,
        prefLabel: {
          en: "Thesaurus for the Social Sciences 3.0",
          de: "Thesaurus Sozialwissenschaften 3.0",
        },
        notation: storedTheSozMain.notation,
        languages: storedTheSozMain.languages,
        notationExamples: storedTheSozMain.notationExamples,
        subject: storedTheSozMain.subject,
      },
      derivedFields: {
        prefLabel: { from: THE_SOZ_MAIN_URI },
        notation: { from: THE_SOZ_MAIN_URI },
        languages: { from: THE_SOZ_MAIN_URI },
        notationExamples: { from: THE_SOZ_MAIN_URI },
        subject: { from: THE_SOZ_MAIN_URI },
      },
    })
  })

  it("keeps values stored on the version", () => {
    expect(deriveVersionRecord(storedTheSoz2009, storedTheSozMain)).toEqual({
      effectiveItem: storedTheSoz2009,
      derivedFields: {},
    })
  })

  it("needs the right main record", () => {
    const noLink = { ...storedTheSoz2004, versionOf: [] }
    const otherMain = {
      ...storedTheSozMain,
      uri: "http://bartoc.org/en/node/99904",
    }

    expect(deriveVersionRecord(noLink, storedTheSozMain)).toEqual({
      effectiveItem: noLink,
      derivedFields: {},
    })
    expect(deriveVersionRecord(storedTheSoz2004, otherMain)).toEqual({
      effectiveItem: storedTheSoz2004,
      derivedFields: {},
    })
  })

  it("keeps saved records unchanged", () => {
    const version = structuredClone(storedTheSoz2004)
    const main = structuredClone(storedTheSozMain)
    const { effectiveItem } = deriveVersionRecord(version, main)

    effectiveItem.notation.push("Changed")

    expect(version).toEqual(storedTheSoz2004)
    expect(main).toEqual(storedTheSozMain)
  })
})
