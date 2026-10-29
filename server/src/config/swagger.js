const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

/**
 * Loads the OpenAPI (Swagger) specification from server/docs/openapi.yaml
 * and returns the swagger-ui-express middleware pair.
 */
function buildSwagger() {
  const spec = YAML.load(path.join(__dirname, '..', '..', 'docs', 'openapi.yaml'));
  return {
    middleware: swaggerUi.serve,
    setup: swaggerUi.setup(spec, {
      customSiteTitle: 'Smart Library API Docs',
      explorer: true,
    }),
    spec,
  };
}

module.exports = buildSwagger;
