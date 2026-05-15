import { trimItemIdentifiers as defaultTrimItemIdentifiers } from "../utils.js"
import { cleanupItem as defaultCleanupItem, githubIssueUrl } from "./itemEditor.js"

const API_URL = "/api/voc"
const NEW_ITEM_URI_URL = "/api/voc?sort=counter&order=desc&limit=1"
const BARTOC_URI_BASE = "http://bartoc.org/en/node/"

export class NewItemUriError extends Error {
  constructor() {
    super("Could not determine URI for new record.")
    this.status = "determining new URI"
  }
}

async function nextItemUri(fetchImpl) {
  const latestRecord = (
    await fetchImpl(NEW_ITEM_URI_URL).then((res) => res.json())
  )[0]
  const latestId = parseInt(latestRecord.uri.replace(BARTOC_URI_BASE, ""))
  return BARTOC_URI_BASE + (latestId + 1)
}

export async function prepareItemForSave({
  item,
  fetchImpl = fetch,
  cleanupItem = defaultCleanupItem,
  trimItemIdentifiers = defaultTrimItemIdentifiers,
}) {
  const itemToSave = { ...item }
  const method = itemToSave.uri ? "PUT" : "POST"

  if (!itemToSave.uri) {
    try {
      itemToSave.uri = await nextItemUri(fetchImpl)
    } catch {
      throw new NewItemUriError()
    }
  }

  const cleanedItem = cleanupItem(itemToSave)
  trimItemIdentifiers(cleanedItem)

  return {
    item: itemToSave,
    method,
    body: JSON.stringify(cleanedItem, null, 2),
  }
}

export function buildSaveError({
  error,
  response,
  body,
  hasAuth,
}) {
  const message = error.message || response.StatusText || response.statusText
  const issue =
    "This JSKOS record could not be saved:\n\n~~~json\n" +
    body +
    "\n~~~\n" +
    "The request included " +
    (hasAuth ? "a token for authentification." : "no token.")
  const url = githubIssueUrl(`Error ${response.status} when saving`, issue)
  const html = `If you think this is a bug, please
                  <a href='${url}'>open a GitHub issue</a> including the current JSKOS record!`

  return {
    message,
    status: response.status,
    html,
  }
}

export async function saveVocabularyItem({
  item,
  auth,
  fetchImpl = fetch,
  cleanupItem = defaultCleanupItem,
  trimItemIdentifiers = defaultTrimItemIdentifiers,
}) {
  let prepared

  try {
    prepared = await prepareItemForSave({
      item,
      fetchImpl,
      cleanupItem,
      trimItemIdentifiers,
    })
  } catch (error) {
    if (!(error instanceof NewItemUriError)) {
      throw error
    }

    return {
      ok: false,
      error: buildSaveError({
        error,
        response: { status: error.status },
        body: undefined,
        hasAuth: Boolean(auth),
      }),
    }
  }

  const headers = { "Content-Type": "application/json" }
  if (auth) {
    headers.Authorization = `Bearer ${auth.token}`
  }

  const response = await fetchImpl(API_URL, {
    method: prepared.method,
    body: prepared.body,
    headers,
  })

  if (response.ok) {
    return {
      ok: true,
      ...prepared,
      response,
    }
  }

  let responseError = {}
  try {
    responseError = await response.json()
  } catch {
    responseError = {}
  }

  return {
    ok: false,
    ...prepared,
    response,
    error: buildSaveError({
      error: responseError,
      response,
      body: prepared.body,
      hasAuth: Boolean(auth),
    }),
  }
}
