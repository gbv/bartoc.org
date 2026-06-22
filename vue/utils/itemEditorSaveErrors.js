export class NewItemUriError extends Error {
  constructor() {
    super("Could not determine URI for new record.")
    this.status = "determining new URI"
  }
}

export class IdentifierCheckError extends Error {
  constructor() {
    super("Could not verify that identifiers are unique.")
    this.status = "checking identifiers"
  }
}
