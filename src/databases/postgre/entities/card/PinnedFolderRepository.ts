import Table from '../Table';
import { Query } from '../../index';
import {
  COUNT_PINNED_FOLDERS,
  DELETE_PINNED_FOLDER,
  EXIST_PINNED_FOLDER,
  GET_PINNED_FOLDERS,
  INSERT_PINNED_FOLDER,
} from './PinnedFolderRepositoryQueries';

export class PinnedFolderRepository extends Table {
  async listByUserSub(userSub: string) {
    const query: Query = {
      name: 'getPinnedFolders',
      text: GET_PINNED_FOLDERS,
      values: [userSub],
    };

    return this.getItems<{ folder_sub: string; title: string; created_at: Date }>(query);
  }

  async countByUserSub(userSub: string) {
    const query: Query = {
      name: 'countPinnedFolders',
      text: COUNT_PINNED_FOLDERS,
      values: [userSub],
    };

    const row = await this.getItem<{ count: number }>(query);
    return row?.count ?? 0;
  }

  async exists(userSub: string, folderSub: string) {
    const query: Query = {
      name: 'existPinnedFolder',
      text: EXIST_PINNED_FOLDER,
      values: [userSub, folderSub],
    };

    return this.exists(query);
  }

  async pin(userSub: string, folderSub: string) {
    const query: Query = {
      name: 'insertPinnedFolder',
      text: INSERT_PINNED_FOLDER,
      values: [userSub, folderSub],
    };

    return this.insertItem(query);
  }

  async unpin(userSub: string, folderSub: string) {
    const query: Query = {
      name: 'deletePinnedFolder',
      text: DELETE_PINNED_FOLDER,
      values: [userSub, folderSub],
    };

    return this.updateItems(query);
  }
}

export default new PinnedFolderRepository();
