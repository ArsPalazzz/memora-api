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
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: 'AIzaSyBzQEKdS4V9QhL4ZFBbj2ZhavYINI9ZSAQ' });

interface ExamplePair {
  source: string;
  translation?: string;
}

export class CardService {
  constructor(
    private readonly cardRepository: CardRepository,
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

    this.generateExamples(payload.front, payload.back);
    console.log(payload);

    const sub = uuidV4();
    const card = await this.cardRepository.createCard({ sub, ...payload });

    return card;
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

  private async generateExamples(front: string[], back: string[]) {
    try {
      const frontWord = front[0];
      const backWord = back[0];

      if (!frontWord || !backWord) return;

      console.log(`🚀 Starting example generation for: "${frontWord}" ↔ "${backWord}"`);

      // Определяем языки
      const frontLang = this.detectLanguage(frontWord);
      const backLang = this.detectLanguage(backWord);

      console.log(`🌐 Languages: front=${frontLang}, back=${backLang}`);

      // Только англ-рус или рус-англ
      if (
        !(frontLang === 'en' && backLang === 'ru') &&
        !(frontLang === 'ru' && backLang === 'en')
      ) {
        console.log('❌ Only EN-RU or RU-EN pairs supported');
        return;
      }

      // Определяем направление
      const sourceLang = frontLang === 'en' ? 'en' : 'ru';
      const targetLang = frontLang === 'en' ? 'ru' : 'en';
      const sourceWord = frontLang === 'en' ? frontWord : backWord;

      console.log(
        `📝 Translation direction: ${sourceLang.toUpperCase()} → ${targetLang.toUpperCase()}`
      );
      console.log(`🔍 Source word: "${sourceWord}"`);

      // Конвертируем языки для Tatoeba
      const tatoebaFrom = sourceLang === 'en' ? 'eng' : 'rus';
      const tatoebaTo = targetLang === 'en' ? 'eng' : 'rus';

      // 1. Основной запрос к Tatoeba
      const examples = await this.generateExamplesWithDeepSeek(sourceWord);

      if (examples.length > 0) {
        console.log(`✅ Found ${examples.length} examples from Tatoeba`);

        // Распределяем примеры между front и back
        // const frontExamples =
        //   frontLang === sourceLang
        //     ? examples.map((ex) => ex.source)
        //     : examples.map((ex) => ex.translation);

        // const backExamples =
        //   frontLang === sourceLang
        //     ? examples.map((ex) => ex.translation)
        //     : examples.map((ex) => ex.source);

        console.log('\n🎉 FINAL EXAMPLES:');
        // console.log('Front examples:', frontExamples);
        // console.log('Back examples:', backExamples);
        console.log('examples:', examples);

        // TODO: Сохранить в базу когда будешь готов
        // await this.saveExamples(cardSub, frontExamples, backExamples);
      } else {
        console.log('❌ No examples found from Tatoeba');
      }
    } catch (error) {
      console.error('💥 Error generating examples:', error);
    }
  }

  private async fetchFromTatoeba(
    word: string,
    fromLang: 'eng' | 'rus',
    toLang: 'eng' | 'rus'
  ): Promise<Array<{ source: string; translation: string }>> {
    try {
      console.log(`\n🌐 Fetching from Tatoeba API...`);
      console.log(`Word: "${word}"`);
      console.log(`From: ${fromLang}, To: ${toLang}`);

      const url = `https://tatoeba.org/en/api_v0/search?from=${fromLang}&to=${toLang}&query=${encodeURIComponent(word)}&trans_to=${toLang}`;

      console.log(`URL: ${url}`);

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'FlashcardsApp/1.0',
        },
      });

      if (!response.ok) {
        console.error(`❌ Tatoeba HTTP error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      console.log(`📊 Tatoeba returned ${data.results?.length || 0} results`);

      const examples: Array<{ source: string; translation: string }> = [];

      // Парсим результаты
      data.results?.forEach((item: any, index: number) => {
        if (item.text && item.translations?.[0]?.text) {
          const source = item.text.trim();
          const translation = item.translations[0].text.trim();

          // Проверяем что пример содержит исходное слово
          if (source.toLowerCase().includes(word.toLowerCase())) {
            examples.push({ source, translation });
            console.log(`\n📝 Example ${index + 1}:`);
            console.log(`   Source: ${source}`);
            console.log(`   Translation: ${translation}`);
          }
        }
      });

      // Если примеров мало, ищем без перевода
      if (examples.length < 3) {
        console.log(`\n🔄 Only ${examples.length} examples, searching without translation...`);
        const extraExamples = await this.fetchWithoutTranslation(word, fromLang);
        examples.push(...extraExamples);
      }

      console.log(`\n📋 Total examples collected: ${examples.length}`);
      return examples.slice(0, 5);
    } catch (error) {
      console.error('❌ Tatoeba fetch error:', error);
      return [];
    }
  }

  private async fetchWithoutTranslation(
    word: string,
    lang: 'eng' | 'rus'
  ): Promise<Array<{ source: string; translation: string }>> {
    try {
      const url = `https://tatoeba.org/en/api_v0/search?from=${lang}&query=${encodeURIComponent(word)}`;

      console.log(`🌐 Secondary URL (no translation): ${url}`);

      const response = await fetch(url);
      if (!response.ok) return [];

      const data = await response.json();
      const examples: Array<{ source: string; translation: string }> = [];

      data.results?.forEach((item: any) => {
        if (item.text && !examples.some((ex) => ex.source === item.text.trim())) {
          const source = item.text.trim();
          if (source.toLowerCase().includes(word.toLowerCase())) {
            examples.push({
              source,
              translation: `[Translation needed for: ${source.substring(0, 40)}...]`,
            });
          }
        }
      });

      console.log(`📊 Found ${examples.length} examples without translation`);
      return examples;
    } catch (error) {
      console.error('Secondary fetch error:', error);
      return [];
    }
  }

