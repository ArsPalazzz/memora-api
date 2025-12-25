import fs from 'fs';
import yaml from 'js-yaml';

import { JsonObject } from 'swagger-ui-express';

import { port } from '../../config';

const swaggerDocument: JsonObject = yaml.load(
  fs.readFileSync(`${__dirname}/swagger.yaml`, 'utf8')
) as JsonObject;

if (swaggerDocument && swaggerDocument.servers.length) {
  swaggerDocument.servers[0].url = `http://localhost:${port}`;
}

export default swaggerDocument;
