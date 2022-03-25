if .subject then
  .subject |= map(
    if .inScheme[0].uri == "https://bartoc.org/ILC/1" then
      .inScheme = [ { uri: "http://www.iskoi.org/ilc/2/scheme" } ]
      | del(.notation)
    else
      .
    end
  )
else
 .
end