  private detectLanguage(text: string): 'en' | 'ru' | 'other' {
    if (!text) return 'other';

    // Простая проверка по наличию кириллицы/латиницы
    const hasCyrillic = /[а-яА-ЯёЁ]/.test(text);
    const hasLatin = /[a-zA-Z]/.test(text);

    if (hasCyrillic && !hasLatin) return 'ru';
    if (hasLatin && !hasCyrillic) return 'en';

    return 'other';
  }

  // private async fetchExamplesFromLinguee(
  //   word: string,
  //   sourceLang: 'en' | 'ru',
  //   targetLang: 'en' | 'ru'
  // ): Promise<ExamplePair[]> {
  //   try {
  //     const langPair =
  //       sourceLang === 'en' && targetLang === 'ru'
  //         ? 'english-russian'
  //         : sourceLang === 'ru' && targetLang === 'en'
  //           ? 'russian-english'
  //           : sourceLang + '-' + targetLang;

  //     const url = `https://www.linguee.com/${langPair}/search?source=auto&query=${encodeURIComponent(word)}`;

  //     const response = await fetch(
  //       `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  //       {
  //         headers: {
  //           'User-Agent': 'Mozilla/5.0',
  //         },
  //       }
  //     );

  //     if (!response.ok) return [];

  //     const data = await response.json();
  //     const html = data.contents;

  //     const examples: ExamplePair[] = [];

  //     // Парсинг Linguee - они более дружелюбны
  //     const regex =
  //       /class="example"\s*[^>]*>[\s\S]*?<span class="tag_s">([^<]+)<\/span>[\s\S]*?<span class="tag_t">([^<]+)<\/span>/g;

  //     let match;
  //     while ((match = regex.exec(html)) !== null && examples.length < 5) {
  //       const source = this.cleanText(match[1]);
  //       const translation = this.cleanText(match[2]);

  //       if (source && translation && source.toLowerCase().includes(word.toLowerCase())) {
  //         examples.push({ source, translation });
  //       }
  //     }

  //     return examples.slice(0, 5);
  //   } catch (error) {
  //     console.error('Linguee error:', error);
  //     return [];
  //   }
  // }

  // private async generateForCard(
  //   frontVariants: string[],
  //   backVariants: string[]
  // ): Promise<{
  //   frontExamples: string[]; // 5 примеров для front
  //   backExamples: string[]; // 5 примеров для back
  // }> {
  //   // Берем первый вариант из каждого
  //   const frontWord = frontVariants[0];
  //   const backWord = backVariants[0];

  //   if (!frontWord || !backWord) {
  //     return { frontExamples: [], backExamples: [] };
  //   }

  //   const frontLang = this.detectLanguage(frontWord);
  //   const backLang = this.detectLanguage(backWord);

  //   // Если не англ/рус - возвращаем пустые массивы
  //   if (frontLang === 'other' || backLang === 'other') {
  //     return { frontExamples: [], backExamples: [] };
  //   }

  //   // Для Reverso нужны 'en' и 'ru', не 'eng'/'rus'
  //   const frontLangCode = frontLang === 'en' ? 'en' : 'ru';
  //   const backLangCode = backLang === 'en' ? 'en' : 'ru';

  //   // Определяем направление перевода
  //   let sourceLang: 'en' | 'ru', targetLang: 'en' | 'ru';
  //   let sourceWord: string;

  //   if (frontLang === 'en' && backLang === 'ru') {
  //     // Английский → Русский
  //     sourceLang = 'en';
  //     targetLang = 'ru';
  //     sourceWord = frontWord;
  //   } else if (frontLang === 'ru' && backLang === 'en') {
  //     // Русский → Английский
  //     sourceLang = 'ru';
  //     targetLang = 'en';
  //     sourceWord = frontWord;
  //   } else {
  //     // Если языки одинаковые или непонятные - ищем примеры отдельно
  //     const [frontExamples, backExamples] = await Promise.all([
  //       this.fetchExamplesForWord(frontWord, frontLangCode),
  //       this.fetchExamplesForWord(backWord, backLangCode),
  //     ]);

  //     return {
  //       frontExamples: frontExamples.slice(0, 5),
  //       backExamples: backExamples.slice(0, 5),
  //     };
  //   }

  //   // Получаем примеры с переводами из Reverso
  //   const examplesWithTranslations = await this.fetchExamplesFromGlosbe(
  //     sourceWord,
  //     sourceLang,
  //     targetLang
  //   );

  //   if (examplesWithTranslations.length > 0) {
  //     // Если front - исходный язык, то примеры на front, переводы на back
  //     if (sourceLang === frontLangCode) {
  //       return {
  //         frontExamples: examplesWithTranslations.map((ex) => ex.source).slice(0, 5),
  //         backExamples: examplesWithTranslations.map((ex) => ex.translation || '').slice(0, 5),
  //       };
  //     } else {
  //       // Если front - целевой язык
  //       return {
  //         frontExamples: examplesWithTranslations.map((ex) => ex.translation || '').slice(0, 5),
  //         backExamples: examplesWithTranslations.map((ex) => ex.source).slice(0, 5),
  //       };
  //     }
  //   }

