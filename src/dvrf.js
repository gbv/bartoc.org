/**
 * An error report in Data Validation Report Format (DVRF).
 */
export class ErrorReport {
  constructor(fields = {}) {
    Object.assign(this, fields)
    this.totalFindings = 0
    this.totalErrors = 0
    this.totalCompliances = 0
    this._started = new Date()
  }

  /**
   * validator must return array of errors or true (violated) or false (ok).
   * context can have position, message, types, level.
   */
  checkFinding(finding, validator, context={}) {
    this.totalFindings++
    if (validator) {
      try {
        let violation = validator(finding)
        if (Array.isArray(violation) && violation.length) {
          if (this.errors) {
            this.errors.push({ ...context, errors: violation })
          }
          this.totalErrors++
        } else if (violation === true) {
          if (this.errors) {
            this.errors.push({ ...context })
          }
          this.totalErrors++
        } else {
          this.totalCompliances++
        }
        return
      } catch (error) {
        if (this.partial) {
          this.partial.push({ message: error.message })
        }
      }
    }

    // finding could not be validated
    if (this.skipped && context.position) {
      this.skipped.push(context.position)
    } else {
      this.totalSkipped = this.totalSkipped ?? 0 + 1
    }
  }

  // Add duration and fields that can be calculated from other fields
  finish() {
    if (this._started) {
      const now = new Date()
      this.duration = (now.getTime() - this._started.getTime()) / 1000
      this.created = now.toISOString()

      for (let field of ["errors", "skipped", "compliances"]) {
        const values = this[field]
        const total = `total${field[0].toUpperCase()}${field.slice(1)}`
        if (values && values[values.length-1] !== null) {
          this[total] = values.length
        }
      }

      delete this._started
    }

    return this
  }
}
