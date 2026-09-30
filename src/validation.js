import { normalizeUri } from "./uri.js"
import { hasMeaningfulValue, hasValidVersionOf, versionNumber } from "./editions.js"

/**
 * Return errors from the current editor rules in DVRF format.
 * This does not check every field type in a record.
 */
export function validateItem(item = {}) {
  const errors = []
  const validVersionOf = hasValidVersionOf(item)
  // A title may come from the main record only when the edition has a version number.
  const canDeriveTitle = versionNumber(item) && validVersionOf

  if (!hasMeaningfulValue(item?.prefLabel) && !canDeriveTitle) {
    errors.push({
      message: "item must have at least a title!",
      position: { jsonpointer: "/prefLabel" },
    })
  }

  // A record must not link to itself as an edition or a derived work.
  if (hasSelfReference(item, "versionOf")) {
    errors.push({
      message: "A vocabulary cannot be an edition of itself.",
      position: { jsonpointer: "/versionOf" },
    })
  }

  if (hasSelfReference(item, "basedOn")) {
    errors.push({
      message: "A vocabulary cannot be based on itself.",
      position: { jsonpointer: "/basedOn" },
    })
  }

  // A valid versionOf link lets an edition inherit the English abstract.
  const hasEnglishAbstract = item.definition?.en?.some(text => text?.trim())
  if (!hasEnglishAbstract && !validVersionOf) {
    errors.push({
      message: "Please provide at least one English abstract.",
      position: { jsonpointer: "/definition/en" },
    })
  }

  // Ignore empty URL fields, but check each URL that was entered.
  item.API?.forEach((endpoint, index) => {
    const url = endpoint?.url
    if (url == null || (typeof url === "string" && !url.trim())) {
      return
    }
    if (typeof url !== "string" || !isValidUrl(url)) {
      errors.push({
        message: "Enter a complete URL starting with http:// or https://.",
        position: { jsonpointer: `/API/${index}/url` },
      })
    }
  })

  // A filled thumbnail must have the expected manifest shape and a valid URL.
  item.media?.forEach((media, index) => {
    const thumbnail = mediaThumbnailUrl(media)
    if (thumbnail == null || (typeof thumbnail === "string" && !thumbnail.trim())) {
      return
    }
    const invalid = media?.type !== "Manifest"
      || !Array.isArray(media.items)
      || !Array.isArray(media.thumbnail)
      || media.thumbnail[0]?.type !== "Image"
      || typeof thumbnail !== "string"
      || !isValidUrl(thumbnail)
    if (invalid) {
      errors.push({
        message: "Enter a complete media URL starting with http:// or https://.",
        position: { jsonpointer: `/media/${index}/thumbnail` },
      })
    }
  })

  // The Editor checks the first publisher in the stored list.
  if (item.publisher?.length) {
    const publisherError = validatePublisher(item.publisher[0])
    if (publisherError) {
      errors.push({
        ...publisherError,
        position: { jsonpointer: "/publisher/0" },
      })
    }
  }

  return errors
}

/** Accept complete HTTP(S) URLs without a final dot in the host name. */
export function isValidUrl(value) {
  try {
    const url = new URL(value)
    return (url.protocol === "http:" || url.protocol === "https:") && !url.hostname.endsWith(".")
  } catch {
    return false
  }
}

/** Read a thumbnail URL from the current array shape or an older string value. */
export function mediaThumbnailUrl(media) {
  if (typeof media?.thumbnail === "string") {
    return media.thumbnail
  }
  return media?.thumbnail?.[0]?.id
}

/** Return the first missing or invalid publisher field. */
export function validatePublisher(publisher = {}) {
  if (!publisher.prefLabel?.en?.trim()) {
    return { message: "Publisher name is required!" }
  }
  if (!publisher.uri) {
    return { message: "Publisher URI is required!" }
  }
  if (!isValidUrl(publisher.uri)) {
    return { message: "Publisher URI must be a valid HTTP(S) URL!" }
  }
}

// Compare trimmed URIs so surrounding spaces do not hide a self-link.
function hasSelfReference(item, field) {
  const uri = normalizeUri(item?.uri)
  return Boolean(
    uri &&
    Array.isArray(item?.[field]) &&
    item[field].some(reference => normalizeUri(reference?.uri) === uri),
  )
}
