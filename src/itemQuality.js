import { qualityChecks } from "./quality.js"
import { validateItem } from "./validation.js"

// Editor validation is grouped into one public report code. Unlike the named
// quality checks, its individual messages are produced by validateItem.
const validationRule = {
  id: "validation-errors",
  title: "Validation errors",
  description: "BARTOC records not passing mandatory integrity and quality constraints",
  level: "error",
}

// Keep report titles and descriptions tied to their public codes. This also
// lets reported findings use local metadata when they no longer fail live.
const rules = new Map([
  ...qualityChecks.map(rule => [rule.id, rule]),
  [validationRule.id, validationRule],
])

// Convert one public code to the UI finding shape. Unknown report codes remain
// visible by using the code itself as their title.
function createFinding(code) {
  const rule = rules.get(code)
  return {
    code,
    title: rule?.title || code,
    description: rule?.description,
    jsonpointer: rule?.jsonpointer,
    level: rule?.level || (rule ? "warning" : undefined),
    // Findings produced by the current checks are issues until merging with
    // the daily snapshot proves that they are historical only.
    status: "issue",
  }
}

// Run the same checks used to generate reports against the current item. The
// named quality rules are warnings; editor validation is one error entry with
// its current messages attached.
export function getLiveItemFindings(item = {}) {
  const findings = qualityChecks
    .filter(rule => rule.fails(item))
    .map(rule => createFinding(rule.id))
  const validationErrors = validateItem(item)

  if (validationErrors.length) {
    findings.push({
      ...createFinding(validationRule.id),
      messages: validationErrors.map(error => error.message).filter(Boolean),
    })
  }

  return findings
}

// Merge snapshot errors and live findings by their stable public code. The
// Quality API returns each reported error directly and type[0] is its code.
export function mergeItemFindings(reportedErrors = [], liveFindings = []) {
  const reportedCodes = reportedErrors.map(error => error?.type?.[0]).filter(Boolean)
  const liveByCode = new Map(liveFindings.map(finding => [finding.code, finding]))
  const codes = new Set([...reportedCodes, ...liveByCode.keys()])

  return [...codes].map(code => {
    const live = liveByCode.get(code)
    return {
      ...(live || createFinding(code)),
      // Only a known live rule can confirm that a reported problem is fixed.
      status: live || !rules.has(code) ? "issue" : "fixed",
    }
  })
}
