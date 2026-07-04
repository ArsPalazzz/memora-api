import { v4 as uuidV4 } from 'uuid';
import importJobRepository, {
  ImportJobRepository,
} from '../../databases/postgre/entities/import/ImportJobRepository';
import cardRepository, { CardRepository } from '../../databases/postgre/entities/card/CardRepository';
import cardExampleRepository, {
  CardExampleRepository,
} from '../../databases/postgre/entities/card/CardExampleRepository';
import cardService, { CardService } from '../cards/CardService';
import { BadRequestError, NotFoundError } from '../../exceptions';
import {
  DeskImportStrategy,
  ImportDeskRequest,
  ImportJobPayload,
  ImportJobResult,
  ImportJobStatusResponse,
  ImportPreviewResult,
} from './ankiImport.types';
import {
  buildExistingLocationLabel,
  normalizeCardText,
  parseAnkiTagsToFolderPath,
} from './ankiImport.utils';
import logger from '../../logger';
import { LanguageCode } from '../cards/card.const';

const PROGRESS_UPDATE_EVERY = 10;

export class AnkiImportService {
  private readonly activeJobs = new Set<string>();

  constructor(
    private readonly importJobRepository: ImportJobRepository,
    private readonly cardRepository: CardRepository,
    private readonly cardExampleRepository: CardExampleRepository,
    private readonly cardService: CardService
  ) {}

  async preview(userSub: string, desks: ImportDeskRequest[]): Promise<ImportPreviewResult> {
    if (!desks.length) {
      throw new BadRequestError('No decks to preview');
    }

    const previewDesks = [];

    for (const desk of desks) {
      const folderPath = desk.folderPath.length
        ? desk.folderPath
        : parseAnkiTagsToFolderPath(desk.tags);

      const existingDeskSub = await this.findExistingDeskSub(userSub, desk.title, folderPath);
      let estimatedDuplicateCards = 0;
      let estimatedNewCards = desk.cards.length;

      if (existingDeskSub) {
        const existingCards = await this.cardRepository.getCardsWithExamplesByDesk(existingDeskSub);
        const existingFronts = new Set<string>();

        for (const card of existingCards) {
          for (const front of card.front_variants) {
            existingFronts.add(normalizeCardText(front));
          }
        }

        for (const card of desk.cards) {
          const isDuplicate = card.front.some((front) =>
            existingFronts.has(normalizeCardText(front))
          );
          if (isDuplicate) {
            estimatedDuplicateCards += 1;
          }
        }

        estimatedNewCards = desk.cards.length - estimatedDuplicateCards;
      }

      const exampleCount = desk.cards.reduce((sum, card) => sum + card.examples.length, 0);

      let existingLocationLabel: string | null = null;
      if (existingDeskSub) {
        const folderSub = await this.cardRepository.getDeskFolderSub(existingDeskSub);
        existingLocationLabel = folderSub
          ? buildExistingLocationLabel(await this.buildFolderPathLabels(userSub, folderSub))
          : 'Home';
      }

      previewDesks.push({
        clientId: desk.clientId,
        title: desk.title,
        tags: desk.tags,
        folderPath,
        fieldNames: desk.fieldNames,
        frontField: desk.frontField,
        backField: desk.backField,
        exampleFields: desk.exampleFields,
        cardCount: desk.cards.length,
        exampleCount,
        conflict: Boolean(existingDeskSub),
        existingDeskSub,
        existingLocationLabel,
        estimatedNewCards,
        estimatedDuplicateCards,
      });
    }

    return {
      desks: previewDesks,
      totalCards: previewDesks.reduce((sum, desk) => sum + desk.cardCount, 0),
    };
  }

  async createJob(userSub: string, payload: ImportJobPayload) {
    if (!payload.desks.length) {
      throw new BadRequestError('No decks to import');
    }

    const totalCards = payload.desks.reduce((sum, desk) => sum + desk.cards.length, 0);
    const sub = uuidV4();

    const job = await this.importJobRepository.create({
      sub,
      userSub,
      total: totalCards,
      payload,
    });

    if (!job) {
      throw new Error('Failed to create import job');
    }

    setImmediate(() => {
      void this.processJob(sub, userSub).catch((error) => {
        logger.error(`Import job ${sub} crashed`, error);
      });
    });

    return {
      sub: job.sub,
      status: job.status,
      progress: job.progress,
      total: job.total,
      createdAt: job.created_at,
    };
  }

  async getJobStatus(userSub: string, jobSub: string): Promise<ImportJobStatusResponse> {
    const job = await this.importJobRepository.getBySub({ sub: jobSub, userSub });
    if (!job) {
      throw new NotFoundError(`Import job ${jobSub} not found`);
    }

    return {
      sub: job.sub,
      status: job.status,
      progress: job.progress,
      total: job.total,
      result: job.result,
      errorMessage: job.error_message,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    };
  }