  //   // Если Reverso не дал результатов - ищем примеры отдельно
  //   const [frontExamples, backExamples] = await Promise.all([
  //     this.fetchExamplesForWord(frontWord, frontLangCode),
  //     this.fetchExamplesForWord(backWord, backLangCode),
  //   ]);

  //   return {
  //     frontExamples: frontExamples.slice(0, 5),
  //     backExamples: backExamples.slice(0, 5),
  //   };
  // }

  // // Вспомогательный метод для получения примеров для одного слова
  // private async fetchExamplesForWord(word: string, lang: 'en' | 'ru'): Promise<string[]> {
  //   // Пробуем Reverso для одного языка
  //   const examples = await this.fetchExamplesFromFreeDictionary(word, lang, lang);
  //   return examples.map((ex) => ex.source).slice(0, 5);
  // }

  // private detectLanguage(text: string): 'en' | 'ru' | 'other' {
  //   const cleanText = text.replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g, '');

  //   if (!cleanText.trim()) return 'other';

  //   let enCount = 0;
  //   let ruCount = 0;

  //   for (let char of cleanText) {
  //     if (/[a-zA-Z]/.test(char)) enCount++;
  //     if (/[а-яА-ЯёЁ]/.test(char)) ruCount++;
  //   }

  //   // Улучшенная логика: если есть кириллица - русский, если латиница - английский
  //   // Если оба - смотрим что преобладает
  //   if (ruCount > 0 && enCount === 0) return 'ru';
  //   if (enCount > 0 && ruCount === 0) return 'en';

  //   // Если смешанный текст
  //   if (ruCount > enCount * 1.5) return 'ru';
  //   if (enCount > ruCount * 1.5) return 'en';

  //   return 'other';
  // }

  // private async fetchExamplesFromReversoContext(
  //   word: string,
  //   sourceLang: 'en' | 'ru',
  //   targetLang: 'en' | 'ru'
  // ): Promise<ExamplePair[]> {
  //   try {
  //     const url = `https://context.reverso.net/translation/${sourceLang}-${targetLang}/${encodeURIComponent(word)}`;

  //     const response = await fetch(url, {
  //       headers: {
  //         'User-Agent':
  //           'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  //         Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  //         'Accept-Language': 'en-US,en;q=0.5',
  //         'Accept-Encoding': 'gzip, deflate, br',
  //         Connection: 'keep-alive',
  //         'Upgrade-Insecure-Requests': '1',
  //         'Sec-Fetch-Dest': 'document',
  //         'Sec-Fetch-Mode': 'navigate',
  //         'Sec-Fetch-Site': 'none',
  //         'Sec-Fetch-User': '?1',
  //         'Cache-Control': 'max-age=0',
  //       },
  //     });

  //     if (!response.ok) {
  //       console.log(response);
  //       console.error(`Reverso HTTP error: ${response.status} ${response.statusText}`);
  //       return [];
  //     }

  //     const html = await this.fetchWithBetterProxy(url);

  //     // Более точный парсинг для Reverso
  //     const examples: ExamplePair[] = [];

  //     // Парсим структуру Reverso
  //     const exampleBlocks = html.split('<div class="example">');

  //     for (let i = 1; i < Math.min(exampleBlocks.length, 11); i++) {
  //       const block = exampleBlocks[i];

  //       // Ищем source text
  //       const srcStart = block.indexOf('<span class="text"');
  //       if (srcStart === -1) continue;

  //       const srcEnd = block.indexOf('</span>', srcStart);
  //       if (srcEnd === -1) continue;

  //       let source = block.substring(srcStart, srcEnd);
  //       source = source.replace(/<[^>]+>/g, '').trim();

  //       // Ищем translation
  //       const transMarker = '<div class="trg';
  //       const transStart = block.indexOf(transMarker);
  //       if (transStart === -1) continue;

  //       const transTextStart = block.indexOf('<span class="text"', transStart);
  //       if (transTextStart === -1) continue;

  //       const transEnd = block.indexOf('</span>', transTextStart);
  //       if (transEnd === -1) continue;

  //       let translation = block.substring(transTextStart, transEnd);
  //       translation = translation.replace(/<[^>]+>/g, '').trim();

  //       if (source && translation && source.toLowerCase().includes(word.toLowerCase())) {
  //         examples.push({
  //           source: this.cleanText(source),
  //           translation: this.cleanText(translation),
  //         });
  //       }
  //     }

  //     // Если не нашли в новой структуре, пробуем старую regex
  //     if (examples.length === 0) {
  //       const exampleRegex =
  //         /class="example"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>[\s\S]*?<span[^>]*>([^<]+)<\/span>/g;

  //       let match;
  //       while ((match = exampleRegex.exec(html)) !== null && examples.length < 10) {
  //         const source = match[1].trim();
  //         const translation = match[2].trim();

  //         if (source && translation && source.toLowerCase().includes(word.toLowerCase())) {
  //           examples.push({
  //             source: this.cleanText(source),
  //             translation: this.cleanText(translation),
  //           });
  //         }
  //       }
  //     }

  //     return examples.slice(0, 5);
  //   } catch (error) {
  //     console.error('Reverso Context error:', error);
  //     return [];
  //   }
  // }

  // private async fetchExamplesFromReverso(
  //   word: string,
  //   sourceLang: 'en' | 'ru',
  //   targetLang: 'en' | 'ru'
  // ): Promise<ExamplePair[]> {
  //   try {
  //     const url = `https://context.reverso.net/translation/${sourceLang}-${targetLang}/${encodeURIComponent(word)}`;

  //     console.log(`🔗 Fetching from Reverso: ${url}`);

  //     const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

