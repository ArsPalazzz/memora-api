import { NextFunction, Request, Response } from 'express';
import Postgres from '../../../databases/postgre';
import swaggerDocument from '../../swagger';

export async function getHealthCtr(req: Request, res: Response, next: NextFunction) {
  try {
    await Postgres.query({ name: 'Ping', text: 'SELECT 1', values: [] });
    res.json({
      status: 'OK',
      postgres: 'connected',
      redis: 'connected',
    });
  } catch (e) {
    next(e);
  }
}

export async function sendSwaggerDocCtr(req: Request, res: Response, next: NextFunction) {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocument);
}
