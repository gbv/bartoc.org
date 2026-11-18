import fields from "../../data/fields.json"

export function fieldHelp(field, language = "en") {
  return fields[field]?.[language] || ""
}
