import { Router } from 'express';
import { getHealthCtr, sendSwaggerDocCtr } from '../controllers/healthCheck/healthCheckCtr';

const healthCheck = Router();

healthCheck.get('/health', getHealthCtr);
healthCheck.use('/v3/api-docs', sendSwaggerDocCtr);

export { healthCheck };