  //     const response = await fetch(proxyUrl, {
  //       headers: {
  //         'User-Agent': 'Mozilla/5.0',
  //       },
  //     });

  //     if (!response.ok) {
  //       console.error(`❌ HTTP error: ${response.status}`);
  //       return [];
  //     }

  //     const html = await response.text();

  //     // ТЕСТИРУЕМ ПАРСИНГ
  //     this.testReversoParsing(html, word);

  //     // Используем твой парсер
  //     const examples = this.parseReversoHTML(html, word);

  //     console.log(`✅ Found ${examples.length} examples from Reverso`);
  //     return examples.slice(0, 5);
  //   } catch (error) {
  //     console.error('❌ Reverso error:', error);
  //     return [];
  //   }
  // }

  // private async fetchExamplesFromReversoWithPuppeteer(
  //   word: string,
  //   sourceLang: 'en' | 'ru',
  //   targetLang: 'en' | 'ru'
  // ): Promise<ExamplePair[]> {
  //   try {
  //     // Используем сервис который запускает реальный браузер
  //     const url = `https://context.reverso.net/translation/${sourceLang}-${targetLang}/${word}`;

  //     // Вариант 1: ScraperAPI (платный но работает)
  //     const scraperApiKey = process.env.SCRAPER_API_KEY || 'demo';
  //     const scraperUrl = `https://api.scraperapi.com/?api_key=${scraperApiKey}&url=${encodeURIComponent(url)}&render=true`;

  //     // Вариант 2: Browserless (можно self-host)
  //     const browserlessUrl = `https://chrome.browserless.io/content?token=${process.env.BROWSERLESS_TOKEN}&url=${encodeURIComponent(url)}`;

  //     console.log(`🌐 Using Puppeteer service for Reverso: ${url}`);

  //     const response = await fetch(scraperUrl, {
  //       headers: {
  //         'User-Agent': 'Mozilla/5.0',
  //       },
  //       //timeout: 15000
  //     });

  //     if (!response.ok) {
  //       console.error(`ScraperAPI error: ${response.status}`);
  //       return [];
  //     }

  //     const html = await response.text();

  //     // Проверяем что не получили капчу
  //     if (html.includes('Enable JavaScript') || html.includes('cf-browser-verification')) {
  //       console.error('❌ Still getting Cloudflare');
  //       return [];
  //     }

  //     console.log(`✅ Got HTML, length: ${html.length}`);

  //     // Парсим
  //     return this.parseReversoHTML(html, word);
  //   } catch (error) {
  //     console.error('Puppeteer fetch error:', error);
  //     return [];
  //   }
  // }

  // private async generateForCard(
  //   frontVariants: string[],
  //   backVariants: string[]
  // ): Promise<{
  //   frontExamples: string[];
  //   backExamples: string[];
  // }> {
  //   try {
  //     const frontWord = frontVariants[0];
  //     const backWord = backVariants[0];

  //     console.log(`🔄 Generating examples for: "${frontWord}" → "${backWord}"`);

  //     if (!frontWord || !backWord) {
  //       console.log('❌ No words provided');
  //       return { frontExamples: [], backExamples: [] };
  //     }

  //     // Определяем языки
  //     const frontLang = this.detectLanguage(frontWord);
  //     const backLang = this.detectLanguage(backWord);

  //     console.log(`🌐 Languages detected: front=${frontLang}, back=${backLang}`);

  //     // Если не англ/рус - возвращаем пустые
  //     if (frontLang === 'other' || backLang === 'other') {
  //       console.log('❌ Unsupported languages');
  //       return { frontExamples: [], backExamples: [] };
  //     }

  //     const frontLangCode = frontLang === 'en' ? 'en' : 'ru';
  //     const backLangCode = backLang === 'en' ? 'en' : 'ru';

  //     // Определяем направление перевода
  //     let sourceLang: 'en' | 'ru';
  //     let targetLang: 'en' | 'ru';
  //     let sourceWord: string;

  //     if (frontLang === 'en' && backLang === 'ru') {
  //       // Английский → Русский
  //       sourceLang = 'en';
  //       targetLang = 'ru';
  //       sourceWord = frontWord;
  //       console.log(`📝 Direction: EN → RU (source: ${sourceWord})`);
  //     } else if (frontLang === 'ru' && backLang === 'en') {
  //       // Русский → Английский
  //       sourceLang = 'ru';
  //       targetLang = 'en';
  //       sourceWord = frontWord;
  //       console.log(`📝 Direction: RU → EN (source: ${sourceWord})`);
  //     } else {
  //       // Языки одинаковые или непонятные
  //       console.log(`⚠️ Same language or unclear direction`);
  //       const [frontExamples, backExamples] = await Promise.all([
  //         this.fetchExamplesForWord(frontWord, frontLangCode),
  //         this.fetchExamplesForWord(backWord, backLangCode),
  //       ]);

  //       return {
  //         frontExamples: frontExamples.slice(0, 5),
  //         backExamples: backExamples.slice(0, 5),
  //       };
  //     }

  //     // Получаем примеры с переводами
  //     console.log(`🔍 Fetching examples from Reverso...`);
  //     const examplesWithTranslations = await this.fetchExamplesFromReverso(
  //       sourceWord,
  //       sourceLang,
  //       targetLang
  //     );

  //     console.log(`📊 Reverso returned ${examplesWithTranslations.length} examples`);

