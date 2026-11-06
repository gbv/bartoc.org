// Shared OpenAPI description for the quality API and its documentation page.
export const qualityOpenApi = {
  openapi: "3.1.0",
  info: {
    title: "BARTOC Quality API",
    version: "1.0.0",
    description: "Read-only access to asynchronously generated BARTOC quality reports.",
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
          schema: { type: "string", pattern: "^id:.+$" },
          example: "id:http://bartoc.org/en/node/14",
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
