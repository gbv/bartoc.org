module.exports = {
  // TODO: move utility function to jskos-tools
  label(labels, language) {
    var value = "???"
    var code = language || "en"
    if (code in labels) {
      value = labels[code]
    } else {
      for (code in labels) {
        value = labels[code]
        break
      }
    }
    return { value, code }
  }
}