  //     if (examplesWithTranslations.length > 0) {
  //       // Если front - исходный язык
  //       if (sourceLang === frontLangCode) {
  //         console.log(`✅ Using front as source language`);
  //         return {
  //           frontExamples: examplesWithTranslations.map((ex) => ex.source).slice(0, 5),
  //           backExamples: examplesWithTranslations.map((ex) => ex.translation || '').slice(0, 5),
  //         };
  //       } else {
  //         // Если front - целевой язык
  //         console.log(`✅ Using back as source language`);
  //         return {
  //           frontExamples: examplesWithTranslations.map((ex) => ex.translation || '').slice(0, 5),
  //           backExamples: examplesWithTranslations.map((ex) => ex.source).slice(0, 5),
  //         };
  //       }
  //     }

  //     // Если Reverso не дал результатов - ищем отдельно
  //     console.log(`⚠️ Reverso failed, trying separate fetches...`);
  //     const [frontExamples, backExamples] = await Promise.all([
  //       this.fetchExamplesForWord(frontWord, frontLangCode),
  //       this.fetchExamplesForWord(backWord, backLangCode),
  //     ]);

  //     console.log(
  //       `📊 Separate fetches: front=${frontExamples.length}, back=${backExamples.length}`
  //     );

  //     return {
  //       frontExamples: frontExamples.slice(0, 5),
  //       backExamples: backExamples.slice(0, 5),
  //     };
  //   } catch (error) {
  //     console.error('💥 Error in generateForCard:', error);
  //     return { frontExamples: [], backExamples: [] };
  //   }
  // }

  private async fetchFromWebsters1913(word: string): Promise<string[]> {
    try {
      // Webster's 1913 Dictionary - публичный доступ
      const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

      console.log(`📚 Webster's 1913: ${url}`);

      const response = await fetch(url);
      if (!response.ok) return [];

      const data = await response.json();
      const examples: string[] = [];

      // Извлекаем сложные примеры
      data.forEach((entry: any) => {
        entry.meanings?.forEach((meaning: any) => {
          meaning.definitions?.forEach((def: any) => {
            if (def.example && def.example.length > 40) {
              // Фильтруем сложные примеры
              const words = def.example.split(' ').length;
              if (words > 8) {
                examples.push(def.example);
              }
            }
          });
        });
      });

      console.log(`📊 Webster's found ${examples.length} complex examples`);
      return examples;
    } catch (error) {
      console.error("Webster's error:", error);
      return [];
    }
  }
  // private async fetchFromMerriamWebster(word: string): Promise<string[]> {
  //   const apiKey = 'ba25e190-ad13-4f36-a8a2-19741add2718'; // Получите на https://dictionaryapi.com/
  //   const url = `https://dictionaryapi.com/api/v3/references/sd3/json/${word}?key=${apiKey}`;

  //   try {
  //     const response = await fetch(url);
  //     const data = await response.json();
  //     console.log(data)
  //     const examples: string[] = [];

  //     if (Array.isArray(data)) {
  //       data.forEach((entry: any) => {
  //         if (entry.shortdef) {
  //           entry.shortdef.forEach((def: string) => {
  //             if (def.length > 10) {
  //               examples.push(def);
  //             }
  //           });
  //         }

  //         // Ищем примеры предложений
  //         if (entry.def && Array.isArray(entry.def)) {
  //           entry.def.forEach((defGroup: any) => {
  //             if (defGroup.sseq) {
  //               defGroup.sseq.forEach((sense: any[]) => {
  //                 sense.forEach((senseItem: any[]) => {
  //                   if (senseItem[0] === 'sense' && senseItem[1]) {
  //                     const dt = senseItem[1].dt;
  //                     if (Array.isArray(dt)) {
  //                       dt.forEach((dtItem: any[]) => {
  //                         if (dtItem[0] === 'text' && dtItem[1]) {
  //                           const text = dtItem[1];
  //                           if (typeof text === 'string' && text.includes(':')) {
  //                             const exampleMatch = text.match(/:\s*(.+)/);
  //                             if (exampleMatch && exampleMatch[1].length > 10) {
  //                               examples.push(exampleMatch[1]);
  //                             }
  //                           }
  //                         }
  //                       });
  //                     }
  //                   }
  //                 });
  //               });
  //             }
  //           });
  //         }
  //       });
  //     }

