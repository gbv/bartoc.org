import { describe, expect, it } from "vitest"
import {
  DERIVED_VERSION_FIELDS,
  deriveVersionRecord,
  hasMeaningfulValue,
  recordKind,
} from "../../src/versioning.js"
import {
  THE_SOZ_MAIN_URI,
  derivationContractCases,
  localByDefaultMainFields,
  meaningfulValueContractCases,
  recordKindContractCases,
  storedTheSoz2004,
  storedTheSoz2009,
} from "../fixtures/versioning.js"

describe("versioning MVP contract", () => {
  it("uses the conservative three-field allowlist", () => {
    expect(DERIVED_VERSION_FIELDS).toEqual([
      "definition",
      "notation",
      "subject",
    ])
    expect(Object.isFrozen(DERIVED_VERSION_FIELDS)).toBe(true)
  })

  it("keeps TheSoz version relations as raw URI references", () => {
    expect(storedTheSoz2004.versionOf).toEqual([{ uri: THE_SOZ_MAIN_URI }])
    expect(storedTheSoz2009.versionOf).toEqual([{ uri: THE_SOZ_MAIN_URI }])
  })

  it("defines only allowlisted fields as derived", () => {
    for (const contract of derivationContractCases) {
      for (const field of Object.keys(contract.expected.derivedFields)) {
        expect(
          DERIVED_VERSION_FIELDS,
          `${contract.name} unexpectedly derives ${field}`,
        ).toContain(field)
        expect(contract.expected.derivedFields[field].from).toBe(contract.main.uri)
      }
    }
  })

  it("keeps version identity and title local in every expected effective item", () => {
    for (const contract of derivationContractCases) {
      expect(contract.expected.effectiveItem.uri).toBe(contract.version.uri)
      expect(contract.expected.effectiveItem.prefLabel).toEqual(contract.version.prefLabel)
    }
  })

  it("documents local-by-default fields outside the allowlist", () => {
    expect(Object.keys(localByDefaultMainFields)).not.toEqual([])
    expect(
      Object.keys(localByDefaultMainFields).filter(field =>
        DERIVED_VERSION_FIELDS.includes(field)),
    ).toEqual([])
  })

  it.each(meaningfulValueContractCases)(
    "defines $name as meaningful: $expected",
    ({ value, expected }) => {
      expect(hasMeaningfulValue(value)).toBe(expected)
    },
  )

  it.each(recordKindContractCases)(
    "classifies a $name",
    ({ item, incomingVersions, expected }) => {
      expect(recordKind(item, incomingVersions)).toBe(expected)
    },
  )

  it.each(derivationContractCases)("$name", ({ version, main, expected }) => {
    expect(deriveVersionRecord(version, main)).toEqual(expected)
  })

  it("returns nested copies that are independent from both stored records", () => {
    const version = {
      uri: "http://bartoc.org/en/node/99920",
      prefLabel: { en: "Stored version title" },
      versionOf: [{ uri: THE_SOZ_MAIN_URI }],
    }
    const main = {
      uri: THE_SOZ_MAIN_URI,
      definition: { en: ["Shared definition"] },
    }
    const originalVersion = structuredClone(version)
    const originalMain = structuredClone(main)

    const { effectiveItem } = deriveVersionRecord(version, main)
    effectiveItem.prefLabel.en = "Changed effective title"
    effectiveItem.definition.en.push("Changed effective definition")

    expect(version).toEqual(originalVersion)
    expect(main).toEqual(originalMain)
  })

  it.each([
    ["empty", []],
    ["external", [{ uri: "https://example.org/main" }]],
    ["multiple", [
      { uri: THE_SOZ_MAIN_URI },
      { uri: "http://bartoc.org/en/node/20827" },
    ]],
    ["self-referencing", [{ uri: "http://bartoc.org/en/node/99921" }]],
  ])("does not derive through an %s versionOf relation", (_, versionOf) => {
    const version = {
      uri: "http://bartoc.org/en/node/99921",
      prefLabel: { en: "Stored version" },
      versionOf,
    }
    const main = {
      uri: THE_SOZ_MAIN_URI,
      definition: { en: ["Must not be inherited"] },
    }

    expect(deriveVersionRecord(version, main)).toEqual({
      effectiveItem: version,
      derivedFields: {},
    })
    expect(recordKind(version)).toBe("standalone")
  })

  it("validates required kernel inputs", () => {
    expect(() => deriveVersionRecord(null, null)).toThrow(TypeError)
    expect(() => deriveVersionRecord({}, null, "definition")).toThrow(TypeError)
  })

  it("freezes fixtures shared by the table-driven kernel tests", () => {
    expect(Object.isFrozen(derivationContractCases)).toBe(true)
    expect(Object.isFrozen(derivationContractCases[0].version)).toBe(true)
    expect(Object.isFrozen(derivationContractCases[0].expected.effectiveItem)).toBe(true)
    expect(Object.isFrozen(meaningfulValueContractCases)).toBe(true)
    expect(Object.isFrozen(recordKindContractCases)).toBe(true)
  })
})