  private async processJob(jobSub: string, userSub: string) {
    if (this.activeJobs.has(jobSub)) return;
    this.activeJobs.add(jobSub);

    try {
      const job = await this.importJobRepository.getBySub({ sub: jobSub, userSub });
      if (!job) return;

      await this.importJobRepository.updateStatus({
        sub: jobSub,
        userSub,
        status: 'processing',
        progress: 0,
        total: job.total,
        result: null,
        errorMessage: null,
      });

      const result = await this.executeImport(userSub, job.payload, async (progress) => {
        await this.importJobRepository.updateProgress({
          sub: jobSub,
          userSub,
          progress,
        });
      });

      await this.importJobRepository.updateStatus({
        sub: jobSub,
        userSub,
        status: 'completed',
        progress: job.total,
        total: job.total,
        result,
        errorMessage: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed';
      logger.error(`Import job ${jobSub} failed`, error);

      await this.importJobRepository.updateStatus({
        sub: jobSub,
        userSub,
        status: 'failed',
        progress: 0,
        total: 0,
        result: null,
        errorMessage: message,
      });
    } finally {
      this.activeJobs.delete(jobSub);
    }
  }

  private async executeImport(
    userSub: string,
    payload: ImportJobPayload,
    onProgress: (progress: number) => Promise<void>
  ): Promise<ImportJobResult> {
    const folderCache = new Map<string, string>();
    const deskResults = [];
    let progress = 0;

    const summary = {
      desksCreated: 0,
      desksMerged: 0,
      desksSkipped: 0,
      cardsAdded: 0,
      cardsSkipped: 0,
      examplesAdded: 0,
    };

    for (const deskPayload of payload.desks) {
      const deskResult = await this.importDesk(userSub, deskPayload, payload, folderCache);
      deskResults.push(deskResult);

      if (deskResult.skipped) {
        summary.desksSkipped += 1;
      } else if (deskResult.created) {
        summary.desksCreated += 1;
      } else {
        summary.desksMerged += 1;
      }

      summary.cardsAdded += deskResult.cardsAdded;
      summary.cardsSkipped += deskResult.cardsSkipped;
      summary.examplesAdded += deskResult.examplesAdded;

      progress += deskPayload.cards.length;
      if (progress % PROGRESS_UPDATE_EVERY === 0) {
        await onProgress(progress);
      }
    }

    await onProgress(progress);

    return { desks: deskResults, summary };
  }

  private async importDesk(
    userSub: string,
    deskPayload: ImportDeskRequest,
    payload: ImportJobPayload,
    folderCache: Map<string, string>
  ) {
    const strategy = deskPayload.strategy ?? payload.defaultStrategy;
    const folderPath = deskPayload.folderPath.length
      ? deskPayload.folderPath
      : parseAnkiTagsToFolderPath(deskPayload.tags);

    const existingDeskSub = await this.findExistingDeskSub(userSub, deskPayload.title, folderPath);

    if (strategy === 'skip' && existingDeskSub) {
      return {
        clientId: deskPayload.clientId,
        title: deskPayload.title,
        deskSub: existingDeskSub,
        strategy,
        created: false,
        skipped: true,
        cardsAdded: 0,
        cardsSkipped: deskPayload.cards.length,
        examplesAdded: 0,
      };
    }

    let deskSub = existingDeskSub;
    let created = false;
    const deskTitle =
      strategy === 'rename'
        ? deskPayload.renameTitle?.trim() ||
          `${deskPayload.title} (import ${new Date().toISOString().slice(0, 10)})`
        : deskPayload.title;

    if (!deskSub || strategy === 'rename') {
      deskSub = await this.createDeskInFolder(userSub, deskTitle, folderPath, folderCache, payload.languageSettings);
      created = true;
    } else if (strategy === 'replace') {
      await this.cardRepository.deleteCardsByDeskSub(deskSub);
    }

    const existingByFront = new Map<string, { sub: string; examples: string[] }>();

    if (strategy === 'merge' && deskSub && !created) {
      const existingCards = await this.cardRepository.getCardsWithExamplesByDesk(deskSub);
      for (const card of existingCards) {
        for (const front of card.front_variants) {
          existingByFront.set(normalizeCardText(front), {
            sub: card.sub,
            examples: card.examples ?? [],
          });
        }
      }
    }

    let cardsAdded = 0;
    let cardsSkipped = 0;
    let examplesAdded = 0;

    for (const card of deskPayload.cards) {
      const normalizedFronts = card.front.map(normalizeCardText).filter(Boolean);
      const duplicateKey = normalizedFronts.find((front) => existingByFront.has(front));

      if (duplicateKey && strategy === 'merge') {
        const existing = existingByFront.get(duplicateKey)!;
        const newExamples = card.examples.filter(
          (example) => !existing.examples.some((item) => normalizeCardText(item) === normalizeCardText(example))
        );

        if (newExamples.length && existing.examples.length === 0) {
          await this.cardExampleRepository.createMany({
            cardSub: existing.sub,
            sentences: newExamples,
          });
          examplesAdded += newExamples.length;
          existing.examples.push(...newExamples);
        }

        cardsSkipped += 1;
        continue;
      }

      if (duplicateKey && strategy !== 'replace') {
        cardsSkipped += 1;
        continue;
      }

      const cardSub = uuidV4();
      await this.cardRepository.createCard({
        sub: cardSub,
        desk_sub: deskSub!,
        front: card.front,
        back: card.back,
      });

      if (card.examples.length) {
        await this.cardExampleRepository.createMany({
          cardSub,
          sentences: card.examples,
        });
        examplesAdded += card.examples.length;
      }

      for (const front of card.front) {
        existingByFront.set(normalizeCardText(front), { sub: cardSub, examples: card.examples });
      }

      cardsAdded += 1;
    }

    return {
      clientId: deskPayload.clientId,
      title: deskTitle,
      deskSub,
      strategy,
      created,
      skipped: false,
      cardsAdded,
      cardsSkipped,
      examplesAdded,
    };
  }

  private async createDeskInFolder(
    userSub: string,
    title: string,
    folderPath: string[],
    folderCache: Map<string, string>,
    languageSettings: {
      front_language: LanguageCode;
      back_language: LanguageCode;
      example_language: LanguageCode;
    }
  ) {
    const folderSub = await this.resolveFolderPath(userSub, folderPath, folderCache);
    const deskSub = uuidV4();

    await this.cardService.createDesk({
      sub: deskSub,
      title,
      description: folderPath.length ? `Imported from Anki (${folderPath.join(' › ')})` : 'Imported from Anki',
      public: false,
      creatorSub: userSub,
      folderSub,
      frontLanguage: languageSettings.front_language,
      backLanguage: languageSettings.back_language,
      exampleLanguage: languageSettings.example_language,
    });

    return deskSub;
  }

  private async resolveFolderPath(
    userSub: string,
    folderPath: string[],
    folderCache: Map<string, string>
  ): Promise<string | null> {
    if (!folderPath.length) return null;

    let parentSub: string | null = null;

    for (const segment of folderPath) {
      const cacheKey = `${parentSub ?? 'root'}::${segment}`;
      const cached = folderCache.get(cacheKey);
      if (cached) {
        parentSub = cached;
        continue;
      }

      const folders = await this.cardRepository.getAllFoldersFlat(userSub);
      const existing = folders.find(
        (folder) => folder.title === segment && folder.parentFolderSub === parentSub
      );

      if (existing) {
        folderCache.set(cacheKey, existing.sub);
        parentSub = existing.sub;
        continue;
      }

      const created = await this.cardService.createFolder({
        title: segment,
        description: `Imported from Anki`,
        parentFolderSub: parentSub,
        creatorSub: userSub,
      });

      folderCache.set(cacheKey, created.sub);
      parentSub = created.sub;
    }

    return parentSub;
  }

  private async findExistingDeskSub(
    userSub: string,
    title: string,
    folderPath: string[]
  ): Promise<string | null> {
    if (!folderPath.length) {
      return this.cardRepository.getDeskSubByTitleAtRoot({ title, creatorSub: userSub });
    }

    const folderCache = new Map<string, string>();
    const folderSub = await this.resolveFolderPath(userSub, folderPath, folderCache);
    if (!folderSub) return null;

    return this.cardRepository.getDeskSubByTitleInFolder({
      title,
      folderSub,
      creatorSub: userSub,
    });
  }

  private async buildFolderPathLabels(userSub: string, folderSub: string): Promise<string[]> {
    const folders = await this.cardRepository.getAllFoldersFlat(userSub);
    const bySub = new Map(folders.map((folder) => [folder.sub, folder]));
    const labels: string[] = [];
    let current: string | null = folderSub;

    while (current) {
      const folder = bySub.get(current);
      if (!folder) break;
      labels.unshift(folder.title);
      current = folder.parentFolderSub;
    }

    return labels;
  }
}

export default new AnkiImportService(
  importJobRepository,
  cardRepository,
  cardExampleRepository,
  cardService
);
