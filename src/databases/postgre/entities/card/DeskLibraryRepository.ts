import Table, { PgTransaction } from '../Table';
import { Query } from '../../index';
import {
  EXISTS_LIBRARY_ENTRY_BY_USER_AND_SOURCE,
  GET_LIBRARY_SOURCES_BY_USER,
  INSERT_LIBRARY_ENTRY,
} from './DeskLibraryRepositoryQueries';

export class DeskLibraryRepository extends Table {
  async existsByUserAndSource(userSub: string, sourceDeskSub: string): Promise<boolean> {
    const query: Query = {
      name: 'existsLibraryEntryByUserAndSource',
      text: EXISTS_LIBRARY_ENTRY_BY_USER_AND_SOURCE,
      values: [userSub, sourceDeskSub],
    };

    return this.exists(query);
  }

  async insertInTx(
    tx: PgTransaction,
    params: {
      sub: string;
      userSub: string;
      sourceDeskSub: string;
      localDeskSub: string;
      sourceCreatorSub: string;
      mode?: string;
    }
  ): Promise<void> {
    await tx.query({
      name: 'insertLibraryEntry',
      text: INSERT_LIBRARY_ENTRY,
      values: [
        params.sub,
        params.userSub,
        params.sourceDeskSub,
        params.localDeskSub,
        params.sourceCreatorSub,
        params.mode ?? 'snapshot',
      ],
    });
  }

  async getSourcesByUserSub(userSub: string) {
    const query: Query = {
      name: 'getLibrarySourcesByUser',
      text: GET_LIBRARY_SOURCES_BY_USER,
      values: [userSub],
    };

    return this.getItems<{
      sub: string;
      source_desk_sub: string;
      local_desk_sub: string;
      source_creator_sub: string;
      mode: string;
      created_at: string;
      source_desk_title: string;
      local_desk_title: string;
      source_creator_nickname: string;
    }>(query);
  }
}

export default new DeskLibraryRepository();
