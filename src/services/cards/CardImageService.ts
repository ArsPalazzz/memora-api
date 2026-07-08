import cardRepository, { CardRepository } from '../../databases/postgre/entities/card/CardRepository';
import cardImageStorageService, {
  CardImageStorageService,
} from '../storage/CardImageStorageService';
import { getStoragePublicUrl } from '../../utils/storageUrl';
import { ForbiddenError, NotFoundError } from '../../exceptions';

export class CardImageService {
  constructor(
    private readonly cardRepository: CardRepository,
    private readonly cardImageStorage: CardImageStorageService
  ) {}

  async uploadCardImage(params: {
    cardSub: string;
    creatorSub: string;
    fileBuffer: Buffer;
  }): Promise<string> {
    const { cardSub, creatorSub, fileBuffer } = params;

    await this.assertCanEditCard(cardSub, creatorSub);

    const card = await this.cardRepository.getCardBySub(cardSub);
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    const storageKey = await this.cardImageStorage.upload(cardSub, fileBuffer);

    if (card.image_key) {
      await this.deleteStorageIfUnused(card.image_key, cardSub);
    }

    await this.cardRepository.updateImageKey(cardSub, storageKey);

    return getStoragePublicUrl(storageKey)!;
  }

  async deleteCardImage(params: { cardSub: string; creatorSub: string }): Promise<void> {
    const { cardSub, creatorSub } = params;

    await this.assertCanEditCard(cardSub, creatorSub);

    const card = await this.cardRepository.getCardBySub(cardSub);
    if (!card?.image_key) {
      return;
    }

    await this.deleteStorageIfUnused(card.image_key, cardSub);
    await this.cardRepository.updateImageKey(cardSub, null);
  }

  async deleteImageForCard(cardSub: string): Promise<void> {
    const card = await this.cardRepository.getCardBySub(cardSub);
    if (!card?.image_key) {
      return;
    }

    await this.deleteStorageIfUnused(card.image_key, cardSub);
  }

  private async assertCanEditCard(cardSub: string, creatorSub: string) {
    const exist = await this.cardRepository.existCardBySub({ sub: cardSub });
    if (!exist) {
      throw new NotFoundError('Card not found');
    }

    const haveAccess = await this.cardRepository.haveAccessToCard({
      user_sub: creatorSub,
      card_sub: cardSub,
    });

    if (!haveAccess) {
      throw new ForbiddenError('No access to edit this card');
    }
  }

  private async deleteStorageIfUnused(imageKey: string, excludeCardSub: string) {
    const usageCount = await this.cardRepository.countCardsWithImageKey(imageKey, excludeCardSub);

    if (usageCount === 0) {
      await this.cardImageStorage.delete(imageKey).catch(() => undefined);
    }
  }
}

export default new CardImageService(cardRepository, cardImageStorageService);
