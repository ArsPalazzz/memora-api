import cardRepository, {
  CardRepository,
} from '../../databases/postgre/entities/card/CardRepository';
import deskSettingsRepository, {
  DeskSettingsRepository,
} from '../../databases/postgre/entities/card/DeskSettingsRepository';
import userCardSrsRepository, {
  UserCardSrsRepository,
} from '../../databases/postgre/entities/card/UserCardSrsRepository';
import { PgTransaction } from '../../databases/postgre/entities/Table';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../exceptions';
import { CARD_ORIENTATION, CARDS_PER_SESSION_LIMIT } from './card.const';
import { GetDeskPayload } from './card.interfaces';
import { v4 as uuidV4 } from 'uuid';
import { GoogleGenAI } from '@google/genai';
import cardExampleRepository, {
  CardExampleRepository,
} from '../../databases/postgre/entities/card/CardExampleRepository';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class CardService {
  constructor(
    private readonly cardRepository: CardRepository,
    private readonly cardExampleRepository: CardExampleRepository,
    private readonly deskSettingsRepository: DeskSettingsRepository,
    private readonly userCardSrsRepository: UserCardSrsRepository
  ) {}

  async getAllCards(): Promise<any> {
    return await this.cardRepository.getCards();
  }

  async getDeskSettings(deskSub: string) {
    return await this.deskSettingsRepository.getByDeskSub(deskSub);
  }

  async updateLastTimePlayedDesk(deskSub: string, tx: PgTransaction) {
    await this.cardRepository.updateLastTimePlayedDesk(deskSub, tx);
  }

  async getUserDesks(userSub: string): Promise<any> {
    return await this.cardRepository.getDesksByCreatorSub(userSub);
  }

  async getDesk(payload: GetDeskPayload): Promise<any> {
    const { desk_sub, sub } = payload;
    const exist = await this.cardRepository.existDesk({ sub: desk_sub });
    if (!exist) {
      throw new NotFoundError(`CardService: desk with sub = ${desk_sub} not found`);
    }

    const haveAccess = await this.cardRepository.haveAccessToDesk({ desk_sub, user_sub: sub });
    if (!haveAccess) {
      throw new ForbiddenError(
        `CardService: user with sub = ${sub} doesn't have access to desk with id = ${desk_sub}`
      );
    }

    return await this.cardRepository.getDeskDetails({ deskSub: desk_sub, userSub: sub });
  }

  async createCard(payload: { front: string[]; back: string[]; desk_sub: string }) {
    const deskExist = await this.cardRepository.existDesk({ sub: payload.desk_sub });
    if (!deskExist) {
      throw new NotFoundError(`CardService: desk with sub = ${payload.desk_sub} not found`);
    }

    const sub = uuidV4();
    const cardSub = await this.cardRepository.createCard({ sub, ...payload });
    if (!cardSub) throw new Error(`Card not created`);

    await this.generateExamples(cardSub, payload.front, payload.back);
  }

  async createDesk(payload: {
    sub: string;
    title: string;
    description: string;
    creatorSub: string;
  }) {
    const created_at = await this.cardRepository.createDesk(payload);

    return { sub: payload.sub, title: payload.title, description: payload.description, created_at };
  }

  async updateDesk(payload: {
    deskSub: string;
    body: { title: string; description: string };
    creatorSub: string;
  }) {
    const { deskSub, body, creatorSub } = payload;
    const exist = await this.cardRepository.existDesk({ sub: deskSub });
    if (!exist) {
      throw new NotFoundError(`CardService: desk with sub = ${deskSub} not found`);
    }

    const haveAccess = await this.cardRepository.haveAccessToDesk({
      user_sub: creatorSub,
      desk_sub: deskSub,
    });
    if (!haveAccess) {
      throw new ForbiddenError(
        `CardService: user with sub = ${creatorSub} cannot update desk settings with desk sub = ${deskSub}`
      );
    }

    await this.cardRepository.updateDesk({
      desk_sub: deskSub,
      payload: body,
    });
  }

  async updateCard(payload: {
    cardSub: string;
    body: { front: string[]; back: string[] };
    creatorSub: string;
  }) {
    const { cardSub, body, creatorSub } = payload;
    const exist = await this.cardRepository.existCardBySub({ sub: cardSub });
    if (!exist) {
      throw new NotFoundError(`CardService: card with sub = ${cardSub} not found`);
    }

    const haveAccess = await this.cardRepository.haveAccessToCard({
      user_sub: creatorSub,
      card_sub: cardSub,
    });
    if (!haveAccess) {
      throw new ForbiddenError(
        `CardService: user with sub = ${creatorSub} cannot update card with sub = ${cardSub}`
      );
    }

    await this.cardRepository.updateCard({
      card_sub: cardSub,
      payload: body,
    });
  }

  async getCardSubsForPlay(deskSub: string, cardsPerSession: number) {
    return await this.cardRepository.getCardSubsForPlay(deskSub, cardsPerSession);
  }

  async deleteCard(payload: { cardSub: string; creatorSub: string }) {
    const { cardSub, creatorSub } = payload;
    const exist = await this.cardRepository.existCardBySub({ sub: cardSub });
    if (!exist) {
      throw new NotFoundError(`CardService: card with sub = ${cardSub} not found`);
    }

    const haveAccess = await this.cardRepository.haveAccessToCard({
      user_sub: creatorSub,
      card_sub: cardSub,
    });
    if (!haveAccess) {
      throw new ForbiddenError(
        `CardService: user with sub = ${creatorSub} cannot get access to card with sub = ${cardSub}`
      );
    }

    await this.cardRepository.deleteCard({ cardSub });
  }

  async getUsersWithDueCards() {
    return await this.userCardSrsRepository.getUsersWithDueCards();
  }

  async archiveDesk(payload: { deskSub: string; creatorSub: string }) {
    const { deskSub, creatorSub } = payload;
    const exist = await this.cardRepository.existDesk({ sub: deskSub });
    if (!exist) {
      throw new NotFoundError(`CardService: desk with sub = ${deskSub} not found`);
    }

    const haveAccess = await this.cardRepository.haveAccessToDesk({
      user_sub: creatorSub,
      desk_sub: deskSub,
    });
    if (!haveAccess) {
      throw new ForbiddenError(
        `CardService: user with sub = ${creatorSub} cannot update desk settings with desk sub = ${deskSub}`
      );
    }

    await this.cardRepository.archiveDesk({ desk_sub: deskSub });
  }

  async updateSrs(userSub: string, cardSub: string, quality: number) {
    const prevSrs = await this.userCardSrsRepository.get(userSub, cardSub);

    const srs = this.calculateSrs(prevSrs, quality);

    await this.userCardSrsRepository.upsert({
      userSub,
      cardSub,
      repetitions: srs.repetitions,
      intervalDays: srs.interval_days,
      easeFactor: srs.ease_factor,
      nextReview: srs.next_review,
    });
  }

  async updateDeskSettings(payload: {
    deskSub: string;
    body: { cards_per_session: number; card_orientation: CARD_ORIENTATION };
    creatorSub: string;
  }) {
    const { deskSub, body, creatorSub } = payload;
    const exist = await this.cardRepository.existDesk({ sub: deskSub });
    if (!exist) {
      throw new NotFoundError(`CardService: desk with sub = ${deskSub} not found`);
    }

    const haveAccess = await this.cardRepository.haveAccessToDesk({
      user_sub: creatorSub,
      desk_sub: deskSub,
    });
    if (!haveAccess) {
      throw new ForbiddenError(
        `CardService: user with sub = ${creatorSub} cannot update desk settings with desk sub = ${deskSub}`
      );
    }

    await this.cardRepository.updateDeskSettings({
      desk_sub: deskSub,
      payload: body,
    });
  }

  private calculateSrs(prev: any | null, quality: number) {
    let repetitions = prev?.repetitions ?? 0;
    let interval = prev?.interval_days ?? 0;
    let ease = Number(prev?.ease_factor || 2.5);

    if (quality < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      repetitions += 1;

      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 3;
      } else {
        interval = Math.round(interval * ease);
      }

      ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      ease = Math.max(1.3, ease);
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    return {
      repetitions,
      interval_days: interval,
      ease_factor: Number(ease.toFixed(2)),
      next_review: nextReview,
    };
  }

  private async generateExamples(cardSub: string, front: string[], back: string[]) {
    try {
      if (!front.length || !back.length) return;

      const isProd = process.env.NODE_ENV === 'production';

      const examples = isProd
        ? await this.generateExamplesWithGemini(front)
        : await this.getExamplesTemplates(front);

      if (examples.length > 0) {
        await this.cardExampleRepository.createMany({ cardSub, sentences: examples });
      } else {
        console.log('❌ No examples found from Gemini');
      }
    } catch (error) {
      console.error('💥 Error generating examples:', error);
    }
  }

  private async getExamplesTemplates(words: string[]): Promise<string[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    return [
      `First sentence with words: ${words.join(', ')}`,
      `Second sentence with words: ${words.join(', ')}`,
      `Third sentence with words: ${words.join(', ')}`,
      `Fourth sentence with words: ${words.join(', ')}`,
      `Fifth sentence with words: ${words.join(', ')}`,
    ];
  }

  private async generateExamplesWithGemini(words: string[]): Promise<string[]> {
    try {
      const wordsString = words.map((w) => `"${w}"`).join(', ');

      const prompt = `Generate 5 diverse example sentences that use the following words: ${wordsString}.

        Requirements:
        1. Each sentence should use ONE OR MORE of the given words
        2. Different sentences should use DIFFERENT words from the list
        3. Each word from the list should appear in at least one sentence
        4. Sentences should be 8-25 words each
        5. Use modern, natural English
        6. Cover different contexts and grammatical structures
        7. Ensure sentences are grammatically correct
        8. Make sentences interesting and informative

        Format: Return each sentence on a new line without numbers or bullets.
        
        Example for words ["house", "garden"]:
        The old house had a beautiful garden full of roses.
        We decided to paint the house and redesign the garden.
        Living in a big house with a small garden can be challenging.
        The house's garden attracts many birds and butterflies.
        They bought a new house specifically for its large garden.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      console.log('response');
      console.log(response);

      if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
        const text = response.candidates[0].content.parts[0].text;

        return this.parseExamplesResponse(text, words);
      }

      return [];
    } catch (error) {
      console.error('❌ Gemini API error:', error);

      return [];
    }
  }

  private parseExamplesResponse(text: string, words: string[]): string[] {
    return text
      .split('\n')
      .map((line) =>
        line
          .replace(/^\d+[\.\)]\s*/, '') // Remove "1. ", "2) "
          .replace(/^[\-\*•]\s*/, '') // Remove "- ", "* ", "• "
          .replace(/^["']|["']$/g, '') // Remove quotes
          .replace(/^Here (are|is)\s+/i, '') // Remove "Here are..."
          .replace(/^Examples?:\s*/i, '') // Remove "Examples:"
          .replace(/^For the words? .*:\s*/i, '') // Remove "For the words..."
          .trim()
      )
      .filter((line) => {
        // Basic validation
        if (line.length < 10 || line.length > 200) return false;
        if (!line.endsWith('.') && !line.endsWith('!') && !line.endsWith('?')) return false;
        if (line.startsWith('Sure') || line.startsWith('Of course') || line.startsWith('The words'))
          return false;

        // Check if line contains at least one of our words
        const lowerLine = line.toLowerCase();
        return words.some((word) => lowerLine.includes(word.toLowerCase()));
      })
      .slice(0, 10);
  }
}

export default new CardService(
  cardRepository,
  cardExampleRepository,
  deskSettingsRepository,
  userCardSrsRepository
);
