// Format full timestamps in the user's locale and time zone. Date-only values
// stay unchanged because converting them to Date would add time precision.
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

export function formatTimestamp(value) {
  if (typeof value !== "string" || !value.includes("T")) {
    return value
  }

  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? value : dateTimeFormatter.format(date)
}
