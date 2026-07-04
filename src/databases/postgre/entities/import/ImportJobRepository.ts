import Table from '../Table';
import { Query } from '../../index';
import {
  GET_IMPORT_JOB_BY_SUB,
  INSERT_IMPORT_JOB,
  UPDATE_IMPORT_JOB_PROGRESS,
  UPDATE_IMPORT_JOB_STATUS,
} from './ImportJobRepositoryQueries';
import { ImportJobPayload, ImportJobResult, ImportJobStatus } from '../../../../services/import/ankiImport.types';

export interface ImportJobRow {
  sub: string;
  user_sub: string;
  status: ImportJobStatus;
  progress: number;
  total: number;
  payload: ImportJobPayload;
  result: ImportJobResult | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export class ImportJobRepository extends Table {
  async create(params: {
    sub: string;
    userSub: string;
    total: number;
    payload: ImportJobPayload;
  }) {
    const query: Query = {
      name: 'insertImportJob',
      text: INSERT_IMPORT_JOB,
      values: [params.sub, params.userSub, params.total, JSON.stringify(params.payload)],
    };

    return this.getItem<{
      sub: string;
      status: ImportJobStatus;
      progress: number;
      total: number;
      created_at: string;
    }>(query);
  }

  async getBySub(params: { sub: string; userSub: string }) {
    const query: Query = {
      name: 'getImportJobBySub',
      text: GET_IMPORT_JOB_BY_SUB,
      values: [params.sub, params.userSub],
    };

    return this.getItem<ImportJobRow>(query);
  }

  async updateStatus(params: {
    sub: string;
    userSub: string;
    status: ImportJobStatus;
    progress: number;
    total: number;
    result?: ImportJobResult | null;
    errorMessage?: string | null;
  }) {
    const query: Query = {
      name: 'updateImportJobStatus',
      text: UPDATE_IMPORT_JOB_STATUS,
      values: [
        params.sub,
        params.userSub,
        params.status,
        params.progress,
        params.total,
        params.result ? JSON.stringify(params.result) : null,
        params.errorMessage ?? null,
      ],
    };

    return this.updateItems(query);
  }

  async updateProgress(params: { sub: string; userSub: string; progress: number }) {
    const query: Query = {
      name: 'updateImportJobProgress',
      text: UPDATE_IMPORT_JOB_PROGRESS,
      values: [params.sub, params.userSub, params.progress],
    };

    return this.updateItems(query);
  }
}

export default new ImportJobRepository();
