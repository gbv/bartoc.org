// Shared OpenAPI description for the quality API and its documentation page.
export const qualityOpenApi = {
  openapi: "3.1.0",
  info: {
    title: "BARTOC Quality API",
    version: "1.0.0",
    description: "Experimental read-only access to asynchronously generated BARTOC quality reports.",
  },
  servers: [{ url: "/quality" }],
  paths: {
    "/openapi.json": {
      get: {
        summary: "Return the API specification",
        responses: { 200: { description: "OpenAPI description" } },
      },
    },
    "/reports": {
      get: {
        summary: "List available quality reports",
        responses: {
          200: {
            description: "Report metadata indexed by report identifier",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  additionalProperties: { $ref: "#/components/schemas/ReportSummary" },
                },
              },
            },
          },
        },
      },
    },
    "/reports/{id}.json": {
      get: {
        summary: "Return one complete quality report",
        parameters: [{
          name: "id",
          in: "path",
          required: true,
          description: "Report identifier returned by /reports.",
          schema: { type: "string" },
        }],
        responses: {
          200: { description: "Complete DVRF report" },
          404: { description: "Report not found" },
        },
      },
    },
    "/errors": {
      get: {
        summary: "Find quality findings for a BARTOC record",
        parameters: [{
          name: "position",
          in: "query",
          required: true,
          description: "DVRF position in the form id:<URI>.",
          schema: { type: "string", pattern: "^id:.+$" },
          example: "id:http://bartoc.org/en/node/14",
          "x-displayValue": "id:<BARTOC_URI>",
        }],
        responses: {
          200: { description: "Matching DVRF findings" },
          400: { description: "Invalid position parameter" },
        },
      },
    },
    "/stats": {
      get: {
        summary: "Return aggregate quality statistics",
        responses: {
          200: {
            description: "Quality counts and report freshness",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/QualityStats" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ReportSummary: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          types: { type: "array", items: { type: "string" } },
          level: { type: "string" },
          totalErrors: { type: "integer" },
          created: { type: "string", format: "date-time" },
          formats: { type: "array", items: { type: "string" } },
        },
      },
      QualityStats: {
        type: "object",
        required: ["reports", "recordsWithFindings", "findings", "created"],
        properties: {
          reports: { type: "integer" },
          recordsWithFindings: { type: "integer" },
          findings: { type: "integer" },
          created: { type: "string", format: "date-time" },
        },
      },
    },
  },
}

// Escape OpenAPI text before inserting it into the HTML documentation.
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/[<>&"']/g, character => `&#${character.charCodeAt(0)};`)
}

// Render one OpenAPI parameter with its location and requirement.
function renderParameter(parameter) {
  return `<li><code>${escapeHtml(parameter.name)}</code> (${escapeHtml(parameter.in)}, ${parameter.required ? "required" : "optional"}) — ${escapeHtml(parameter.description)}</li>`
}

// Render the human-readable endpoint list from the shared OpenAPI description.
export function renderQualityApiPage(api = qualityOpenApi) {
  const baseUrl = api.servers[0].url.replace(/\/$/, "")
  const endpoints = Object.entries(api.paths).flatMap(([path, operations]) =>
    Object.entries(operations).map(([method, operation]) => {
      const url = `${baseUrl}${path}`
      const parameters = operation.parameters || []
      const queryParameters = parameters.filter(parameter => parameter.in === "query")
      const exampleQuery = new URLSearchParams(queryParameters
        .filter(parameter => parameter.example)
        .map(parameter => [parameter.name, parameter.example]))
      const queryPattern = queryParameters.map(parameter =>
        `${parameter.name}=${parameter["x-displayValue"] || parameter.example || `<${parameter.name}>`}`,
      ).join("&")
      const hasPathParameters = parameters.some(parameter => parameter.in === "path")
      const hasMissingExample = parameters.some(parameter =>
        parameter.required && parameter.in === "query" && !parameter.example)
      const href = hasPathParameters || hasMissingExample
        ? null
        : `${url}${exampleQuery.size ? `?${exampleQuery}` : ""}`
      const pathHtml = href
        ? `<a href="${escapeHtml(href)}"><code>${escapeHtml(url)}</code></a>`
        : `<code>${escapeHtml(url)}</code>`
      const queryHtml = queryPattern ? `<code>?${escapeHtml(queryPattern)}</code>` : ""
      const parameterHtml = parameters.length
        ? `<ul class="quality-api__parameters">${parameters.map(renderParameter).join("")}</ul>`
        : ""
      return `<li class="quality-api__endpoint">
        <div class="quality-api__endpoint-line">
          <strong class="quality-api__method">${escapeHtml(method.toUpperCase())}</strong>
          <span>${pathHtml}${queryHtml}</span>
          <span>${escapeHtml(operation.summary)}</span>
        </div>
        ${parameterHtml}
      </li>`
    }),
  ).join("\n")

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="shortcut icon" href="/img/bartoc-icon.png" type="image/png">
    <link rel="stylesheet" href="/vendor/bartoc-components/style.css">
    <link rel="stylesheet" href="/css/base.css">
    <link rel="stylesheet" href="/css/quality-api.css">
    <title>${escapeHtml(api.info.title)}</title>
  </head>
  <body>
    <main class="quality-api">
      <h1>${escapeHtml(api.info.title)}</h1>
      <p class="quality-api__description">${escapeHtml(api.info.description)}</p>
      <p>Reports are generated asynchronously. This API does not validate records on request.</p>
      <h2>Available Endpoints</h2>
      <ul class="quality-api__endpoints">
        ${endpoints}
      </ul>
    </main>
  </body>
</html>`
}