  //     return examples.slice(0, 10);
  //   } catch (error) {
  //     console.error('❌ Ошибка Merriam-Webster:', error);
  //     return [];
  //   }
  // }
  private async fetchFromFreeDictionary(word: string): Promise<string[]> {
    try {
      const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`;
      console.log(`🔍 Free Dictionary URL: ${url}`);

      const response = await fetch(url);
      const data = await response.json();

      const examples: string[] = [];

      if (Array.isArray(data)) {
        data.forEach((entry: any) => {
          if (entry.meanings) {
            entry.meanings.forEach((meaning: any) => {
              if (meaning.definitions) {
                meaning.definitions.forEach((def: any) => {
                  // Добавляем ТОЛЬКО примеры, НЕ определения!
                  if (def.example && def.example.length > 10) {
                    examples.push(def.example);
                  }
                });
              }
            });
          }

          // Также ищем в phonetics (иногда там есть примеры)
          if (entry.phonetics) {
            entry.phonetics.forEach((phonetic: any) => {
              if (phonetic.text && phonetic.text.includes(' ')) {
                const text = phonetic.text;
                if (text.length > 20 && text.includes(word)) {
                  examples.push(text);
                }
              }
            });
          }
        });
      }

      console.log(`📊 Free Dictionary найдено примеров: ${examples.length}`);
      return examples.slice(0, 10);
    } catch (error) {
      console.error('❌ Ошибка Free Dictionary:', error);
      return [];
    }
  }

  // private async fetchFromWordNet(word: string): Promise<string[]> {
  //   const url = `https://wordnet.princeton.edu/perl/webwn?s=${encodeURIComponent(word)}&sub=Search+WordNet&o2=&o0=1&o8=1&o1=1&o7=&o5=&o9=&o6=&o3=&o4=&i=-1&h=0`;

  //   console.log(`🌐 WordNet URL: ${url}`);

  //   try {
  //     const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
  //     if (!response.ok) {
  //       console.log(`❌ Ошибка HTTP: ${response.status}`);
  //       return [];
  //     }

  //     const html = await response.text();
  //     console.log(`📄 HTML length: ${html.length}`);

  //     if (html.includes('No results found') || html.includes('No matches')) {
  //       console.log('⚠️ WordNet: результатов не найдено');
  //       return [];
  //     }

  //     // Сохраним HTML для отладки
  //     console.log('=== НАЧАЛО HTML ===');
  //     console.log(html.substring(0, 2000)); // Первые 2000 символов для отладки
  //     console.log('=== КОНЕЦ HTML ===');

  //     const $ = cheerio.load(html);
  //     const examples: string[] = [];

  //     // Ищем определения и примеры в структуре WordNet
  //     // Попробуйте разные селекторы
  //     $('ul').each((_, element) => {
  //       const text = $(element).text().trim();
  //       if (text.includes('"') && text.length > 20) {
  //         // Извлекаем примеры в кавычках
  //         const matches = text.match(/["']([^"']{10,200})["']/g);
  //         if (matches) {
  //           matches.forEach((match) => {
  //             const clean = match.replace(/["']/g, '').trim();
  //             if (clean.length > 10 && !examples.includes(clean)) {
  //               examples.push(clean);
  //             }
  //           });
  //         }
  //       }
  //     });

  //     // Ищем в <li> элементах
  //     $('li').each((_, element) => {
  //       const text = $(element).text().trim();
  //       if (text.includes('"') && text.includes('example')) {
  //         const clean = text.replace(/.*["']([^"']+)["'].*/, '$1').trim();
  //         if (clean.length > 10) {
  //           examples.push(clean);
  //         }
  //       }
  //     });

  //     console.log(`📊 Найдено примеров: ${examples.length}`);

  //     if (examples.length === 0) {
  //       // Попробуем извлечь все тексты в кавычках со страницы
  //       const allText = $('body').text();
  //       const quoteMatches = allText.match(/["']([^"']{15,250})["']/g);
  //       if (quoteMatches) {
  //         quoteMatches.forEach((match) => {
  //           const clean = match.replace(/["']/g, '').trim();
  //           if (clean.length > 15 && /[a-z]/i.test(clean) && !clean.includes('http')) {
  //             examples.push(clean);
  //           }
  //         });
  //       }
  //     }

  //     return [...new Set(examples)].slice(0, 10);
  //   } catch (error) {
  //     console.error('❌ Ошибка при получении данных WordNet:', error);
  //     return [];
  //   }
  // }

  // Вспомогательный метод для получения примеров для одного слова
  private async fetchExamplesForWord(word: string, lang: 'en' | 'ru'): Promise<string[]> {
    console.log(`🔍 Fetching single word examples: "${word}" (${lang})`);

    // Пока просто возвращаем пустой массив или шаблонные примеры
    if (lang === 'en') {
      return [
        `Practice using "${word}" in sentences.`,
        `Can you give an example with "${word}"?`,
        `The word "${word}" is useful to know.`,
        `Try to use "${word}" in conversation.`,
        `Learning "${word}" will help your vocabulary.`,
      ];
    } else {
      return [
        `Практикуйте использование слова "${word}".`,
        `Приведите пример с "${word}".`,
        `Слово "${word}" полезно знать.`,
        `Попробуйте использовать "${word}" в разговоре.`,
        `Изучение "${word}" поможет вашему словарному запасу.`,
      ];
    }
  }

  // private async fetchExamplesFromTatoeba(word: string): Promise<string[]> {
  //   try {
  //     // Tatoeba API для поиска примеров предложений
  //     const url = `https://tatoeba.org/en/api_v0/search?from=eng&query=${encodeURIComponent(word)}&to=`;

  //     const response = await fetch(url);
  //     const data = await response.json();

  //     const examples: string[] = [];

  //     if (data.results && Array.isArray(data.results)) {
  //       // Берем только английские предложения
  //       data.results.forEach((result: any) => {
  //         if (result.text && result.text.toLowerCase().includes(word.toLowerCase())) {
  //           examples.push(result.text);
  //         }
  //       });
  //     }

  //     return examples.slice(0, 10);
  //   } catch (error) {
  //     console.error('❌ Ошибка Tatoeba:', error);
  //     return [];
  //   }
  // }
  //   private async generateExamplesWithGemini(word: string): Promise<string[]> {
  //     try {
  //       console.log('start');
  //       const apiKey = 'AIzaSyBzQEKdS4V9QhL4ZFBbj2ZhavYINI9ZSAQ'; // Сохрани ключ в .env

  //       const prompt = `Generate 8-10 diverse example sentences for the word "${word}".

  // Requirements:
  // 1. Sentences must naturally contain the word "${word}"
  // 2. Show different meanings/contexts if the word has multiple meanings
  // 3. Sentences should be 8-25 words each
  // 4. Use modern, natural English
  // 5. Include both simple and complex sentence structures
  // 6. Ensure sentences are grammatically correct
  // 7. Cover different tenses and grammatical forms
  // 8. Make sentences interesting and informative

  // Format: Return each sentence on a new line without numbers or bullets.`;

  // const response2 = await fetch(
  //   `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  // );

  // const data2 = await response2.json();
  // const models = data2.models?.map((m: any) => m.name) || [];
  // console.log('📋 Доступные модели:', models);

  // const response = await fetch(
  //   `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
  //   {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       contents: [
  //         {
  //           parts: [{ text: prompt }],
  //         },
  //       ],
  //       generationConfig: {
  //         temperature: 0.8,
  //         maxOutputTokens: 800,
  //         topP: 0.9,
  //         topK: 40,
  //       },
  //     }),
  //   }
  // );
  // const response = await ai.models.generateContent({
  //   model: 'gemini-2.5-flash',
  //   contents: prompt,
  // });
  // console.log('response');
  // console.log(response);
  // const data = await response.json();
  // console.log('data');
  // console.log(data);
  // if (data.candidates && data.candidates[0] && data.candidates[0].content) {
  //   const text = data.candidates[0].content.parts[0].text;

  //   // Парсим ответ
  //   const examples = text
  //     .split('\n')
  //     .map((line: string) => line.trim())
  //     .filter((line: string) => {
  //       // Фильтруем только подходящие предложения
  //       return (
  //         line.length > 10 &&
  //         line.length < 200 &&
  //         line.toLowerCase().includes(word.toLowerCase()) &&
  //         !line.startsWith('Here') &&
  //         !line.startsWith('Sure') &&
  //         !line.includes('*') &&
  //         !line.match(/^\d+\./)
  //       );
  //     })
  //     .slice(0, 10);

  //   console.log(`✅ Gemini сгенерировал ${examples.length} примеров`);
  //   return examples;
  // }

  //     return [];
  //   } catch (error) {
  //     console.error('❌ Gemini API error:', error);
  //     //return this.generateFallbackExamples(word);
  //     return [];
  //   }
  // }
  private async generateExamplesWithDeepSeek(word: string): Promise<string[]> {
    try {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      const apiUrl = 'https://api.deepseek.com/chat/completions';

      const prompt = `Generate 8-10 diverse example sentences for the English word "${word}".

Requirements:
1. Each sentence must naturally contain the word "${word}"
2. Show different contexts and grammatical structures
3. Sentences should be 8-25 words each
4. Use modern, natural English
5. Return ONLY the sentences, one per line, without any explanations, numbers, or additional text

Example format for word "happiness":
Happiness often comes from helping others.
Finding happiness in small things can improve your daily life.
Her face lit up with pure happiness when she saw the surprise.
Many people search for happiness their entire lives.
True happiness is often found in meaningful relationships.`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful English language tutor. Generate clear, natural example sentences.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
          stream: false,
        }),
      });
      console.log(response);
      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ DeepSeek API error ${response.status}:`, error);
        return [];
      }

      const data = await response.json();
      console.log(data);
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const text = data.choices[0].message.content;
        return this.parseDeepSeekResponse(text, word);
      }

      return [];
    } catch (error) {
      console.error('❌ DeepSeek API exception:', error);
      return [];
    }
  }

  private parseDeepSeekResponse(text: string, word: string): string[] {
    const examples = text
      .split('\n')
      .map((line) =>
        line
          .replace(/^\d+[\.\)]\s*/, '') // Убираем "1. ", "2) "
          .replace(/^[\-\*•]\s*/, '') // Убираем "- ", "* ", "• "
          .replace(/^["']|["']$/g, '') // Убираем кавычки
          .replace(/^Here (are|is)\s+/i, '') // Убираем "Here are..."
          .replace(/^Examples?:\s*/i, '') // Убираем "Examples:"
          .trim()
      )
      .filter((line) => {
        const lowerLine = line.toLowerCase();
        const lowerWord = word.toLowerCase();

        // Проверяем, что это валидное предложение
        return (
          line.length > 10 &&
          line.length < 200 &&
          lowerLine.includes(lowerWord) &&
          (line.endsWith('.') || line.endsWith('!') || line.endsWith('?')) &&
          line.split(' ').length > 4
        ); // Минимум 5 слов
      })
      .slice(0, 10);

    console.log(`✅ DeepSeek: ${examples.length} примеров`);

    // Логируем для отладки
    if (examples.length > 0) {
      examples.forEach((ex, i) => {
        console.log(`  ${i + 1}. ${ex}`);
      });
    }

    return examples;
  }

  // private detectLanguage(text: string): 'en' | 'ru' | 'other' {
  //   const cleanText = text.replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g, '');

  //   if (!cleanText.trim()) return 'other';

  //   let enCount = 0;
  //   let ruCount = 0;

  //   for (let char of cleanText) {
  //     if (/[a-zA-Z]/.test(char)) enCount++;
  //     if (/[а-яА-ЯёЁ]/.test(char)) ruCount++;
  //   }

  //   console.log(`🔤 Language detection for "${text}": en=${enCount}, ru=${ruCount}`);

  //   if (ruCount > 0 && enCount === 0) return 'ru';
  //   if (enCount > 0 && ruCount === 0) return 'en';

  //   if (ruCount > enCount * 1.5) return 'ru';
  //   if (enCount > ruCount * 1.5) return 'en';

  //   return 'other';
  // }

  // private async generateAndSaveExamples(frontVariants: string[], backVariants: string[]) {
  //   try {
  //     const startTime = Date.now();

  //     const { frontExamples, backExamples } = await this.generateForCard(
  //       frontVariants,
  //       backVariants
  //     );

  //     const duration = Date.now() - startTime;

  //     // ВОТ ТУТ ПРОСТО ПОКАЗЫВАЕМ РЕЗУЛЬТАТ
  //     console.log('='.repeat(50));
  //     //console.log(`Generated examples in ${duration}ms for card ${cardSub}`);
  //     console.log(`Front word: ${frontVariants[0]}`);
  //     console.log(`Back word: ${backVariants[0]}`);
  //     console.log(`Front examples found: ${frontExamples.length}`);
  //     console.log(`Back examples found: ${backExamples.length}`);
  //     console.log('');

  //     // Показываем все примеры
  //     frontExamples.forEach((example, index) => {
  //       console.log(`Front example ${index + 1}: ${example}`);
  //       if (backExamples[index]) {
  //         console.log(`Back example ${index + 1}:  ${backExamples[index]}`);
  //       }
  //       console.log('-'.repeat(30));
  //     });

  //     console.log('='.repeat(50));

  //     // Пока не сохраняем в БД, просто логируем
  //     // if (frontExamples.length > 0) {
  //     //   await this.saveExamples(cardSub, frontExamples, backExamples);
  //     // }
  //   } catch (error) {
  //     console.error('Failed to generate examples:', error);
  //   }
  // }

  // private testReversoParsing(html: string, word: string): void {
  //   console.log('🔍 Testing Reverso HTML parsing...');
  //   console.log(`HTML length: ${html.length} chars`);
  //   console.log(`Looking for word: "${word}"`);

  //   // Проверяем есть ли example блоки
  //   const exampleCount = (html.match(/class="example"/g) || []).length;
  //   console.log(`Found ${exampleCount} example blocks`);

  //   // Показываем первые 1000 символов HTML для отладки
  //   console.log('\nFirst 1000 chars of HTML:');
  //   console.log(html.substring(0, 1000));
  //   console.log('...\n');

  //   // Пробуем разные стратегии парсинга
  //   console.log('Trying different parsing strategies:');

  //   // Стратегия 1: через split
  //   const examplesSplit = html.split('<div class="example">');
  //   console.log(`Strategy 1 (split): ${examplesSplit.length - 1} examples found`);

  //   // Стратегия 2: через regex
  //   const regex = /class="example"[^>]*>([\s\S]*?)<\/div>/g;
  //   let regexMatches = 0;
  //   let match;
  //   while ((match = regex.exec(html)) !== null && regexMatches < 5) {
  //     regexMatches++;
  //     console.log(`\nRegex match ${regexMatches}:`);
  //     console.log(match[1].substring(0, 200) + '...');
  //   }

  //   // Стратегия 3: ищем просто тексты
  //   const textRegex = /<span[^>]*>([^<]+)<\/span>/g;
  //   const allTexts: string[] = [];
  //   while ((match = textRegex.exec(html)) !== null && allTexts.length < 20) {
  //     allTexts.push(match[1]);
  //   }

  //   console.log(`\nFound ${allTexts.length} text spans total`);
  //   console.log('First 10 text spans:');
  //   allTexts.slice(0, 10).forEach((text, i) => {
  //     console.log(`${i + 1}. "${text}"`);
  //   });

  //   // Вызываем твой парсер
  //   console.log('\n📋 Calling your parseReversoHTML function:');
  //   const parsedExamples = this.parseReversoHTML(html, word);
  //   console.log(`Parsed ${parsedExamples.length} examples`);

  //   parsedExamples.forEach((ex, i) => {
  //     console.log(`\nExample ${i + 1}:`);
  //     console.log(`Source: "${ex.source}"`);
  //     console.log(`Translation: "${ex.translation}"`);
  //   });
  // }

  // private async saveExamples(cardSub: string, frontExamples: string[], backExamples: string[]) {
  //   // Сохраняем пары примеров
  //   for (let i = 0; i < Math.min(frontExamples.length, backExamples.length); i++) {
  //     await this.cardRepository.saveExample({
  //       card_sub: cardSub,
  //       example_text: frontExamples[i],
  //       example_translation: backExamples[i] || frontExamples[i], // fallback
  //       example_order: i + 1,
  //     });
  //   }
  // }

  // private parseReversoHTML(html: string, word: string): ExamplePair[] {
  //   const examples: ExamplePair[] = [];

  //   // Упрощенный парсинг
  //   const exampleSections = html.split('<div class="example">');

  //   for (let i = 1; i < Math.min(exampleSections.length, 11); i++) {
  //     const section = exampleSections[i];

  //     // Ищем исходный текст
  //     const srcStart = section.indexOf('<span class="text"');
  //     if (srcStart === -1) continue;

  //     const srcEnd = section.indexOf('</span>', srcStart);
  //     if (srcEnd === -1) continue;

  //     let source = section.substring(srcStart, srcEnd);
  //     source = source.replace(/<[^>]+>/g, '').trim();

  //     // Ищем перевод
  //     const transStart = section.indexOf('class="translation"');
  //     if (transStart === -1) continue;

  //     const transTextStart = section.indexOf('<span class="text"', transStart);
  //     if (transTextStart === -1) continue;

  //     const transEnd = section.indexOf('</span>', transTextStart);
  //     if (transEnd === -1) continue;

  //     let translation = section.substring(transTextStart, transEnd);
  //     translation = translation.replace(/<[^>]+>/g, '').trim();

  //     if (source && translation && source.toLowerCase().includes(word.toLowerCase())) {
  //       examples.push({
  //         source: this.cleanText(source),
  //         translation: this.cleanText(translation),
  //       });
  //     }
  //   }

  //   return examples;
  // }

  private cleanText(text: string): string {
    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export default new CardService(cardRepository, deskSettingsRepository, userCardSrsRepository);
