/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = async (pgm) => {
  const result = await pgm.db.query(
    `SELECT sub FROM users.profile WHERE email = 'ars@gmail.com'`,
    []
  );

  const userSub = result.rows.map((row) => row.sub)[0];

  const now = new Date();
  const timestamp = now.toISOString();

  const topLevelFolders = [
    { title: 'TED Talks', description: 'TED Talks vocabulary' },
    { title: 'Manga', description: 'Japanese manga vocabulary' },
    { title: 'Topics', description: 'Topic-based vocabulary' },
  ];

  const folderMap = {};

  for (const folderData of topLevelFolders) {
    const sub = generateUUID();
    await pgm.db.query(
      `
      INSERT INTO cards.folder (sub, title, description, creator_sub, created_at)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [sub, folderData.title, folderData.description, userSub, timestamp]
    );

    folderMap[folderData.title] = { sub, parent: null };
  }

  const mangaFolderSub = folderMap['Manga'].sub;

  const confinementKingSub = generateUUID();
  await pgm.db.query(
    `
  INSERT INTO cards.folder (sub, title, description, creator_sub, parent_folder_sub, created_at)
  VALUES ($1, $2, $3, $4, $5, $6)
`,
    [
      confinementKingSub,
      'Confinement King',
      'Vocabulary from the manga "Confinement King"',
      userSub,
      mangaFolderSub,
      timestamp,
    ]
  );

  folderMap['Manga/Confinement King'] = { sub: confinementKingSub, parent: mangaFolderSub };

  const topicsFolderSub = folderMap['Topics'].sub;

  const year2025Sub = generateUUID();
  await pgm.db.query(
    `
    INSERT INTO cards.folder (sub, title, description, creator_sub, parent_folder_sub, created_at)
    VALUES ($1, $2, $3, $4, $5, $6)
  `,
    [year2025Sub, '2025', '2025 topics', userSub, topicsFolderSub, timestamp]
  );

  folderMap['2025'] = { sub: year2025Sub, parent: topicsFolderSub };

  const datesFolderSub = generateUUID();
  await pgm.db.query(
    `
  INSERT INTO cards.folder (sub, title, description, creator_sub, parent_folder_sub, created_at)
  VALUES ($1, $2, $3, $4, $5, $6)
`,
    [
      datesFolderSub,
      'Dates',
      'Vocabulary organized by specific dates',
      userSub,
      year2025Sub,
      timestamp,
    ]
  );

  folderMap['2025/Dates'] = { sub: datesFolderSub, parent: year2025Sub };

  folderMap['2025/Rhetoric'] = { sub: year2025Sub, parent: topicsFolderSub };
  folderMap['2025/Advertising'] = { sub: year2025Sub, parent: topicsFolderSub };

  const months = [
    '7. July',
    '8. August',
    '9. September',
    '10. October',
    '11. November',
    '12. December',
  ];

  for (const month of months) {
    const sub = generateUUID();
    await pgm.db.query(
      `
      INSERT INTO cards.folder (sub, title, creator_sub, parent_folder_sub, created_at)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [sub, month, userSub, datesFolderSub, timestamp]
    );

    folderMap[`2025/Dates/${month}`] = { sub, parent: datesFolderSub };
  }

  const year2026Sub = generateUUID();
  await pgm.db.query(
    `
    INSERT INTO cards.folder (sub, title, description, creator_sub, parent_folder_sub, created_at)
    VALUES ($1, $2, $3, $4, $5, $6)
  `,
    [year2026Sub, '2026', '2026 topics', userSub, topicsFolderSub, timestamp]
  );

  folderMap['2026'] = { sub: year2026Sub, parent: topicsFolderSub };

  folderMap['2026/Feeling Unwell'] = { sub: year2026Sub, parent: topicsFolderSub };
  folderMap['2026/Parts of body'] = { sub: year2026Sub, parent: topicsFolderSub };
  folderMap['2026/Medical Possibilities'] = { sub: year2026Sub, parent: topicsFolderSub };
  folderMap['2026/Eye'] = { sub: year2026Sub, parent: topicsFolderSub };
  folderMap['2026/Medical Advances'] = { sub: year2026Sub, parent: topicsFolderSub };

  const decks = [
    {
      title: '19th July',
      description: 'Vocabulary from July 19th',
      parentFolder: '2025/Dates/7. July',
      public: true,
      cards: generate19thJulyCards(),
    },
    {
      title: 'Advertising',
      description: 'Advertising terms and phrases',
      parentFolder: '2025',
      public: true,
      cards: generateAdvertisingCards(),
    },
    {
      title: 'Rhetoric',
      description: 'Rhetoric terms and phrases',
      parentFolder: '2025',
      public: true,
      cards: generateRhetoricCards(),
    },
    {
      title: '22th July',
      description: 'Vocabulary from July 22th',
      parentFolder: '2025/Dates/7. July',
      public: true,
      cards: generate22thJulyCards(),
    },
    {
      title: '9th August',
      description: 'Vocabulary from August 9th',
      parentFolder: '2025/Dates/8. August',
      public: true,
      cards: generate9thAugustCards(),
    },
    {
      title: '10th-20th September',
      description: 'Vocabulary from September 10th-20th',
      parentFolder: '2025/Dates/9. September',
      public: true,
      cards: generateSeptemberCards(),
    },
    {
      title: '20th-31th October',
      description: 'Vocabulary from October 20th-31th',
      parentFolder: '2025/Dates/10. October',
      public: true,
      cards: generateLateOctoberCards(),
    },
    {
      title: '11th-20th November',
      description: 'Vocabulary from November 11th-20th',
      parentFolder: '2025/Dates/11. November',
      public: true,
      cards: generateNovemberCards(),
    },
    {
      title: 'December',
      description: 'Vocabulary from December',
      parentFolder: '2025/Dates/12. December',
      public: true,
      cards: generateDecemberCards(),
    },
    {
      title: '1-2 Chapters',
      description: 'Vocabulary from first two chapters',
      parentFolder: 'Manga/Confinement King',
      public: true,
      cards: generateMangaCards(),
    },
    {
      title: 'Feeling Unwell',
      description: 'Medical vocabulary and symptoms',
      parentFolder: '2026',
      public: true,
      cards: generateFeelingUnwellCards(),
    },
    {
      title: 'Parts of body',
      description: 'Anatomy and body parts vocabulary',
      parentFolder: '2026',
      public: true,
      cards: generatePartsOfBodyCards(),
    },
    {
      title: 'Medical Possibilities',
      description: 'Medical terminology and treatment concepts',
      parentFolder: '2026',
      public: true,
      cards: generateMedicalPossibilitiesCards(),
    },
    {
      title: 'Eye',
      description: 'Eye anatomy and vision-related vocabulary',
      parentFolder: '2026',
      public: true,
      cards: generateEyeCards(),
    },
    {
      title: 'Medical Advances',
      description: 'Vocabulary about medical innovations and treatments',
      parentFolder: '2026',
      public: true,
      cards: generateMedicalAdvancesCards(),
    },
    {
      title: 'A broken body is not a broken person',
      description: 'TED Talk by Janine Shepherd',
      parentFolder: 'TED Talks',
      public: true,
      cards: generateTEDCards(),
    },
  ];

  const deckMap = {};

  for (const deckData of decks) {
    const deckSub = generateUUID();
    await pgm.db.query(
      `
      INSERT INTO cards.desk (
        sub, title, public, description, creator_sub, 
        created_at, last_time_played
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
      [
        deckSub,
        deckData.title,
        deckData.public,
        deckData.description,
        userSub,
        timestamp,
        timestamp,
      ]
    );

    const folderInfo = folderMap[deckData.parentFolder];
    await pgm.db.query(
      `
      INSERT INTO cards.folder_desk (desk_sub, folder_sub, created_at)
      VALUES ($1, $2, $3)
    `,
      [deckSub, folderInfo.sub, timestamp]
    );

    await pgm.db.query(
      `
      INSERT INTO cards.desk_settings (desk_sub, cards_per_session, card_orientation, created_at)
      VALUES ($1, $2, $3, $4)
    `,
      [deckSub, 10, 'normal', timestamp]
    );

    deckMap[deckData.title] = deckSub;

    for (const cardData of deckData.cards) {
      const cardSub = generateUUID();

      const frontVariants = generateBackVariants(cardData.front);
      const backVariants = generateBackVariants(cardData.back);

      await pgm.db.query(
        `
        INSERT INTO cards.card (
          sub, desk_sub, 
          front_variants, back_variants, created_at, image_uuid, copy_of
        ) VALUES ($1, $2, $3, $4, $5, NULL, NULL)
      `,
        [cardSub, deckSub, JSON.stringify(frontVariants), JSON.stringify(backVariants), timestamp]
      );

      for (const sentence of cardData.examples) {
        await pgm.db.query(
          `
          INSERT INTO cards.card_examples (card_sub, sentence, created_at)
          VALUES ($1, $2, $3)
        `,
          [cardSub, sentence, timestamp]
        );
      }
    }
  }
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = async (pgm) => {
  const result = await pgm.db.query(
    `SELECT sub FROM users.profile WHERE email = 'ars@gmail.com'`,
    []
  );

  const userSub = result.rows.map((row) => row.sub)[0];

  await pgm.db.query('DELETE FROM cards.desk WHERE creator_sub = $1;', [userSub]);
  await pgm.db.query('DELETE FROM cards.folder WHERE creator_sub = $1;', [userSub]);
};

function generateBackVariants(backText) {
  return backText.split(',').map((part) => part.trim());
}

function generate19thJulyCards() {
  return [
    {
      front: 'Inform of',
      back: 'Сообщить о',
      examples: [
        'Please inform me of any changes to the schedule.',
        'The company must inform employees of new policies.',
        'I need to inform you of an important development.',
        'He informed the police of the suspicious activity.',
        'The doctor should inform patients of potential side effects.',
      ],
    },
    {
      front: 'Lead to',
      back: 'Привести к',
      examples: [
        'Poor diet can lead to health problems.',
        'This decision could lead to significant changes.',
        'The investigation led to new discoveries.',
        'His actions led to unexpected consequences.',
        'Technological advances lead to economic growth.',
      ],
    },
    {
      front: 'Specify',
      back: 'Указать',
      examples: [
        'Please specify your requirements in detail.',
        'The contract should specify delivery dates.',
        'Could you specify which model you prefer?',
        "The instructions don't specify how to assemble it.",
        'You need to specify the exact amount required.',
      ],
    },
    {
      front: 'Live up to my expectations',
      back: 'Оправдать мои ожидания',
      examples: [
        "The movie didn't live up to my expectations.",
        'I hope this vacation lives up to my expectations.',
        'The new product really lived up to my expectations.',
        "It's hard to live up to everyone's expectations.",
        'Her performance lived up to all expectations.',
      ],
    },
    {
      front: 'However',
      back: 'Однако, тем не менее',
      examples: [
        "I'd like to go; however, I'm too busy.",
        'The plan sounds good. However, there are risks.',
        'He is very talented. However, he lacks experience.',
        'The weather was bad. However, we enjoyed our trip.',
        'I understand your point. However, I disagree.',
      ],
    },
    {
      front: 'Consider',
      back: 'Рассматривать',
      examples: [
        'We need to consider all options before deciding.',
        "I'm considering applying for that job.",
        'The court will consider the evidence carefully.',
        'Have you considered moving to another city?',
        'We must consider the environmental impact.',
      ],
    },
    {
      front: 'Lend',
      back: 'Одолжить',
      examples: [
        'Can you lend me some money until Friday?',
        'The library lends books for two weeks.',
        "I'll lend you my car for the weekend.",
        'Banks lend money to businesses for expansion.',
        'Could you lend me a hand with this heavy box?',
      ],
    },
    {
      front: 'Head back',
      back: 'Вернуться',
      examples: [
        'We should head back before it gets dark.',
        'After the meeting, I headed back to the office.',
        "It's time to head back home.",
        'The tourists headed back to their hotel.',
        'He headed back to his hometown after graduation.',
      ],
    },
    {
      front: 'Overcome',
      back: 'Преодолеть',
      examples: [
        'She overcame many obstacles to succeed.',
        'We must overcome these challenges together.',
        'He overcame his fear of public speaking.',
        'The team overcame a 3-point deficit to win.',
        'New technology helps overcome language barriers.',
      ],
    },
    {
      front: 'Attract',
      back: 'Привлекать',
      examples: [
        "The bright colors attract customers' attention.",
        'The company wants to attract young professionals.',
        'Flowers attract bees with their scent.',
        'The new policy aims to attract foreign investment.',
        'The museum attracts thousands of visitors yearly.',
      ],
    },
    {
      front: 'Meaningful',
      back: 'Значимый',
      examples: [
        'They had a meaningful conversation about the future.',
        'The donation will make a meaningful difference.',
        'She finds her work meaningful and rewarding.',
        'We need meaningful data to make decisions.',
        'The ceremony was a meaningful experience for everyone.',
      ],
    },
    {
      front: 'Sweep',
      back: 'Подметать',
      examples: [
        'I need to sweep the kitchen floor.',
        'The janitor sweeps the hallway every morning.',
        'She swept the leaves from the patio.',
        'A new trend is sweeping the nation.',
        'The storm swept across the coastal area.',
      ],
    },
    {
      front: 'Moreover, on top of something',
      back: 'Более того',
      examples: [
        'The price is reasonable. Moreover, the quality is excellent.',
        "He's intelligent and, moreover, very hardworking.",
        "The car is fuel-efficient. Moreover, it's environmentally friendly.",
        'She completed the project on time. Moreover, she exceeded expectations.',
        "The hotel has great amenities. Moreover, it's in a perfect location.",
      ],
    },
    {
      front: 'Take off',
      back: 'Взлетать, снять',
      examples: [
        'The plane will take off in 20 minutes.',
        'Please take off your shoes before entering.',
        'Her career really took off after that success.',
        'He took off his jacket because it was warm.',
        "The product didn't take off as expected.",
      ],
    },
    {
      front: 'Vote for',
      back: 'Голосовать за',
      examples: [
        "I'm going to vote for the incumbent mayor.",
        'Who did you vote for in the last election?',
        'The committee voted for the proposed changes.',
        'We should vote for candidates who represent our values.',
        'The shareholders voted for the new board members.',
      ],
    },
    {
      front: 'Numerous',
      back: 'Многочисленный',
      examples: [
        'She has received numerous awards for her work.',
        'There are numerous reasons for this decision.',
        'The book contains numerous illustrations.',
        'We faced numerous challenges during the project.',
        'Numerous studies support this conclusion.',
      ],
    },
    {
      front: 'Invest',
      back: 'Вложить',
      examples: [
        'They decided to invest in the stock market.',
        'The company will invest $1 million in new equipment.',
        "It's important to invest in your education.",
        'He invested all his savings in the business.',
        'We should invest more time in planning.',
      ],
    },
    {
      front: 'Look after',
      back: 'Следить за, заботиться',
      examples: [
        "Can you look after my cat while I'm away?",
        'Parents must look after their children.',
        'She looks after her elderly grandmother.',
        'We need someone to look after the details.',
        'The manager looks after day-to-day operations.',
      ],
    },
    {
      front: 'Guarantee',
      back: 'Гарантировать',
      examples: [
        'We guarantee satisfaction or your money back.',
        'The product comes with a one-year guarantee.',
        "I can't guarantee that it will work perfectly.",
        'Success is never guaranteed in business.',
        'The warranty guarantees free repairs for two years.',
      ],
    },
    {
      front: 'Versatile',
      back: 'Универсальный',
      examples: [
        'This tool is versatile and has many uses.',
        "She's a versatile actress who can play any role.",
        'The material is versatile enough for various applications.',
        'A smartphone is a versatile device.',
        "He's a versatile musician who plays multiple instruments.",
      ],
    },
    {
      front: 'Pretend',
      back: 'Притворяться',
      examples: [
        'Children often pretend to be superheroes.',
        "Don't pretend you don't know what happened.",
        'He pretended to be interested in the conversation.',
        'She pretended everything was fine.',
        "You can't just pretend the problem doesn't exist.",
      ],
    },
  ];
}

function generateAdvertisingCards() {
  return [
    {
      front: 'Consistent',
      back: 'стабильный',
      examples: [
        'The brand needs consistent messaging across all platforms.',
        'Her performance has been consistently excellent.',
        'We aim for consistent quality in all our products.',
        'Consistent branding helps build customer recognition.',
        'The team showed consistent improvement throughout the season.',
      ],
    },
    {
      front: 'Cut',
      back: 'Доля',
      examples: [
        'The company wants a larger cut of the market.',
        'Agents typically take a 10% cut of sales.',
        'Everyone wants their fair cut of the profits.',
        'Our cut of the revenue has increased this quarter.',
        'The distributor gets a significant cut of each sale.',
      ],
    },
    {
      front: "On one's behalf",
      back: 'в чьих-либо интересах',
      examples: [
        'The lawyer spoke on behalf of her client.',
        "I'm writing this letter on behalf of the committee.",
        'She accepted the award on behalf of the team.',
        "We're acting on behalf of all stakeholders.",
        'The union negotiated on behalf of its members.',
      ],
    },
    {
      front: 'Statistician',
      back: 'статистик',
      examples: [
        'The statistician analyzed the market research data.',
        'We hired a statistician to validate our findings.',
        'A good statistician can interpret complex data sets.',
        'The statistician presented the survey results.',
        'She works as a statistician for a research firm.',
      ],
    },
    {
      front: "Let's go big",
      back: 'Давайте играть по-крупному',
      examples: [
        "For this campaign, let's go big or go home.",
        "We have a limited budget, but let's go big with our ideas.",
        "Instead of small changes, let's go big with a complete rebranding.",
        'The CEO said, "Let\'s go big with this product launch."',
        "Our competitors are playing safe, so let's go big and stand out.",
      ],
    },
    {
      front: 'Golden nugget',
      back: 'Золотой самородок',
      examples: [
        'That marketing insight was a real golden nugget.',
        'Every presentation should contain at least one golden nugget.',
        'The research revealed several golden nuggets of information.',
        'His advice was a golden nugget that transformed our strategy.',
        "We're always searching for those golden nuggets of customer insight.",
      ],
    },
    {
      front: 'Let that sink in',
      back: 'осознайте это',
      examples: [
        'Our market share increased by 200% - let that sink in.',
        'This product could change the industry. Let that sink in.',
        'We have one million followers. Let that sink in for a moment.',
        'The potential is enormous. I want you to let that sink in.',
        'Our reach is global now. Let that sink in and think about the possibilities.',
      ],
    },
    {
      front: 'To backpedal',
      back: 'отступать, тормозить',
      examples: [
        'The company had to backpedal on its controversial ad campaign.',
        'After negative feedback, they started to backpedal on their claims.',
        'Politicians often backpedal when faced with public criticism.',
        "Don't backpedal now - we need to stay committed to this direction.",
        'The CEO was forced to backpedal on the promised changes.',
      ],
    },
    {
      front: "To tug one's heartstrings",
      back: 'трогать за душу',
      examples: [
        'The commercial tugs at your heartstrings with its emotional story.',
        'Great advertising should tug at the heartstrings while delivering the message.',
        "The charity campaign was designed to tug at people's heartstrings.",
        'Her speech about childhood dreams really tugged at my heartstrings.',
        'The most memorable ads are those that tug at your heartstrings.',
      ],
    },
    {
      front: 'Mean',
      back: 'подлый',
      examples: [
        'That was a mean thing to say about the competition.',
        "Don't be mean - constructive criticism is more helpful.",
        'Some ads use mean-spirited humor that backfires.',
        "It's mean to mock people's mistakes in advertising.",
        'Successful brands avoid being mean to their customers.',
      ],
    },
    {
      front: 'The game was afoot',
      back: 'игра началась',
      examples: [
        'With the new product launch, the game was afoot in our industry.',
        'When the competitors responded, we knew the game was afoot.',
        'The game was afoot as agencies pitched for the big contract.',
        'With the holiday season approaching, the advertising game was afoot.',
        'Once the merger was announced, the game was afoot for market dominance.',
      ],
    },
    {
      front: 'To hover',
      back: 'Нависать, застывать',
      examples: [
        'Uncertainty continues to hover over the market.',
        'The deadline was hovering over the team all week.',
        'A sense of anticipation hovered in the air before the launch.',
        'Competition always hovers in the background of our planning.',
        'Economic concerns hover over all business decisions.',
      ],
    },
    {
      front: 'At last ...',
      back: 'Наконец ...',
      examples: [
        'At last, we have a solution to this persistent problem.',
        'After months of development, at last the product is ready.',
        'At last, research confirms what we suspected all along.',
        'The wait is over - at last, innovation meets affordability.',
        'At last, a service that truly understands customer needs.',
      ],
    },
    {
      front: 'Correspondence',
      back: 'Переписка',
      examples: [
        'All official correspondence should use company letterhead.',
        'We keep records of all customer correspondence.',
        'The email correspondence revealed important details.',
        'Business correspondence requires proper formatting.',
        'Our correspondence with the client has been productive.',
      ],
    },
    {
      front: 'Vulnerable',
      back: 'уязвимый',
      examples: [
        'The data breach left customers feeling vulnerable.',
        'Startups are vulnerable in their first year of operation.',
        'Our strategy has some vulnerable points we need to address.',
        'The campaign targeted vulnerable consumer segments.',
        'Without proper protection, brands are vulnerable to criticism.',
      ],
    },
    {
      front: 'To get out of hand',
      back: 'выйти из-под контроля',
      examples: [
        'The social media campaign got out of hand quickly.',
        'Costs can get out of hand without proper budgeting.',
        'What started as a small promotion got completely out of hand.',
        'The situation got out of hand when competitors joined in.',
        "We need controls to ensure things don't get out of hand.",
      ],
    },
    {
      front: 'To comply with something',
      back: 'Соблюдать что-либо, подчиниться чему-либо',
      examples: [
        'All ads must comply with advertising standards.',
        'The company complies with international regulations.',
        'We need to comply with the new data protection laws.',
        'Failure to comply with requirements can result in fines.',
        'Our processes comply with industry best practices.',
      ],
    },
    {
      front: 'To concoct a plan',
      back: 'разработать план',
      examples: [
        'The marketing team concocted an innovative launch plan.',
        'We need to concoct a plan to regain market share.',
        'They concocted an elaborate plan for the product reveal.',
        'The agency concocted a brilliant campaign strategy.',
        "Let's concoct a plan that surprises our competitors.",
      ],
    },
    {
      front: 'To knock it on the head',
      back: 'положить конец',
      examples: [
        'We need to knock these rumors on the head immediately.',
        'The bad publicity could knock our progress on the head.',
        "Let's knock this problem on the head before it grows.",
        'The new policy should knock unnecessary delays on the head.',
        "We knocked the competition's advantage on the head with our innovation.",
      ],
    },
    {
      front: 'Board meeting',
      back: 'заседание правления',
      examples: [
        'The quarterly board meeting will review our marketing performance.',
        'Important decisions are made during board meetings.',
        'The marketing director presents to the board meeting monthly.',
        'The upcoming board meeting will discuss the new advertising budget.',
        'Board meetings determine the strategic direction of the company.',
      ],
    },
    {
      front: 'Real estate',
      back: 'Недвижимость',
      examples: [
        'The company owns valuable real estate in prime locations.',
        'Real estate advertising requires specific strategies.',
        'Commercial real estate markets are currently booming.',
        'The real estate section of the newspaper is popular.',
        'Digital real estate (websites) is just as valuable as physical property.',
      ],
    },
  ];
}

function generateRhetoricCards() {
  return [
    {
      front: 'To rally people for peace',
      back: 'Объединять людей во имя мира',
      examples: [
        'The leader tried to rally people for peace during the conflict.',
        'Organizations work to rally people for peace through dialogue.',
        'Her speech aimed to rally people for peace and understanding.',
        'We must rally people for peace instead of promoting division.',
        'The concert was organized to rally people for peace in the region.',
      ],
    },
    {
      front: 'Credibility',
      back: 'Достоверность, Надёжность',
      examples: [
        'The witness lost credibility when his story changed.',
        'Academic research requires credibility through proper citations.',
        "A company's credibility affects customer trust and loyalty.",
        'Journalists must maintain credibility with accurate reporting.',
        'His years of experience gave him credibility in the field.',
      ],
    },
    {
      front: 'urge',
      back: 'побуждать, призывать',
      examples: [
        'I urge you to reconsider this decision carefully.',
        'The doctor will urge patients to quit smoking.',
        'We urge everyone to participate in the community cleanup.',
        'He felt a sudden urge to travel and see the world.',
        'The organization will urge lawmakers to pass the bill.',
      ],
    },
    {
      front: 'Inherently',
      back: 'По своей природе, Изначально',
      examples: [
        'Humans are inherently social creatures.',
        'The process is inherently risky but potentially rewarding.',
        'Some technologies are inherently disruptive to traditional industries.',
        'Democracy is inherently messy but valuable.',
        'The material is inherently flammable and requires careful handling.',
      ],
    },
    {
      front: 'Debunked claim',
      back: 'Опровергнутое утверждение',
      examples: [
        'The debunked claim about vaccines continues to circulate online.',
        'Scientists have published evidence against this debunked claim.',
        'We need to counter debunked claims with factual information.',
        'The article repeats a debunked claim from years ago.',
        'Educational campaigns aim to correct debunked claims.',
      ],
    },
    {
      front: 'Virtue',
      back: 'Добродетель',
      examples: [
        'Honesty is considered a fundamental virtue in many cultures.',
        'Patience is a virtue that develops with practice.',
        'Ancient philosophers wrote extensively about virtue and ethics.',
        'She believed in the virtue of hard work and perseverance.',
        'The story teaches the virtue of kindness to strangers.',
      ],
    },
    {
      front: 'To incite to war',
      back: 'Подстрекать к войне',
      examples: [
        'Propaganda was used to incite to war among the population.',
        'Leaders who incite to war bear great responsibility.',
        'The speech seemed designed to incite to war rather than peace.',
        'Historians study how media can incite to war.',
        'International law prohibits actions that incite to war.',
      ],
    },
    {
      front: 'engage in',
      back: 'участвовать в',
      examples: [
        'Students should engage in class discussions actively.',
        'The countries agreed to engage in diplomatic talks.',
        "It's unhealthy to engage in constant self-criticism.",
        'The company will engage in new markets next year.',
        'They decided to engage in volunteer work on weekends.',
      ],
    },
    {
      front: 'engage',
      back: 'вовлекать',
      examples: [
        'Teachers must engage students with interesting materials.',
        'The book failed to engage my attention after the first chapter.',
        'We need to engage community members in the planning process.',
        'The gears engage smoothly in this mechanism.',
        'He tried to engage her in conversation about art.',
      ],
    },
    {
      front: 'provoke',
      back: 'провоцировать',
      examples: [
        'His comments were meant to provoke a reaction from the audience.',
        "Don't provoke the dog by waving food in front of it.",
        'The policy change could provoke protests from residents.',
        'Some artists aim to provoke thought with controversial works.',
        'Her question was designed to provoke deeper discussion.',
      ],
    },
  ];
}

function generate22thJulyCards() {
  return [
    {
      front: 'Circumstances',
      back: 'Обстоятельства',
      examples: [
        'Under normal circumstances, this would be easy.',
        'Due to unforeseen circumstances, the event is canceled.',
        'We must adapt to changing circumstances.',
        'The circumstances of his death remain unclear.',
        'Given the current circumstances, we need to act carefully.',
      ],
    },
    {
      front: 'Encouragement',
      back: 'Поощрение',
      examples: [
        "Her teacher's encouragement helped her succeed.",
        'Words of encouragement can make a big difference.',
        'The team needs encouragement after the loss.',
        'Parental encouragement is crucial for child development.',
        'He gave me the encouragement I needed to continue.',
      ],
    },
    {
      front: 'Hostage',
      back: 'Заложник',
      examples: [
        'The hostages were released after negotiations.',
        'He was held hostage for three days.',
        'The bank robbers took several hostages.',
        "Don't feel like a hostage to your circumstances.",
        'The hostage situation ended peacefully.',
      ],
    },
    {
      front: 'Frequently',
      back: 'Часто',
      examples: [
        'I frequently visit my grandmother on weekends.',
        'This error occurs frequently in the system.',
        'She frequently travels for business.',
        "He's frequently late for meetings.",
        'Questions about this topic are frequently asked.',
      ],
    },
    {
      front: 'Participate',
      back: 'Участвовать',
      examples: [
        'Everyone is invited to participate in the discussion.',
        'Students must participate in class activities.',
        "I'd like to participate in the marathon.",
        'The company participates in community events.',
        'To participate, you need to register first.',
      ],
    },
    {
      front: 'Accurate',
      back: 'Точный',
      examples: [
        'The report needs to be accurate and complete.',
        'Is this measurement accurate enough?',
        'His prediction was surprisingly accurate.',
        'We need accurate data for the analysis.',
        'The translation must be accurate for legal documents.',
      ],
    },
    {
      front: 'Essential',
      back: 'Существенный',
      examples: [
        'Water is essential for life.',
        'Good communication is essential in a team.',
        'These documents are essential for the application.',
        'Sleep is essential for good health.',
        'The essential details were missing from the report.',
      ],
    },
  ];
}

function generate9thAugustCards() {
  return [
    {
      front: 'speed bump',
      back: 'лежачий полицейский',
      examples: [
        "There's a speed bump on our street to slow down cars.",
        'The new speed bumps have reduced accidents in the area.',
        'I always slow down when I see a speed bump ahead.',
        'Speed bumps are common in residential neighborhoods.',
        "The car's suspension was damaged by hitting a speed bump too fast.",
      ],
    },
    {
      front: 'pass by',
      back: 'проходить мимо',
      examples: [
        'I pass by that coffee shop every morning on my way to work.',
        "Time seems to pass by so quickly when you're having fun.",
        "Don't just pass by - stop and say hello!",
        "The opportunity might pass by if you don't act quickly.",
        'I watched the parade pass by from my window.',
      ],
    },
    {
      front: 'shortly, soon',
      back: 'скоро',
      examples: [
        'The meeting will begin shortly - please take your seats.',
        "I'll be there soon, just finishing up some work.",
        'The results will be announced shortly after the exam.',
        'We should hear from them soon about the job offer.',
        'The train will depart shortly from platform three.',
      ],
    },
    {
      front: 'swell',
      back: 'набухать, увеличиваться, расти',
      examples: [
        'Her ankle started to swell after the injury.',
        'The river swells during the rainy season.',
        'My pride swelled when I saw my child perform.',
        'The population continues to swell in urban areas.',
        'The music swelled to a dramatic crescendo.',
      ],
    },
    {
      front: 'accuse him of',
      back: 'обвинять в',
      examples: [
        'They accuse him of stealing company secrets.',
        "You can't accuse him of negligence without evidence.",
        'The prosecutor will accuse him of fraud in court.',
        'Why would you accuse him of such a terrible thing?',
        'She was wrongly accused him of damaging the property.',
      ],
    },
    {
      front: 'sorrow',
      back: 'печаль',
      examples: [
        'Her face showed deep sorrow at the news.',
        "He expressed his sorrow for the family's loss.",
        'Time can heal even the deepest sorrow.',
        'The music conveyed a sense of profound sorrow.',
        'Shared sorrow is easier to bear than solitary grief.',
      ],
    },
    {
      front: 'be certain',
      back: 'быть уверенным',
      examples: [
        'I need to be certain before making this decision.',
        'Can you be certain that this information is correct?',
        'He wanted to be certain of her feelings before proposing.',
        "You can be certain that we'll complete the project on time.",
        "I'm not certain, but I think the meeting is at 3 PM.",
      ],
    },
    {
      front: 'closely',
      back: 'внимательно, тщательно, тесно',
      examples: [
        'Watch closely how I do this procedure.',
        'The two companies are closely connected.',
        'Read the instructions closely before starting.',
        'They work closely together on research projects.',
        'The police are monitoring the situation closely.',
      ],
    },
    {
      front: 'presume',
      back: 'полагать, предполагать',
      examples: [
        "I presume you've already heard the news.",
        'We should not presume to know what others are thinking.',
        'The law presumes innocence until guilt is proven.',
        "May I presume that you'll be attending the conference?",
        "Don't presume that everyone agrees with your opinion.",
      ],
    },
    {
      front: 'schedule the appointment',
      back: 'назначить встречу',
      examples: [
        'Please schedule the appointment for next Tuesday.',
        'I need to schedule the appointment with my dentist.',
        'You can schedule the appointment online or by phone.',
        "Let's schedule the appointment for early morning.",
        'She asked her assistant to schedule the appointment.',
      ],
    },
    {
      front: 'out of order',
      back: 'выйти из строя, не в рабочем состоянии',
      examples: [
        'The elevator is out of order - please use the stairs.',
        'Half the machines in the gym are out of order.',
        'The phone line seems to be out of order.',
        'Sorry, this restroom is temporarily out of order.',
        'The vending machine has been out of order for weeks.',
      ],
    },
    {
      front: 'landlord',
      back: 'домовладелец',
      examples: [
        'Our landlord is very responsive to repair requests.',
        'The landlord raised the rent by 10% this year.',
        'You need to notify your landlord 30 days before moving.',
        'The landlord is responsible for maintaining the property.',
        'We have a good relationship with our landlord.',
      ],
    },
    {
      front: 'Save up the money',
      back: 'копить',
      examples: [
        "I'm trying to save up the money for a new car.",
        'It took me two years to save up the money for this trip.',
        'She saved up the money by working extra hours.',
        'We need to save up the money for the down payment.',
        'He finally saved up the money to start his own business.',
      ],
    },
    {
      front: 'take a pill for allergies',
      back: 'выпить таблетку от аллергии',
      examples: [
        'I need to take a pill for allergies before going outside.',
        "Don't forget to take a pill for allergies in spring.",
        'She takes a pill for allergies every morning.',
        'The doctor recommended I take a pill for allergies daily.',
        'Taking a pill for allergies helps me sleep better at night.',
      ],
    },
    {
      front: 'tidy',
      back: 'Аккуратный, опрятный',
      examples: [
        'Keep your workspace tidy for better productivity.',
        'She always keeps her apartment incredibly tidy.',
        'The children were asked to keep their rooms tidy.',
        'A tidy desk is a sign of a tidy mind.',
        'He made a tidy profit from the investment.',
      ],
    },
    {
      front: "I'm passionate about",
      back: 'я увлечен',
      examples: [
        "I'm passionate about environmental conservation.",
        "She's passionate about helping underprivileged children.",
        "He's passionate about classic car restoration.",
        "I'm passionate about learning new languages.",
        "We're passionate about creating innovative solutions.",
      ],
    },
    {
      front: 'tremble, twitch',
      back: 'дергаться, подергивание',
      examples: [
        'His hands would tremble when he was nervous.',
        'I felt my eye twitch from stress and fatigue.',
        'The leaves tremble in the gentle breeze.',
        'A muscle in her cheek began to twitch uncontrollably.',
        'The ground started to tremble during the earthquake.',
      ],
    },
    {
      front: 'to involve',
      back: 'вовлекать',
      examples: [
        'This project will involve multiple departments.',
        'The job involves traveling to different countries.',
        'We want to involve community members in the planning.',
        "The accident didn't involve any other vehicles.",
        'Solving this problem will involve creative thinking.',
      ],
    },
    {
      front: 'clutch',
      back: 'сцепление',
      examples: [
        'Press the clutch before changing gears in a manual car.',
        'The clutch needs to be replaced in my vehicle.',
        'He released the clutch slowly as he accelerated.',
        'She kept a tight clutch on her purse in the crowd.',
        'The company was in the clutch of financial difficulties.',
      ],
    },
    {
      front: 'the jury is listening to the trial',
      back: 'присяжные слушают судебный процесс',
      examples: [
        'The jury is listening to the trial with great attention.',
        'Right now, the jury is listening to the expert witness.',
        'While the jury is listening to the trial, they cannot discuss it.',
        'The jury is listening to the trial to reach a fair verdict.',
        'As the jury is listening to the trial, they take careful notes.',
      ],
    },
    {
      front: 'aptitude for',
      back: 'предрасположенность к, способность к',
      examples: [
        'She has a natural aptitude for mathematics.',
        'The test measures your aptitude for mechanical reasoning.',
        'He showed an early aptitude for music.',
        'Not everyone has an aptitude for learning languages.',
        'The program looks for students with an aptitude for science.',
      ],
    },
    {
      front: 'he was raised by his sister',
      back: 'он был воспитан сестрой',
      examples: [
        'After their parents died, he was raised by his sister.',
        'He was raised by his sister who was only ten years older.',
        'Although orphaned young, he was raised by his sister lovingly.',
        'He was raised by his sister in a small apartment in the city.',
        'The values he has today come from being raised by his sister.',
      ],
    },
    {
      front: 'make an agreement',
      back: 'договориться',
      examples: [
        'We need to make an agreement before starting the project.',
        'The two companies made an agreement to collaborate.',
        "Let's make an agreement to meet once a month.",
        'They made an agreement to share the costs equally.',
        "It's important to make an agreement in writing.",
      ],
    },
  ];
}

function generateSeptemberCards() {
  return [
    {
      front: 'Take into consideration',
      back: 'Принимать во внимание',
      examples: [
        'We need to take into consideration all possible risks.',
        'The committee will take into consideration your suggestions.',
        'When planning the project, take into consideration the budget constraints.',
        'Take into consideration that some team members may be unavailable.',
        "The judge will take into consideration the defendant's previous record.",
      ],
    },
    {
      front: 'Take into account',
      back: 'Принять во внимание',
      examples: [
        'You must take into account the time required for travel.',
        'The design takes into account accessibility requirements.',
        'Take into account that prices may increase next quarter.',
        'We should take into account customer feedback before launching.',
        'The analysis failed to take into account seasonal variations.',
      ],
    },
    {
      front: 'Superhero flick',
      back: 'Фильм о супергероях',
      examples: [
        'The latest superhero flick broke box office records.',
        'My kids love watching superhero flicks on weekends.',
        'The studio is producing another superhero flick for summer release.',
        'That superhero flick had amazing special effects.',
        "I'm not really into superhero flicks - I prefer dramas.",
      ],
    },
    {
      front: "It's thought that",
      back: 'Считается что',
      examples: [
        "It's thought that regular exercise improves mental health.",
        "It's thought that the ancient civilization disappeared around 1000 BC.",
        "It's thought that she will be promoted to director next month.",
        "It's thought that the company will announce merger news soon.",
        "It's thought that drinking green tea has health benefits.",
      ],
    },
    {
      front: "It's assumed that",
      back: 'Предполагается, что',
      examples: [
        "It's assumed that all participants have basic computer skills.",
        "It's assumed that the contract will be signed by Friday.",
        "It's assumed that the new policy will reduce costs by 15%.",
        "It's assumed that he will be the next team leader.",
        "It's assumed that the meeting will last about two hours.",
      ],
    },
  ];
}

function generateLateOctoberCards() {
  return [
    {
      front: 'out of shape',
      back: 'не в форме',
      examples: [
        "After months without exercise, I'm completely out of shape.",
        'He felt out of shape after recovering from his illness.',
        'The athlete was out of shape at the beginning of the season.',
        "Don't start with intense workouts if you're out of shape.",
        'Being out of shape makes everyday activities more difficult.',
      ],
    },
    {
      front: 'nurture',
      back: 'воспитывать',
      examples: [
        "Parents should nurture their children's talents and interests.",
        'The program aims to nurture young entrepreneurs.',
        'Good leaders nurture talent within their organizations.',
        'It takes time to nurture a successful business relationship.',
        "Teachers play a crucial role in nurturing students' curiosity.",
      ],
    },
    {
      front: 'vulnerable',
      back: 'уязвимый',
      examples: [
        'Elderly people are particularly vulnerable during heatwaves.',
        'The system is vulnerable to cyber attacks without proper security.',
        'Children are vulnerable and need protection from harm.',
        'He felt vulnerable sharing his personal story with strangers.',
        'Coastal cities are vulnerable to rising sea levels.',
      ],
    },
    {
      front: "He's fond of her",
      back: 'Он любит ее, Он привязан к ней',
      examples: [
        "Although they just met, he's fond of her already.",
        "He's fond of her, but he hasn't told her how he feels.",
        "Everyone can see he's fond of her by how he looks at her.",
        "He's fond of her despite their occasional disagreements.",
        "He's fond of her in a brotherly way, not romantically.",
      ],
    },
    {
      front: 'conclude',
      back: 'заключать, делать выводы',
      examples: [
        'Based on the evidence, we can conclude that the theory is correct.',
        'The investigation will conclude by the end of the month.',
        "I'd like to conclude my presentation with a call to action.",
        'What did you conclude from your research findings?',
        'The meeting will conclude with a question and answer session.',
      ],
    },
    {
      front: 'assess',
      back: 'оценивать',
      examples: [
        "Teachers need to assess students' progress regularly.",
        'The doctor will assess your condition before prescribing treatment.',
        'We must assess the risks before making an investment.',
        'The committee will assess all applications fairly.',
        "It's difficult to assess the true impact of the policy change.",
      ],
    },
    {
      front: 'vulnerability',
      back: 'уязвимость',
      examples: [
        'The software update fixes a security vulnerability.',
        'Sharing his fears showed a moment of vulnerability.',
        'Climate change exposes the vulnerability of coastal communities.',
        'The report identifies several vulnerabilities in the system.',
        'Her vulnerability made her story more relatable to the audience.',
      ],
    },
    {
      front: 'heredity',
      back: 'наследственность',
      examples: [
        'Some diseases are influenced by heredity and environment.',
        'Genetic research has advanced our understanding of heredity.',
        'Heredity plays a role in determining physical characteristics.',
        'The study examines the heredity of artistic talent.',
        'Modern science explores how heredity affects health outcomes.',
      ],
    },
    {
      front: 'in shape',
      back: 'в форме, подтянутый',
      examples: [
        "After six months of training, he's finally in shape.",
        'Athletes need to stay in shape throughout the season.',
        'She works out daily to keep in shape.',
        'The team needs to be in shape for the upcoming tournament.',
        'Being in shape improves both physical and mental health.',
      ],
    },
    {
      front: 'indistinguishable',
      back: 'неразличимый',
      examples: [
        'The counterfeit bills were almost indistinguishable from real ones.',
        'The twins were indistinguishable to most people.',
        'The artificial flavor is indistinguishable from the natural one.',
        'At that distance, the two objects were indistinguishable.',
        'The copy was so good it was indistinguishable from the original.',
      ],
    },
    {
      front: 'absorb',
      back: 'поглощать',
      examples: [
        'Plants absorb carbon dioxide during photosynthesis.',
        'The sponge can absorb a large amount of liquid.',
        'It takes time to absorb complex information.',
        'The company was absorbed by a larger competitor.',
        'Dark colors absorb more heat than light colors.',
      ],
    },
    {
      front: 'concern',
      back: 'беспокойство',
      examples: [
        'There is growing concern about climate change among scientists.',
        "Her main concern is her children's education.",
        'The safety issue raised serious concern among employees.',
        "I appreciate your concern, but I'm fine.",
        'Environmental concerns are affecting consumer choices.',
      ],
    },
    {
      front: 'intelligent',
      back: 'умный',
      examples: [
        "She's one of the most intelligent people I've ever met.",
        'Intelligent design can solve complex problems efficiently.',
        'The software uses intelligent algorithms to predict user behavior.',
        'He gave an intelligent response to the difficult question.',
        'Intelligent systems are transforming many industries.',
      ],
    },
  ];
}

function generateNovemberCards() {
  return [
    {
      front: 'complimentary',
      back: 'любезный',
      examples: [
        'The hotel offers complimentary breakfast to all guests.',
        'She received complimentary remarks about her presentation.',
        'Complimentary tickets were given to the first 50 customers.',
        'His complimentary attitude made everyone feel welcome.',
        'The restaurant provides complimentary bread before the meal.',
      ],
    },
    {
      front: 'make a point',
      back: 'высказать мысль',
      examples: [
        'I want to make a point about the importance of teamwork.',
        'She always makes a point of arriving early for meetings.',
        'Let me make a point clear: this is not negotiable.',
        'He made several good points during the discussion.',
        "I'd like to make a point regarding the budget allocation.",
      ],
    },
    {
      front: 'connect online',
      back: 'связываться онлайн',
      examples: [
        'Many people connect online through social media platforms.',
        'The app helps users connect online with shared interests.',
        'During the pandemic, families learned to connect online.',
        'Business professionals often connect online via LinkedIn.',
        'Students can connect online with tutors for extra help.',
      ],
    },
    {
      front: 'an intension',
      back: 'намерение',
      examples: [
        'His intension was to help, not to interfere.',
        'I have no intension of changing jobs at this time.',
        'The letter was written with good intension.',
        'What was your intension when you made that comment?',
        'Her intension to finish the project early was clear.',
      ],
    },
    {
      front: 'face-to-face conversation',
      back: 'личная беседа',
      examples: [
        'Nothing replaces a good face-to-face conversation.',
        'We need to have a face-to-face conversation about this issue.',
        'Face-to-face conversation helps build stronger relationships.',
        'The manager prefers face-to-face conversation over emails.',
        'Some topics are better discussed in face-to-face conversation.',
      ],
    },
    {
      front: 'back-handed compliment',
      back: 'комплимент с подвохом, двусмысленный или оскорбительный комплимент, который содержит скрытую обиду, сарказм или унижение',
      examples: [
        'Calling someone "smart for their age" is a back-handed compliment.',
        'She gave him a back-handed compliment about his "surprisingly good" work.',
        'Back-handed compliments often leave people feeling confused or insulted.',
        '"You look great today - unlike yesterday" is a classic back-handed compliment.',
        "He has a habit of giving back-handed compliments that sound like praise but aren't.",
      ],
    },
    {
      front: 'face-to-face skills',
      back: 'навыки личного общения',
      examples: [
        'Good face-to-face skills are essential for customer service jobs.',
        'The workshop focuses on developing face-to-face skills.',
        'In the digital age, face-to-face skills are becoming rarer.',
        'His excellent face-to-face skills make him a great negotiator.',
        'Face-to-face skills include reading body language and maintaining eye contact.',
      ],
    },
    {
      front: 'make connections',
      back: 'заводить связи',
      examples: [
        'Networking events help professionals make connections.',
        "It's important to make connections in your industry.",
        'She has a natural ability to make connections with people.',
        'The program helps students make connections with alumni.',
        'Making connections can lead to career opportunities.',
      ],
    },
    {
      front: 'have a chat',
      back: 'поболтать',
      examples: [
        "Let's have a chat over coffee sometime this week.",
        'I saw my neighbor and we had a quick chat about the weather.',
        'Having a chat with friends is a great way to relax.',
        'Can we have a chat about the project progress?',
        'They had a pleasant chat while waiting for the meeting.',
      ],
    },
    {
      front: 'intend to',
      back: 'намереваться',
      examples: [
        'I intend to finish the report by Friday.',
        'Do you intend to apply for the promotion?',
        'We intend to launch the product next quarter.',
        'She intends to travel around Europe next summer.',
        'The company intends to expand into Asian markets.',
      ],
    },
    {
      front: 'to put (someone) off (doing something)',
      back: 'отговорить сделать что-то',
      examples: [
        'The bad weather put us off going to the beach.',
        "Don't let one failure put you off trying again.",
        'His negative comments almost put me off applying for the job.',
        'The high price put many customers off buying the product.',
        'Nothing could put her off pursuing her dream career.',
      ],
    },
    {
      front: 'flatter',
      back: 'льстить',
      examples: [
        'You flatter me with your kind words about my work.',
        'Some people flatter their bosses to get promotions.',
        'The dress really flatters your figure.',
        "I'm not trying to flatter you - I mean what I say.",
        'Photographers know how to flatter their subjects with good lighting.',
      ],
    },
    {
      front: 'connect on social media',
      back: 'связываться в соцсетях',
      examples: [
        'Many old friends reconnect on social media.',
        "It's common to connect on social media after meeting someone.",
        'Brands connect on social media with their customers directly.',
        "Let's connect on social media to stay in touch.",
        'Professionals often connect on social media like LinkedIn.',
      ],
    },
    {
      front: 'to wax lyrical',
      back: 'говорить о чём-то восторженно, с чувством, поэтично, очень комплиментарно',
      examples: [
        'He began to wax lyrical about his trip to Italy.',
        'Food critics often wax lyrical about exceptional restaurants.',
        "She waxed lyrical about her grandmother's cooking.",
        'The author waxes lyrical about nature throughout the book.',
        'Whenever he talks about jazz, he waxes lyrical.',
      ],
    },
    {
      front: 'pay tribute',
      back: 'отдавать дань уважения',
      examples: [
        'The ceremony will pay tribute to fallen heroes.',
        "The song pays tribute to the singer's musical influences.",
        'We should pay tribute to those who helped build this community.',
        'The museum exhibition pays tribute to local artists.',
        "His speech paid tribute to his mentor's guidance.",
      ],
    },
    {
      front: 'get my message out',
      back: 'донести своё сообщение',
      examples: [
        'I need to get my message out to as many people as possible.',
        'Social media helps activists get their message out quickly.',
        'The campaign aims to get our message out about climate change.',
        "It's challenging to get my message out in such a noisy market.",
        'We use multiple channels to get our message out effectively.',
      ],
    },
    {
      front: 'sort it out',
      back: 'разобраться с чем-то, урегулировать проблему, навести порядок, решить ситуацию',
      examples: [
        "Don't worry - we'll sort it out together.",
        'The manager needs to sort it out between the two conflicting departments.',
        'I need to sort out my files before the audit.',
        "Let's sit down and sort it out like adults.",
        'The technical team will sort it out by tomorrow.',
      ],
    },
    {
      front: 'flattering',
      back: 'лестный',
      examples: [
        "That's a very flattering photograph of you.",
        'She received flattering comments about her presentation.',
        'The dress has a flattering cut that suits many body types.',
        'His review of my book was quite flattering.',
        "It's flattering to be considered for such an important role.",
      ],
    },
    {
      front: 'get distracted',
      back: 'отвлечься',
      examples: [
        "It's easy to get distracted when working from home.",
        'I often get distracted by notifications on my phone.',
        'Try not to get distracted by irrelevant details.',
        'The noise from construction made everyone get distracted.',
        'Children can get distracted very easily during lessons.',
      ],
    },
    {
      front: 'take photos',
      back: 'сделать фотографии',
      examples: [
        'Tourists love to take photos of famous landmarks.',
        'May I take photos during the performance?',
        'She takes photos professionally for magazines.',
        'We stopped to take photos of the beautiful sunset.',
        'Modern smartphones make it easy to take photos anywhere.',
      ],
    },
    {
      front: 'admire',
      back: 'восхищаться',
      examples: [
        'I admire your dedication to this project.',
        'Many people admire her courage in speaking out.',
        'We stood on the cliff, admiring the ocean view.',
        "He admires his grandfather's wartime stories.",
        'Art lovers come from far away to admire the collection.',
      ],
    },
  ];
}

function generateDecemberCards() {
  return [
    {
      front: 'staggering',
      back: 'ошеломляющий',
      examples: [
        'The company reported staggering profits this quarter.',
        'The amount of data generated daily is staggering.',
        'She made a staggering recovery after the accident.',
        'The view from the mountaintop was absolutely staggering.',
        'The project required a staggering amount of resources.',
      ],
    },
    {
      front: 'Devastation',
      back: 'разрушение, разрушения',
      examples: [
        'The hurricane left widespread devastation in its path.',
        'The photos showed the devastation caused by the earthquake.',
        'Environmental devastation affects future generations.',
        'The war brought devastation to the entire region.',
        'The forest fire caused complete devastation to the ecosystem.',
      ],
    },
  ];
}

function generateMangaCards() {
  return [
    {
      front: 'She collapsed',
      back: 'Она упала в обморок',
      examples: [
        'After running the marathon, she collapsed from exhaustion.',
        'The building collapsed during the earthquake.',
        'He collapsed into the chair, completely drained.',
        "The company's stock price collapsed overnight.",
        'She collapsed in tears when she heard the news.',
      ],
    },
    {
      front: "He's flustered",
      back: 'Он взволнован',
      examples: [
        'Whenever she compliments him, he gets flustered and blushes.',
        'The unexpected question left him flustered and speechless.',
        'He became flustered when he realized he forgot his lines.',
        "Don't get flustered - just take a deep breath and start over.",
        'The tight deadline made the entire team flustered.',
      ],
    },
    {
      front: 'All of a sudden',
      back: 'Вдруг, внезапно',
      examples: [
        'All of a sudden, the lights went out in the entire building.',
        'She was fine, and then all of a sudden she started crying.',
        'All of a sudden, I remembered where I had put my keys.',
        'The car stopped all of a sudden in the middle of the road.',
        'All of a sudden, everyone became quiet when the boss entered.',
      ],
    },
    {
      front: 'Altercation',
      back: 'Ссора, стычка, перепалка',
      examples: [
        'The two drivers had a heated altercation after the minor accident.',
        'Police were called to break up an altercation at the bar.',
        'The political debate turned into a verbal altercation.',
        'He was arrested following an altercation with a security guard.',
        'The meeting ended abruptly after an altercation between executives.',
      ],
    },
    {
      front: 'Overdo',
      back: 'Переусердствовать',
      examples: [
        "Don't overdo it on your first day at the gym.",
        'She tends to overdo the perfume - a little goes a long way.',
        'The director overdid the special effects in the movie.',
        "I think you're overdoing the criticism - he tried his best.",
        "It's easy to overdo caffeine consumption without realizing it.",
      ],
    },
    {
      front: 'gross',
      back: 'отвратительный',
      examples: [
        'The food in the cafeteria looks gross today.',
        'That horror movie was too gross for me to watch.',
        'He made a gross mistake that cost the company millions.',
        'The bathroom was absolutely gross and needed cleaning.',
        'She thought his joke was in gross poor taste.',
      ],
    },
    {
      front: 'Bow your head',
      back: 'Склони свою голову',
      examples: [
        'During the prayer, everyone bowed their heads.',
        'The knight bowed his head before the king.',
        'In some cultures, you bow your head as a sign of respect.',
        'She bowed her head in shame after being caught.',
        'The students bowed their heads during the moment of silence.',
      ],
    },
    {
      front: 'Primal instinct',
      back: 'Первобытный инстинкт',
      examples: [
        "The mother's primal instinct to protect her child kicked in.",
        'Fear triggers our primal instinct to fight or flee.',
        'His primal instinct for survival helped him endure the wilderness.',
        "There's a primal instinct in humans to seek companionship.",
        'The animal acted on primal instinct rather than training.',
      ],
    },
    {
      front: 'Scum',
      back: 'Отброс, подонок',
      examples: [
        'He called the criminals scum of the earth.',
        'A layer of scum formed on the stagnant water.',
        'She wiped the scum off the top of the boiling soup.',
        'The tabloid newspaper is considered scum by many journalists.',
        'Only scum would take advantage of vulnerable people.',
      ],
    },
    {
      front: 'Tremble in fear',
      back: 'Дрожать от страха',
      examples: [
        'The hostages trembled in fear during the robbery.',
        'I could see her hands tremble in fear as she spoke.',
        'The puppy trembled in fear during the thunderstorm.',
        'He tried not to tremble in fear during the interrogation.',
        'Her voice trembled in fear as she described the accident.',
      ],
    },
    {
      front: 'Besides',
      back: 'Кроме того, к тому же, более того',
      examples: [
        "I don't want to go to the party. Besides, I have work to do.",
        'Besides English, she speaks French and Spanish fluently.',
        "The car is too expensive. Besides, we don't really need a new one.",
        'Who was at the meeting besides you and the manager?',
        "Besides being a great athlete, he's also an excellent student.",
      ],
    },
    {
      front: 'Decent',
      back: 'Порядочный, достойный, хороший',
      examples: [
        "He's a decent man who always tries to do the right thing.",
        'The hotel was decent but not luxurious.',
        'She makes a decent living as a freelance writer.',
        "That's a decent attempt for your first time cooking.",
        'Give me a decent reason why I should help you.',
      ],
    },
    {
      front: "Don't jump to conclusions",
      back: 'Не делай поспешных выводов',
      examples: [
        "Don't jump to conclusions before you hear the full story.",
        "Just because he's late doesn't mean he forgot - don't jump to conclusions.",
        'She warned them not to jump to conclusions based on appearances.',
        "Let's gather all the facts and not jump to conclusions.",
        'People often jump to conclusions without considering all possibilities.',
      ],
    },
    {
      front: 'In vain',
      back: 'Напрасно',
      examples: [
        'They searched in vain for the missing documents.',
        'All our efforts were in vain - the project failed.',
        'She waited in vain for him to call.',
        "The doctors tried in vain to save the patient's life.",
        'He protested in vain against the decision.',
      ],
    },
    {
      front: 'Apparently',
      back: 'Вероятно',
      examples: [
        'Apparently, the meeting has been postponed until next week.',
        "He's apparently very wealthy, though he doesn't show it.",
        'Apparently, she left the company last month.',
        'The package has apparently been lost in the mail.',
        "Apparently, they're getting married next spring.",
      ],
    },
    {
      front: "We'll let you off the hook for today",
      back: 'Мы снимем тебя с крючка на сегодня (отстанем)',
      examples: [
        "Since it's your first mistake, we'll let you off the hook for today.",
        "Okay, I'll let you off the hook for today, but finish the report tomorrow.",
        'The teacher let him off the hook for today but warned about future assignments.',
        "I was going to make you clean the garage, but I'll let you off the hook for today.",
        "Given the circumstances, I'll let you off the hook for today.",
      ],
    },
    {
      front: 'Circumstances',
      back: 'Обстоятельства, сложившаяся ситуация',
      examples: [
        'Due to unforeseen circumstances, the event has been canceled.',
        "Under normal circumstances, this wouldn't be a problem.",
        'The circumstances of his resignation remain unclear.',
        'We must consider the circumstances before making a judgment.',
        'Given the circumstances, I think we made the right decision.',
      ],
    },
    {
      front: 'Flaw',
      back: 'Недостаток, упущение',
      examples: [
        'The diamond had a tiny flaw that only an expert could see.',
        "His plan has one major flaw: it's too expensive.",
        'She pointed out several flaws in the research methodology.',
        "The system's security flaw was exploited by hackers.",
        'Despite its flaws, the movie was still entertaining.',
      ],
    },
    {
      front: "She's a spoiled child",
      back: 'Она избалованный ребенок',
      examples: [
        "She's a spoiled child who always gets what she wants.",
        'Growing up as an only child, he became a spoiled child.',
        'That spoiled child threw a tantrum in the toy store.',
        "She acts like a spoiled child whenever she doesn't get her way.",
        "Being a spoiled child doesn't prepare you for real-world challenges.",
      ],
    },
    {
      front: 'Get me out of here',
      back: 'Вытащи меня отсюда',
      examples: [
        'This party is boring - get me out of here!',
        'He whispered, "Get me out of here" during the awkward meeting.',
        'When the fire alarm sounded, everyone yelled, "Get me out of here!"',
        'I hate this job. I need someone to get me out of here.',
        'The trapped miners radioed, "Get us out of here!"',
      ],
    },
    {
      front: 'Prey',
      back: 'Добыча',
      examples: [
        'The lion stalked its prey through the tall grass.',
        'In the business world, small companies can become prey for larger ones.',
        'The spider waits in its web for prey to become trapped.',
        'He fell prey to a clever scam that promised easy money.',
        'Tourists are often prey for pickpockets in crowded areas.',
      ],
    },
    {
      front: 'Affection',
      back: 'Привязанность, любовь',
      examples: [
        'The old couple showed obvious affection for each other.',
        'The dog seeks affection from anyone who will pet him.',
        'She has a deep affection for her hometown.',
        'His affection for her grew over time into love.',
        'Children need affection as much as they need food and shelter.',
      ],
    },
    {
      front: 'It would escalate to that',
      back: 'Это привело бы к тому, что',
      examples: [
        "I didn't think our disagreement would escalate to that level.",
        "If we don't address the issue now, it could escalate to that.",
        'No one expected the argument to escalate to physical violence.',
        'The trade dispute could escalate to a full-blown trade war.',
        "I hope our discussion doesn't escalate to shouting.",
      ],
    },
    {
      front: 'My stomach is growling',
      back: 'Мой живот урчит',
      examples: [
        "My stomach is growling - I haven't eaten since breakfast.",
        'During the quiet meeting, his stomach started growling loudly.',
        'I could hear her stomach growling from across the room.',
        "My stomach is growling. Let's get something to eat.",
        'The sound of his stomach growling broke the tension in the room.',
      ],
    },
    {
      front: 'Questionable at best',
      back: 'В лучшем случае сомнительный',
      examples: [
        'The evidence for his theory is questionable at best.',
        'Her decision to invest in that company was questionable at best.',
        'The food at that restaurant is questionable at best.',
        'His qualifications for the job are questionable at best.',
        "The study's methodology was questionable at best.",
      ],
    },
    {
      front: 'try it out',
      back: 'попробуй это сделать',
      examples: [
        "Why don't you try it out before you decide you don't like it?",
        'I want to try out the new software before we buy it.',
        "He's going to try out for the basketball team next week.",
        'Try it out and see if it works for you.',
        'The company lets customers try out products for 30 days.',
      ],
    },
    {
      front: 'Empty-handed',
      back: 'С пустыми руками',
      examples: [
        'He returned from the shopping trip empty-handed.',
        'The hunters came back empty-handed after a long day.',
        "Don't go to the meeting empty-handed - bring some proposals.",
        'She left the negotiation empty-handed but wiser.',
        'The team worked hard but finished the season empty-handed.',
      ],
    },
    {
      front: 'For crying out loud',
      back: 'Ради всего святого',
      examples: [
        'For crying out loud, can you please be quiet?',
        'Just tell me the truth, for crying out loud!',
        "For crying out loud, it's not that complicated!",
        'Would you hurry up, for crying out loud?',
        'For crying out loud, I asked you three times already!',
      ],
    },
    {
      front: 'My heart is pounding',
      back: 'Мое сердце бешено колотится',
      examples: [
        'My heart is pounding after running up the stairs.',
        'During the horror movie, my heart was pounding with fear.',
        'My heart was pounding as I waited for the test results.',
        'When I saw the accident, my heart started pounding.',
        'His heart was pounding with excitement as he approached the stage.',
      ],
    },
    {
      front: 'She will reflect on her actions',
      back: 'Она поразмышляет над своими поступками',
      examples: [
        'After the argument, she needed time to reflect on her actions.',
        'The punishment is intended to make her reflect on her actions.',
        'I hope she will reflect on her actions and apologize.',
        'Taking a walk helps her reflect on her actions and decisions.',
        'The retreat gave her space to reflect on her actions.',
      ],
    },
    {
      front: 'Negotiate',
      back: 'Вести переговоры',
      examples: [
        'The union will negotiate with management for better wages.',
        'She knows how to negotiate a good deal when buying a car.',
        'The two countries are trying to negotiate a peace treaty.',
        'You should always negotiate the salary when accepting a new job.',
        'He managed to negotiate a lower price for the house.',
      ],
    },
    {
      front: 'Head to class',
      back: 'Направиться в класс',
      examples: [
        'Students should head to class when the bell rings.',
        "I need to head to class now or I'll be late.",
        'After lunch, we all headed to class for the afternoon session.',
        'He grabbed his books and headed to class.',
        'The professor headed to class with his lecture notes.',
      ],
    },
    {
      front: "Shoot, I'm late",
      back: 'Черт возьми, я опаздываю',
      examples: [
        "Shoot, I'm late for my appointment!",
        'She looked at her watch and said, "Shoot, I\'m late!"',
        "Shoot, I'm late again - my boss is going to be angry.",
        "I overslept. Shoot, I'm late for work!",
        "Shoot, I'm late for picking up the kids from school.",
      ],
    },
    {
      front: 'Utmost',
      back: 'Предельная, максимальная',
      examples: [
        'She handled the situation with the utmost care.',
        'This matter is of the utmost importance.',
        'I have the utmost respect for her professional abilities.',
        'Please treat this information with the utmost confidentiality.',
        'He did his utmost to complete the project on time.',
      ],
    },
    {
      front: 'Devour',
      back: 'Пожирать',
      examples: [
        'The hungry children devoured the pizza in minutes.',
        'He devours books at a rate of one per week.',
        'The flames quickly devoured the old wooden house.',
        'She devoured every piece of information about the topic.',
        'The critics devoured his latest novel with praise.',
      ],
    },
    {
      front: 'Lenient',
      back: 'Снисходительный',
      examples: [
        'The judge was surprisingly lenient with first-time offenders.',
        'His parents were too lenient when he was growing up.',
        'The teacher has a lenient grading policy.',
        'The company has lenient rules about working from home.',
        'Some people think the punishment should be less lenient.',
      ],
    },
    {
      front: "You'll get away with this",
      back: 'Ты выйдешь сухим из воды из этой ситуации',
      examples: [
        "Don't think you'll get away with this - I'm telling the teacher.",
        'He always seems to get away with breaking the rules.',
        "You won't get away with cheating on the exam.",
        'Somehow, he managed to get away with the perfect crime.',
        'You might get away with it once, but not twice.',
      ],
    },
    {
      front: 'Opposite of me',
      back: 'Полная противоположность меня',
      examples: [
        'My brother is the complete opposite of me in every way.',
        "She's the opposite of me - outgoing while I'm shy.",
        "In terms of political views, he's the opposite of me.",
        'Our tastes in music are the opposite of each other.',
        "Being organized is the opposite of me - I'm always messy.",
      ],
    },
    {
      front: 'Reciprocate',
      back: 'Ответить взаимностью',
      examples: [
        'She helped me, so I wanted to reciprocate the favor.',
        "I love him, but he doesn't reciprocate my feelings.",
        'The company reciprocated our hospitality by inviting us to their event.',
        'When someone shows you kindness, you should reciprocate.',
        "He didn't reciprocate the friendship she offered.",
      ],
    },
    {
      front: 'Her expression is rapidly growing with unease',
      back: 'В выражении ее лица быстро нарастает беспокойство',
      examples: [
        'As the storm approached, her expression rapidly grew with unease.',
        'Her expression was rapidly growing with unease during the tense meeting.',
        'I could see her expression rapidly growing with unease as she read the letter.',
        'Her expression rapidly grew with unease when she realized she was lost.',
        'During the medical test, her expression rapidly grew with unease.',
      ],
    },
    {
      front: 'Get the courage',
      back: 'Набраться смелости',
      examples: [
        'It took me weeks to get the courage to ask her out.',
        'He finally got the courage to quit his boring job.',
        'She needed to get the courage to speak in public.',
        'Getting the courage to face his fears was the hardest part.',
        'It was difficult to get the courage to admit my mistake.',
      ],
    },
    {
      front: 'Desire',
      back: 'Желать',
      examples: [
        'I have a strong desire to travel the world.',
        'He desires nothing more than to see his family happy.',
        'The desire for success drives many entrepreneurs.',
        'She finally achieved her lifelong desire to write a novel.',
        'Human desires can be both motivating and destructive.',
      ],
    },
    {
      front: 'Choke',
      back: 'Задыхаться',
      examples: [
        'He started to choke on a piece of food.',
        'The smoke made everyone in the room choke.',
        'She choked back tears during the emotional speech.',
        'The athlete choked under pressure during the final match.',
        'The weeds are choking the plants in the garden.',
      ],
    },
    {
      front: 'Bow',
      back: 'Лук, склонить',
      examples: [
        'The archer drew back his bow and aimed at the target.',
        'In Japan, people bow when greeting each other.',
        'The actors took a bow at the end of the performance.',
        'Tie the ribbon into a pretty bow.',
        'He gave a slight bow before leaving the room.',
      ],
    },
    {
      front: "It's different from my secret tools in that ...",
      back: 'Это отличается от секретных инструментов тем, что',
      examples: [
        "This technique is different from my secret tools in that it's easier to learn.",
        "The new software is different from my secret tools in that it's more user-friendly.",
        'This approach is different from my secret tools in that it requires less preparation.',
        'The method is different from my secret tools in that it produces faster results.',
        "This strategy is different from my secret tools in that it's more adaptable.",
      ],
    },
    {
      front: 'Tremble',
      back: 'Дрожать',
      examples: [
        'Her hands began to tremble as she opened the important letter.',
        'The leaves tremble in the slightest breeze.',
        'I could feel the ground tremble during the earthquake.',
        'His voice trembled with emotion as he gave the speech.',
        'The puppy trembled with excitement when its owner returned.',
      ],
    },
    {
      front: 'Dispose of',
      back: 'Избавиться от (выкинуть)',
      examples: [
        'Please dispose of the garbage properly.',
        'The company needs to dispose of hazardous waste safely.',
        'He quickly disposed of the evidence.',
        'How should I dispose of these old batteries?',
        'The assassin disposed of his targets efficiently.',
      ],
    },
    {
      front: 'Quick on the uptake',
      back: 'Быстро соображать',
      examples: [
        'New employees need to be quick on the uptake to succeed here.',
        "She's very quick on the uptake - she understands complex concepts immediately.",
        'Children are often quicker on the uptake than adults when learning languages.',
        'You need to be quick on the uptake in fast-paced environments.',
        "He wasn't quick on the uptake and needed things explained multiple times.",
      ],
    },
    {
      front: "You'll regret it",
      back: 'Ты пожалеешь об этом',
      examples: [
        "If you drop out of school, you'll regret it later.",
        "Don't say something hurtful - you'll regret it.",
        "Skipping the meeting? You'll regret it when you miss important information.",
        "I warned him he'd regret it, but he didn't listen.",
        "Making that investment without research - you'll regret it.",
      ],
    },
    {
      front: 'That may be so now',
      back: 'Возможно, так и есть сейчас',
      examples: [
        'That may be so now, but things could change tomorrow.',
        "You say you don't need help, and that may be so now, but what about later?",
        'That may be so now, but we need to plan for the future.',
        'The system works well, and that may be so now, but we should consider upgrades.',
        'That may be so now, but I remember when things were different.',
      ],
    },
    {
      front: "I'm heading out",
      back: 'Я ухожу',
      examples: [
        "It's getting late - I'm heading out now.",
        "I'm heading out to grab some lunch. Want anything?",
        "The meeting is over, so I'm heading out.",
        "I'm heading out for a walk to clear my head.",
        "It was nice seeing you, but I'm heading out.",
      ],
    },
    {
      front: "It's coming along nicely",
      back: 'Все идет как по маслу',
      examples: [
        'The renovation project is coming along nicely.',
        'Her recovery from surgery is coming along nicely.',
        'The new garden is coming along nicely with all the rain.',
        'Your language skills are coming along nicely.',
        'The business is coming along nicely in its first year.',
      ],
    },
    {
      front: "You didn't have to do me that dirty",
      back: 'Ты мог бы не делать такую пакость',
      examples: [
        "You spread rumors about me? You didn't have to do me that dirty.",
        "Taking credit for my work? You didn't have to do me that dirty.",
        "You didn't have to do me that dirty in front of everyone.",
        "After all I've done for you, you didn't have to do me that dirty.",
        "Stealing my client? You didn't have to do me that dirty.",
      ],
    },
    {
      front: "Can't be helped",
      back: 'Ничего не поделаешь',
      examples: [
        "The train is delayed - can't be helped, I guess.",
        "Sometimes mistakes happen. It can't be helped.",
        "If the weather ruins our picnic, it can't be helped.",
        "These things can't be helped - they're part of life.",
        "The cancellation was unfortunate, but it can't be helped.",
      ],
    },
    {
      front: 'He takes the spoils',
      back: 'Он забирает добычу',
      examples: [
        'After winning the war, the victorious army takes the spoils.',
        'In business, the company that innovates often takes the spoils.',
        'The champion takes the spoils, including the trophy and prize money.',
        'When the deal closed, the lead negotiator took the spoils.',
        'To the victor go the spoils, as the old saying goes.',
      ],
    },
    {
      front: 'Embrace',
      back: 'Обнять',
      examples: [
        'They embraced each other warmly after years apart.',
        'The company decided to embrace new technology.',
        'She embraced the opportunity to study abroad.',
        'The child ran to embrace her father.',
        'We should embrace change rather than fear it.',
      ],
    },
    {
      front: 'Sincerity',
      back: 'Искренность',
      examples: [
        'I appreciate the sincerity of your apology.',
        'His sincerity made people trust him immediately.',
        'There was no doubt about the sincerity of her feelings.',
        'The letter was written with great sincerity and emotion.',
        'Sincerity is more important than eloquence in communication.',
      ],
    },
    {
      front: "It's up to you",
      back: 'Это зависит от тебя',
      examples: [
        "We can go to either restaurant - it's up to you.",
        'Whether to accept the job offer is up to you.',
        "It's up to you to decide how to spend your free time.",
        'The final decision is up to you.',
        "I've given my advice, but it's up to you what to do.",
      ],
    },
    {
      front: 'Confess to {name}',
      back: 'Признаться кому-то в любви',
      examples: [
        'He finally gathered the courage to confess to Maria.',
        'In the movie, the main character confesses to his best friend.',
        'She planned to confess to John at the school dance.',
        'I need to confess to someone about how I really feel.',
        'The letter was his way to confess to her without face-to-face pressure.',
      ],
    },
    {
      front: 'Comprehend',
      back: 'Понимать',
      examples: [
        "It's difficult to comprehend the vastness of the universe.",
        'Young children may not fully comprehend the concept of death.',
        'I cannot comprehend why anyone would make such a decision.',
        'The instructions were too complex for me to comprehend.',
        "She spoke so quickly that I couldn't comprehend everything.",
      ],
    },
    {
      front: 'Retrieve',
      back: 'Извлечь, вернуть',
      examples: [
        'The dog was trained to retrieve balls and sticks.',
        'I need to retrieve some files from my old computer.',
        'The diver attempted to retrieve the lost treasure.',
        'Can you help me retrieve my password?',
        'The system allows users to retrieve deleted emails within 30 days.',
      ],
    },
    {
      front: 'Amazingly',
      back: 'Удивительно',
      examples: [
        'Amazingly, no one was hurt in the accident.',
        'She completed the project amazingly quickly.',
        'The cake was amazingly delicious despite being vegan.',
        'Amazingly, the old car still runs perfectly.',
        'He speaks three languages amazingly well.',
      ],
    },
    {
      front: 'Out loud',
      back: 'Вслух',
      examples: [
        'Please read the instructions out loud so everyone can hear.',
        "Sometimes I talk to myself out loud when I'm working.",
        "He laughed out loud at the comedian's jokes.",
        'Thinking out loud can help organize your thoughts.',
        'The teacher asked students to say the answers out loud.',
      ],
    },
    {
      front: 'Presence',
      back: 'Наличие, присутствие',
      examples: [
        'Her presence at the meeting made everyone more focused.',
        'The presence of security cameras deters crime.',
        'He has a commanding presence when he enters a room.',
        'The test detects the presence of specific chemicals.',
        'Your presence is requested at the annual gala.',
      ],
    },
    {
      front: 'frightening',
      back: 'пугающий',
      examples: [
        'The horror movie was too frightening for young children.',
        'She had a frightening experience while hiking alone.',
        'The rapid spread of the disease is frightening.',
        'He told a frightening story about being lost at sea.',
        'The thought of public speaking is frightening to many people.',
      ],
    },
    {
      front: 'Negotiation',
      back: 'Переговоры',
      examples: [
        'The negotiation between the union and management lasted for days.',
        'Good negotiation skills are essential for business success.',
        'The peace negotiation brought an end to the conflict.',
        'Salary negotiation is an important part of job interviews.',
        'After tough negotiation, they reached a compromise.',
      ],
    },
    {
      front: 'Casually',
      back: 'Случайно',
      examples: [
        "He mentioned it casually, as if it wasn't important.",
        'She dressed casually for the informal gathering.',
        'We chatted casually while waiting for the bus.',
        'He dropped the news casually during dinner.',
        'The couple walked casually hand in hand.',
      ],
    },
    {
      front: 'Captive',
      back: 'Пленный',
      examples: [
        'The hostages were held captive for three weeks.',
        'The zoo keeps animals captive in naturalistic habitats.',
        'He held his audience captive with his storytelling.',
        'The soldiers were taken captive during the battle.',
        'A captive market has no alternative suppliers.',
      ],
    },
    {
      front: 'Repentance',
      back: 'Раскаиваться',
      examples: [
        "True repentance involves changing one's behavior.",
        'He showed no repentance for his actions.',
        'The religious ceremony focused on repentance and forgiveness.',
        'Her repentance seemed sincere to the judge.',
        'Repentance is the first step toward making amends.',
      ],
    },
    {
      front: 'Speaking of which, ...',
      back: 'Кстати об этом, ...',
      examples: [
        'Speaking of which, have you finished that report yet?',
        'We were talking about movies. Speaking of which, have you seen the new one?',
        'Speaking of which, I need to call my mother today.',
        'He mentioned his vacation. Speaking of which, when are you taking yours?',
        'Speaking of which, that reminds me of something I wanted to ask you.',
      ],
    },
  ];
}

function generateFeelingUnwellCards() {
  return [
    {
      front: 'sore throat',
      back: 'больное горло',
      examples: [
        'I have a sore throat and it hurts to swallow.',
        'Drinking warm tea with honey can soothe a sore throat.',
        'A sore throat is often the first symptom of a cold.',
        'She lost her voice due to a severe sore throat.',
        'If your sore throat lasts more than a week, see a doctor.',
      ],
    },
    {
      front: 'to pain',
      back: 'причинять боль',
      examples: [
        'The injury still pains him when he tries to exercise.',
        'It pains me to see you so unhappy.',
        'Her arthritis pains her more in cold weather.',
        'The memory of the accident still pains him deeply.',
        "It pains the teacher when students don't try their best.",
      ],
    },
    {
      front: 'disease',
      back: 'болезнь (чаще серьёзная, хроническая)',
      examples: [
        'Heart disease is a leading cause of death worldwide.',
        'The vaccine helped eradicate the disease.',
        'Researchers are working on a cure for the disease.',
        'Chronic diseases require long-term management.',
        'The spread of infectious diseases is a global concern.',
      ],
    },
    {
      front: 'to faint',
      back: 'падать в обморок',
      examples: [
        'She felt dizzy and thought she might faint.',
        'Some people faint at the sight of blood.',
        'He fainted from heat exhaustion during the marathon.',
        'The patient fainted when she stood up too quickly.',
        "If you feel like you're going to faint, sit down immediately.",
      ],
    },
    {
      front: 'malady',
      back: 'недуг, болезнь (книжн. или устар.)',
      examples: [
        'The old man suffered from various maladies in his later years.',
        'She wrote about the maladies of modern society.',
        'The physician diagnosed him with a mysterious malady.',
        'In historical novels, characters often speak of their maladies.',
        'The malady affected his ability to walk without assistance.',
      ],
    },
    {
      front: 'diarrhoea',
      back: 'диарея, понос',
      examples: [
        'Food poisoning often causes severe diarrhoea.',
        'Dehydration is a risk with prolonged diarrhoea.',
        'The medication lists diarrhoea as a possible side effect.',
        "Traveller's diarrhoea is common when visiting certain countries.",
        'Persistent diarrhoea should be evaluated by a doctor.',
      ],
    },
    {
      front: 'painful joints',
      back: 'болезненные суставы',
      examples: [
        'Arthritis often results in painful joints, especially in the morning.',
        'Cold weather makes her painful joints feel worse.',
        'Exercise can help reduce stiffness in painful joints.',
        'He complained of painful joints after the intense workout.',
        'Painful joints can significantly limit mobility.',
      ],
    },
    {
      front: 'to sneeze',
      back: 'чихать',
      examples: [
        'Cover your mouth when you sneeze to prevent spreading germs.',
        'Pepper makes me sneeze uncontrollably.',
        'Some people sneeze when they look at bright lights.',
        'She started to sneeze as soon as she entered the dusty room.',
        'A sneeze can travel droplets several feet through the air.',
      ],
    },
    {
      front: 'breath',
      back: 'дыхание',
      examples: [
        'Take a deep breath and try to relax.',
        'His breath smelled of garlic after lunch.',
        'She was out of breath after running up the stairs.',
        'Bad breath can be caused by various dental issues.',
        'The cold air made their breath visible in the morning.',
      ],
    },
    {
      front: 'rheumatism',
      back: 'ревматизм',
      examples: [
        'My grandmother suffers from rheumatism in her hands.',
        'Rheumatism causes pain and stiffness in the joints.',
        'Some people find relief from rheumatism with warm baths.',
        'The damp weather aggravated his rheumatism.',
        'Rheumatism is more common in older adults.',
      ],
    },
    {
      front: 'a fever',
      back: 'жар, лихорадка',
      examples: [
        'The child developed a fever overnight.',
        'A high fever requires medical attention.',
        'She stayed home from work because she had a fever.',
        'The fever broke after two days of medication.',
        'Checking for fever is one way to monitor illness.',
      ],
    },
    {
      front: 'to inflame',
      back: 'воспалять(ся)',
      examples: [
        'The infection caused the tissue to inflame.',
        'His comments served only to inflame the situation.',
        'Certain foods can inflame arthritis symptoms.',
        'The injury caused the joint to become inflamed.',
        "Inflammatory responses are part of the body's defense system.",
      ],
    },
    {
      front: 'sick',
      back: 'больной',
      examples: [
        'I feel sick and think I might have the flu.',
        'She called in sick to work today.',
        'The sick child needed extra care and attention.',
        'He gets sick whenever he travels by boat.',
        'Taking care of sick family members can be challenging.',
      ],
    },
    {
      front: 'an allergy',
      back: 'аллергия',
      examples: [
        'She has a severe allergy to peanuts.',
        'Seasonal allergies make spring difficult for many people.',
        'The doctor tested him for various allergies.',
        'Food allergies require careful attention to ingredients.',
        'Some allergies develop later in life.',
      ],
    },
    {
      front: 'AIDS',
      back: 'СПИД',
      examples: [
        'AIDS is caused by the HIV virus.',
        'Advances in medicine have improved treatment for AIDS.',
        'Education about AIDS prevention is crucial.',
        'People with AIDS face significant health challenges.',
        'Stigma against people with AIDS remains a problem in some areas.',
      ],
    },
    {
      front: 'ill',
      back: 'больной',
      examples: [
        "He's been ill with pneumonia for two weeks.",
        'The ill patient was admitted to the hospital.',
        'She looked pale and ill when she arrived.',
        "Taking time off when you're ill helps recovery.",
        'Ill health forced him to retire early.',
      ],
    },
    {
      front: 'appendicitis',
      back: 'аппендицит',
      examples: [
        'Appendicitis requires immediate medical attention.',
        'The main symptom of appendicitis is abdominal pain.',
        'He underwent surgery for acute appendicitis.',
        'If untreated, appendicitis can be life-threatening.',
        'The doctor suspected appendicitis based on the symptoms.',
      ],
    },
    {
      front: 'a heart attack',
      back: 'сердечный приступ',
      examples: [
        'He survived a heart attack thanks to quick medical response.',
        'Chest pain can be a sign of a heart attack.',
        'Lifestyle changes can reduce the risk of heart attack.',
        'She had a heart attack while exercising at the gym.',
        'Knowing CPR can save lives during a heart attack.',
      ],
    },
    {
      front: 'to cut',
      back: 'порезаться',
      examples: [
        'Be careful not to cut yourself with that knife.',
        'He cut his finger while preparing vegetables.',
        'The broken glass caused a deep cut on her hand.',
        'Minor cuts should be cleaned and bandaged.',
        'She needed stitches for the cut on her leg.',
      ],
    },
    {
      front: 'malaria',
      back: 'малярия',
      examples: [
        'Malaria is transmitted through mosquito bites.',
        'Travelers to certain regions should take malaria prophylaxis.',
        'Malaria causes fever, chills, and flu-like symptoms.',
        'Efforts to control malaria have saved millions of lives.',
        'The researcher studied malaria prevention methods.',
      ],
    },
    {
      front: 'motion sickness',
      back: 'укачивание (в транспорте)',
      examples: [
        'She suffers from motion sickness on long car rides.',
        'Looking at the horizon can help with motion sickness.',
        'Some medications can prevent motion sickness.',
        'Children are particularly prone to motion sickness.',
        'Reading in a moving vehicle often causes motion sickness.',
      ],
    },
    {
      front: 'feverish',
      back: 'лихорадочный, с температурой',
      examples: [
        'The patient was feverish and needed to rest.',
        'Her skin felt hot and feverish to the touch.',
        'He worked with feverish intensity to meet the deadline.',
        'The feverish child needed cool compresses.',
        'Feverish activity preceded the product launch.',
      ],
    },
    {
      front: 'bronchitis',
      back: 'бронхит',
      examples: [
        'Smoking increases the risk of developing bronchitis.',
        'Her cough was diagnosed as acute bronchitis.',
        'Bronchitis involves inflammation of the bronchial tubes.',
        'He was prescribed antibiotics for his bronchitis.',
        'Chronic bronchitis is a type of COPD.',
      ],
    },
    {
      front: 'to ache',
      back: 'болеть, ныть',
      examples: [
        "My muscles ache after yesterday's workout.",
        'Her head began to ache from staring at the screen.',
        'The old wound still aches in damp weather.',
        'I ache all over when I have the flu.',
        'His heart ached with sadness at the news.',
      ],
    },
    {
      front: 'ailment',
      back: 'недомогание, лёгкая болезнь',
      examples: [
        'Minor ailments can often be treated with rest and fluids.',
        'The medicine is for common winter ailments.',
        'She visited the doctor for various minor ailments.',
        'Stress can exacerbate physical ailments.',
        "He complained of a mysterious ailment that doctors couldn't diagnose.",
      ],
    },
    {
      front: 'malnutrition',
      back: 'недоедание, истощение',
      examples: [
        "Malnutrition affects children's physical and cognitive development.",
        'The famine caused widespread malnutrition in the region.',
        'Proper nutrition can prevent malnutrition in elderly patients.',
        'Malnutrition weakens the immune system.',
        'Humanitarian organizations work to combat malnutrition.',
      ],
    },
    {
      front: 'bleeding',
      back: 'кровотечение',
      examples: [
        'Apply pressure to stop the bleeding from the wound.',
        'Internal bleeding requires emergency medical care.',
        'Nosebleeds are a common type of minor bleeding.',
        'The patient experienced bleeding after surgery.',
        'Excessive bleeding can lead to shock.',
      ],
    },
    {
      front: 'to swallow',
      back: 'глотать',
      examples: [
        'It hurt to swallow because of her sore throat.',
        'He swallowed the pill with a glass of water.',
        'Be careful not to swallow the cherry pit.',
        'She swallowed her pride and asked for help.',
        'The whale can swallow huge amounts of water when feeding.',
      ],
    },
    {
      front: 'giddy',
      back: 'чувствующий головокружение',
      examples: [
        'She felt giddy after spinning around in circles.',
        'The height made him feel giddy and unsteady.',
        'Success made her giddy with excitement.',
        'Standing up too quickly can make you feel giddy.',
        'The medication sometimes causes a giddy feeling.',
      ],
    },
    {
      front: 'pneumonia',
      back: 'пневмония, воспаление лёгких',
      examples: [
        'Elderly patients are vulnerable to pneumonia.',
        'He was hospitalized with severe pneumonia.',
        'Vaccines can prevent some types of pneumonia.',
        'Pneumonia can develop as a complication of flu.',
        'Antibiotics are used to treat bacterial pneumonia.',
      ],
    },
    {
      front: 'to cough',
      back: 'кашлять',
      examples: [
        'Cover your mouth when you cough to prevent spreading germs.',
        'The smoke made everyone in the room cough.',
        'A persistent cough can be a sign of various conditions.',
        'She developed a cough that lasted for weeks.',
        "Cough medicine can help relieve symptoms but doesn't cure the cause.",
      ],
    },
    {
      front: 'giddiness',
      back: 'головокружение',
      examples: [
        'Sudden giddiness can be a warning sign of health issues.',
        'The medication may cause temporary giddiness.',
        'She experienced giddiness when she stood up too quickly.',
        'Extreme hunger sometimes leads to giddiness.',
        'The doctor asked about the frequency of her giddiness episodes.',
      ],
    },
    {
      front: 'to injure',
      back: 'наносить травму',
      examples: [
        'The accident injured several passengers.',
        'Be careful not to injure yourself with those tools.',
        'His pride was injured by the criticism.',
        'The athlete injured his knee during the game.',
        'Words can injure as much as physical violence.',
      ],
    },
    {
      front: 'a cold',
      back: 'простуда',
      examples: [
        "I think I'm coming down with a cold.",
        'Rest and fluids are the best remedies for a cold.',
        'The common cold is caused by various viruses.',
        'She caught a cold after getting caught in the rain.',
        "There's no cure for the common cold, only symptom relief.",
      ],
    },
    {
      front: 'to sore',
      back: 'болеть, воспаляться (часто используется как прилагательное)',
      examples: [
        'My throat is sore from all the talking.',
        'She has sore muscles after the intense workout.',
        'The wound became sore and infected.',
        'Walking long distances made his feet sore.',
        'A sore point in their relationship needed addressing.',
      ],
    },
    {
      front: 'to be sick',
      back: 'тошнить, блевать',
      examples: [
        'The roller coaster made him feel like he was going to be sick.',
        'She was sick all night with food poisoning.',
        "If you're feeling sick, you should lie down.",
        'The smell made me want to be sick.',
        'Some medications can cause you to be sick.',
      ],
    },
    {
      front: 'to breathe',
      back: 'дышать',
      examples: [
        "It's difficult to breathe in this polluted air.",
        'Take a moment to breathe deeply and relax.',
        'Patients with asthma sometimes struggle to breathe.',
        'The doctor told him to breathe in and out slowly.',
        'Fish breathe through their gills.',
      ],
    },
    {
      front: 'diabetes',
      back: 'диабет',
      examples: [
        'Diabetes requires careful management of blood sugar levels.',
        'There are two main types of diabetes.',
        'Regular exercise can help prevent type 2 diabetes.',
        'He monitors his diabetes with regular blood tests.',
        'Diabetes can lead to various complications if uncontrolled.',
      ],
    },
    {
      front: 'stomach ulcer',
      back: 'язва желудка',
      examples: [
        'Stress and certain medications can cause stomach ulcers.',
        'The pain from his stomach ulcer was severe.',
        'Treatment for stomach ulcers often involves medication.',
        'She was diagnosed with a stomach ulcer after tests.',
        'Certain foods can aggravate a stomach ulcer.',
      ],
    },
    {
      front: 'rash',
      back: 'сыпь',
      examples: [
        'The baby developed a rash after trying new food.',
        'An allergic reaction can cause a skin rash.',
        'The rash was itchy and uncomfortable.',
        'Heat rash is common in hot, humid weather.',
        'Some infections are accompanied by a characteristic rash.',
      ],
    },
    {
      front: 'tuberculosis (TB)',
      back: 'туберкулёз',
      examples: [
        'TB is an infectious disease that primarily affects the lungs.',
        'Multidrug-resistant TB is a serious public health concern.',
        'TB treatment requires taking antibiotics for several months.',
        'Screening tests can detect TB infection.',
        'TB was once a leading cause of death worldwide.',
      ],
    },
    {
      front: 'a stroke',
      back: 'инсульт, удар',
      examples: [
        'Quick treatment is crucial when someone has a stroke.',
        'High blood pressure increases stroke risk.',
        'She suffered a stroke that affected her speech.',
        'FAST is an acronym for recognizing stroke symptoms.',
        'Rehabilitation helps stroke patients regain functions.',
      ],
    },
    {
      front: 'to shiver',
      back: 'дрожать, знобить',
      examples: [
        'She began to shiver in the cold winter air.',
        'Fever often causes shivering and chills.',
        'The scary movie made him shiver with fear.',
        'Excitement made her shiver with anticipation.',
        "Shivering is the body's way of generating heat.",
      ],
    },
    {
      front: 'food poisoning',
      back: 'пищевое отравление',
      examples: [
        'Several people got food poisoning from the restaurant.',
        'Symptoms of food poisoning include nausea and diarrhoea.',
        'Proper food handling prevents food poisoning.',
        'She was hospitalized with severe food poisoning.',
        'Food poisoning usually resolves within a few days.',
      ],
    },
    {
      front: 'a chill',
      back: 'озноб, простуда',
      examples: [
        'A sudden chill made her wrap herself in a blanket.',
        'He caught a chill from being out in the rain.',
        'The medication reduced her fever and chills.',
        'There was a chill in the autumn air.',
        'A chill ran down his spine when he heard the news.',
      ],
    },
    {
      front: 'seasickness',
      back: 'морская болезнь',
      examples: [
        'Many first-time sailors experience seasickness.',
        'Medication can help prevent seasickness.',
        'Looking at the horizon reduces seasickness for some people.',
        'The rough waters caused widespread seasickness.',
        'Seasickness results from conflicting signals to the brain.',
      ],
    },
    {
      front: 'concussion',
      back: 'сотрясение мозга',
      examples: [
        'The football player suffered a concussion during the game.',
        'Symptoms of concussion include headache and confusion.',
        'Rest is important for recovery from concussion.',
        'She got a concussion from falling off her bike.',
        'Multiple concussions can have long-term effects.',
      ],
    },
    {
      front: 'scarlet fever',
      back: 'скарлатина',
      examples: [
        'Scarlet fever was once a dangerous childhood illness.',
        'The rash of scarlet fever has a characteristic appearance.',
        'Antibiotics have made scarlet fever much less threatening.',
        'Scarlet fever is caused by streptococcal bacteria.',
        'Historical novels often mention characters with scarlet fever.',
      ],
    },
    {
      front: 'flu, influenza',
      back: 'грипп',
      examples: [
        'Flu season typically peaks in winter months.',
        'The flu vaccine is updated each year.',
        'She missed a week of work with the flu.',
        'Flu symptoms are usually more severe than cold symptoms.',
        'Pandemic flu strains can spread rapidly worldwide.',
      ],
    },
    {
      front: 'airsickness',
      back: 'воздушная болезнь (укачивание в самолёте)',
      examples: [
        'She always gets airsickness during turbulence.',
        'Choosing a seat over the wings can reduce airsickness.',
        'Some people take medication to prevent airsickness.',
        'Airsickness bags are provided on all commercial flights.',
        'Deep breathing exercises help with airsickness.',
      ],
    },
    {
      front: 'illness',
      back: 'болезнь (общий термин)',
      examples: [
        'Mental illness should be treated with the same seriousness as physical illness.',
        'The severity of the illness required hospitalization.',
        'Preventive measures can reduce the risk of illness.',
        'Chronic illness requires long-term management.',
        'The illness spread rapidly through the community.',
      ],
    },
    {
      front: 'asthma',
      back: 'астма',
      examples: [
        'Asthma attacks can be triggered by allergens or exercise.',
        'She uses an inhaler to control her asthma.',
        'Childhood asthma is increasingly common.',
        'Air pollution can worsen asthma symptoms.',
        'Proper management allows most asthma patients to lead normal lives.',
      ],
    },
    {
      front: 'typhoid',
      back: 'брюшной тиф',
      examples: [
        'Typhoid fever is common in areas with poor sanitation.',
        'The typhoid vaccine is recommended for travelers to certain regions.',
        'Typhoid is spread through contaminated food and water.',
        'Antibiotics are used to treat typhoid.',
        'Historical figures sometimes died of typhoid.',
      ],
    },
    {
      front: 'to vomit',
      back: 'блевать, рвать',
      examples: [
        'Food poisoning caused him to vomit repeatedly.',
        'Some chemotherapy drugs cause patients to vomit.',
        'The smell was so bad it made her want to vomit.',
        'Excessive alcohol consumption can lead to vomiting.',
        "Vomiting is the body's way of expelling harmful substances.",
      ],
    },
    {
      front: 'to die',
      back: 'умирать',
      examples: [
        'All living things eventually die.',
        'He died peacefully in his sleep at age 92.',
        'The plant will die without water.',
        'The tradition is dying out as younger generations lose interest.',
        'She nearly died in the accident.',
      ],
    },
    {
      front: 'to swell',
      back: 'опухать',
      examples: [
        'Her ankle began to swell after the sprain.',
        'Allergic reactions can cause the throat to swell.',
        'The river swells during the spring thaw.',
        'Inflammation causes tissues to swell.',
        'His pride swelled when he received the award.',
      ],
    },
    {
      front: 'to hurt',
      back: 'причинять боль, болеть',
      examples: [
        'My back hurts from sitting at the desk all day.',
        'It hurts when you say things like that.',
        'The injection might hurt a little.',
        'Her knee still hurts from the old injury.',
        'Watching him struggle hurts me deeply.',
      ],
    },
    {
      front: 'sickness',
      back: 'болезнь, тошнота',
      examples: [
        'Morning sickness is common in early pregnancy.',
        'The sickness spread quickly through the office.',
        'Altitude sickness affects some people at high elevations.',
        "There's a lot of sickness going around this winter.",
        'The sickness kept him in bed for three days.',
      ],
    },
    {
      front: 'bruise',
      back: 'синяк, ушиб',
      examples: [
        'She got a nasty bruise when she bumped into the table.',
        'The apple had a bruise on one side.',
        'Bruises change color as they heal.',
        'Some people bruise more easily than others.',
        'The emotional bruise took longer to heal than the physical one.',
      ],
    },
    {
      front: 'insomnia',
      back: 'бессонница',
      examples: [
        'Stress often causes temporary insomnia.',
        'Chronic insomnia can affect overall health.',
        'She suffers from insomnia and often reads late into the night.',
        'Good sleep hygiene can help with insomnia.',
        'The medication helped with his insomnia but had side effects.',
      ],
    },
    {
      front: 'a nervous breakdown',
      back: 'нервный срыв',
      examples: [
        'The stress at work led to her nervous breakdown.',
        'He took a leave of absence after his nervous breakdown.',
        'A nervous breakdown is not a clinical term but describes extreme stress.',
        'She sought therapy after her nervous breakdown.',
        'The pressure became too much, resulting in a nervous breakdown.',
      ],
    },
    {
      front: 'dizzy',
      back: 'испытывающий головокружение',
      examples: [
        'Standing up too quickly made her feel dizzy.',
        'The heights made him dizzy and nauseous.',
        'Dehydration can cause you to feel dizzy.',
        'She felt dizzy after spinning around.',
        'The medication may cause dizzy spells.',
      ],
    },
    {
      front: 'death',
      back: 'смерть',
      examples: [
        'The death of a loved one is always difficult.',
        'The accident resulted in three deaths.',
        'He cheated death in the mountaineering accident.',
        'The death penalty is controversial in many countries.',
        'She faced her death with remarkable courage.',
      ],
    },
    {
      front: 'fever',
      back: 'жар, лихорадка',
      examples: [
        'A high fever can be dangerous, especially in children.',
        'The fever subsided after she took medication.',
        'Malaria often causes recurrent fevers.',
        'Check for fever by using a thermometer.',
        "Fever is the body's response to infection.",
      ],
    },
    {
      front: 'cancer',
      back: 'рак',
      examples: [
        'Early detection improves cancer survival rates.',
        'Many cancers are treatable with modern medicine.',
        'Smoking is linked to several types of cancer.',
        'She battled cancer for two years before remission.',
        'Cancer research has made significant advances.',
      ],
    },
    {
      front: 'temperature',
      back: 'температура',
      examples: [
        "The nurse took the patient's temperature.",
        'Room temperature is comfortable for most people.',
        "A sudden drop in temperature signaled the storm's approach.",
        'She had an elevated temperature, indicating illness.',
        'Body temperature varies throughout the day.',
      ],
    },
    {
      front: 'indigestion',
      back: 'несварение желудка',
      examples: [
        'Rich foods often cause indigestion.',
        'He took an antacid for his indigestion.',
        'Stress can contribute to indigestion.',
        'Symptoms of indigestion include bloating and discomfort.',
        'Eating too quickly can lead to indigestion.',
      ],
    },
    {
      front: 'injury',
      back: 'травма',
      examples: [
        'The injury required surgery and physical therapy.',
        'Workplace injuries should be reported immediately.',
        'He suffered a career-ending injury.',
        'The injury left a permanent scar.',
        'Sports injuries are common among athletes.',
      ],
    },
    {
      front: 'inflammation',
      back: 'воспаление',
      examples: [
        "Inflammation is the body's response to injury or infection.",
        'Chronic inflammation is linked to various diseases.',
        'The doctor prescribed medication to reduce inflammation.',
        'Heat and redness are signs of inflammation.',
        'Anti-inflammatory drugs help control inflammation.',
      ],
    },
    {
      front: 'dizziness',
      back: 'головокружение',
      examples: [
        'Sudden dizziness can be a sign of low blood pressure.',
        'The medication may cause dizziness as a side effect.',
        'She experienced dizziness when she stood up too quickly.',
        'Dizziness and balance issues should be evaluated by a doctor.',
        'Dehydration often leads to dizziness.',
      ],
    },
    {
      front: 'measles',
      back: 'корь',
      examples: [
        'Measles is a highly contagious viral illness.',
        'Vaccination has dramatically reduced measles cases.',
        'The measles outbreak affected many unvaccinated children.',
        'Measles causes fever and a distinctive rash.',
        'Complications from measles can be serious.',
      ],
    },
  ];
}

function generatePartsOfBodyCards() {
  return [
    {
      front: 'Bridge',
      back: 'переносица',
      examples: [
        'The glasses rest on the bridge of his nose.',
        'She gently touched the bridge of her nose where her glasses sit.',
        "The boxer's punch landed right on the bridge of his opponent's nose.",
        'Sunglasses should fit comfortably on the bridge of your nose.',
        'He had a small scar across the bridge of his nose.',
      ],
    },
    {
      front: 'Belly',
      back: 'живот, брюхо, пузо',
      examples: [
        'The baby has a round belly after feeding.',
        'He rubbed his belly after eating the large meal.',
        'Belly dancing is a traditional form of dance.',
        'She felt a knot in her belly from nervousness.',
        'The lizard showed its bright orange belly.',
      ],
    },
    {
      front: 'Forehead',
      back: 'лоб',
      examples: [
        'She wiped the sweat from her forehead with a towel.',
        'He has a high forehead that makes him look intelligent.',
        "The mother kissed her child's forehead goodnight.",
        'Wrinkles appeared on his forehead when he frowned.',
        'She placed a cold compress on her forehead to relieve the headache.',
      ],
    },
    {
      front: 'Cheek',
      back: 'щека',
      examples: [
        'She has dimples in both cheeks when she smiles.',
        "He gently pinched the baby's soft cheek.",
        'Tears streamed down her cheeks as she watched the sad movie.',
        'His cheeks turned red from embarrassment.',
        'She rested her cheek against the cool pillow.',
      ],
    },
    {
      front: 'Index finger',
      back: 'указательный палец',
      examples: [
        'Point with your index finger, not your whole hand.',
        'She wore a ring on her index finger.',
        'He raised his index finger to ask for attention.',
        'The teacher pointed at the map with her index finger.',
        'He cut his index finger while preparing vegetables.',
      ],
    },
    {
      front: 'Eyelid',
      back: 'веко',
      examples: [
        'Her eyelids grew heavy as she tried to stay awake.',
        'He had a small twitch in his left eyelid from stress.',
        'She applied eyeshadow to her upper eyelids.',
        'The surgeon made an incision along the eyelid.',
        'His eyelids fluttered as he began to wake up.',
      ],
    },
    {
      front: 'Liver',
      back: 'печень',
      examples: [
        "The liver is one of the body's most important organs.",
        'Excessive alcohol consumption can damage the liver.',
        'Liver transplants save thousands of lives each year.',
        'Some people enjoy eating liver pâté.',
        'The liver filters toxins from the blood.',
      ],
    },
    {
      front: 'Palate',
      back: 'нёбо',
      examples: [
        'The wine had a complex palate with hints of berries and oak.',
        'Food can get stuck in the crevices of the palate.',
        'A cleft palate is a birth defect that requires surgery.',
        'She burned the roof of her palate with hot pizza.',
        'The chef has a sophisticated palate for flavors.',
      ],
    },
    {
      front: 'Rib',
      back: 'ребро',
      examples: [
        'He broke a rib in a skiing accident.',
        'The anatomical model showed all the ribs clearly.',
        'She felt a pain in her ribs when she laughed too hard.',
        'BBQ ribs are a popular dish in many cultures.',
        'The cage protected his ribs during the sports match.',
      ],
    },
    {
      front: 'Intestines',
      back: 'кишечник',
      examples: [
        'Food passes through the intestines during digestion.',
        'The surgeon removed a blockage from his intestines.',
        'Intestinal health is important for overall well-being.',
        'Some animals have much longer intestines than humans.',
        'The intestines absorb nutrients from digested food.',
      ],
    },
    {
      front: 'Wrist',
      back: 'запястье',
      examples: [
        'She wore a bracelet around her slender wrist.',
        'He sprained his wrist playing tennis.',
        'The handcuffs were tight around his wrists.',
        'She checked her watch on her left wrist.',
        'Wrist strength is important for many sports.',
      ],
    },
    {
      front: 'Backbone',
      back: 'позвоночник',
      examples: [
        'Good posture depends on a healthy backbone.',
        'He showed real backbone in standing up for his principles.',
        'The backbone protects the spinal cord.',
        'She felt a chill run down her backbone.',
        'The company needs employees with backbone to make tough decisions.',
      ],
    },
    {
      front: 'belly button',
      back: 'пуп',
      examples: [
        "The baby's belly button needed cleaning until it healed.",
        'She got a small tattoo next to her belly button.',
        'Some people have an "innie" belly button, others an "outie".',
        "He tickled his daughter's belly button, making her laugh.",
        'The piercing in her belly button got infected.',
      ],
    },
    {
      front: 'Collarbone',
      back: 'ключица',
      examples: [
        'Her collarbone was visible because she was so thin.',
        'He broke his collarbone in a bicycle accident.',
        'The necklace rested just above her collarbone.',
        'The dress had a neckline that showed off her collarbones.',
        'The collarbone connects the shoulder to the sternum.',
      ],
    },
    {
      front: 'Bladder',
      back: 'мочевой пузырь',
      examples: [
        'A full bladder can be quite uncomfortable.',
        'She has a urinary tract infection affecting her bladder.',
        'The doctor checked his bladder with an ultrasound.',
        'As people age, bladder control can become an issue.',
        "The bladder stores urine until it's eliminated.",
      ],
    },
    {
      front: 'Pupil',
      back: 'зрачок',
      examples: [
        'The doctor checked how his pupils responded to light.',
        'Her pupils dilated in the dark room.',
        'The optometrist examined the health of her pupils.',
        'Some drugs cause pupils to constrict or dilate.',
        'The pupil is the black circular opening in the center of the iris.',
      ],
    },
    {
      front: 'Stomach',
      back: 'живот, желудок',
      examples: [
        'My stomach is growling - I need to eat something.',
        'She felt butterflies in her stomach before the presentation.',
        'Some people have sensitive stomachs and need to be careful with food.',
        'The stomach breaks down food using acids and enzymes.',
        'He punched me in the stomach during the fight.',
      ],
    },
    {
      front: 'Chin',
      back: 'подбородок',
      examples: [
        'He rubbed his chin while thinking deeply.',
        'She has a dimple in her chin, just like her father.',
        'The boxer took a punch to the chin but stayed standing.',
        'Rest your chin on your hand while you listen.',
        'He grew a beard to cover his weak chin.',
      ],
    },
    {
      front: 'Nostril',
      back: 'ноздря',
      examples: [
        'Breathing through one nostril is common when you have a cold.',
        'The piercing went through her left nostril.',
        'Steam inhalation helps clear blocked nostrils.',
        'Some animals can close their nostrils underwater.',
        'He flared his nostrils in anger.',
      ],
    },
    {
      front: 'Shin',
      back: 'голень',
      examples: [
        'He got a nasty bruise on his shin from the soccer game.',
        'Shin guards protect athletes during contact sports.',
        'She felt a sharp pain in her shin while running.',
        'The shinbone is one of the most commonly injured bones.',
        'He massaged his sore shins after the long hike.',
      ],
    },
    {
      front: 'Toe',
      back: 'палец ноги',
      examples: [
        'She stubbed her toe on the furniture in the dark.',
        'He has ten toes, just like most people.',
        "The baby's tiny toes were perfect and pink.",
        'She painted her toenails bright red for summer.',
        'Frostbite can affect fingers and toes in extreme cold.',
      ],
    },
    {
      front: 'Navel (анат.)',
      back: 'пуп',
      examples: [
        'The navel is where the umbilical cord was attached.',
        'Some yoga poses focus on the navel area.',
        'He had surgery near his navel.',
        'The navel is also called the belly button.',
        'In some cultures, the navel is considered an energy center.',
      ],
    },
    {
      front: 'Hip',
      back: 'бедро (тазовая часть)',
      examples: [
        'She broke her hip in a fall and needed surgery.',
        'The dress hugged her hips perfectly.',
        'He stood with his hands on his hips.',
        'Hip replacements have become very common surgeries.',
        "The baby's hips were checked for dysplasia.",
      ],
    },
    {
      front: 'Ankle',
      back: 'лодыжка',
      examples: [
        'She twisted her ankle while hiking on uneven ground.',
        'Ankle boots are fashionable in the fall.',
        'He wore an ankle monitor as part of his parole.',
        'The swelling in her ankle went down after she elevated it.',
        'Some people have naturally slender ankles.',
      ],
    },
    {
      front: 'Thigh',
      back: 'бедро (ляжка)',
      examples: [
        'She works out to strengthen her thigh muscles.',
        'Chicken thighs are more flavorful than breasts.',
        'He got a tattoo on his outer thigh.',
        "The child sat on her father's thigh.",
        'Thigh-high boots are a popular fashion item.',
      ],
    },
    {
      front: 'Tummy',
      back: 'животик',
      examples: [
        'The child complained of a tummy ache.',
        'She rubbed her tummy after eating too much.',
        "Tummy time is important for babies' development.",
        'He showed off his flat tummy at the beach.',
        'Some exercises specifically target the tummy area.',
      ],
    },
    {
      front: 'Middle finger',
      back: 'средний палец',
      examples: [
        'She wore a simple band on her middle finger.',
        'He raised his middle finger in a rude gesture.',
        'The middle finger is typically the longest finger.',
        'She injured her middle finger while playing basketball.',
        'In some cultures, pointing with the middle finger is offensive.',
      ],
    },
    {
      front: 'Lungs',
      back: 'лёгкие',
      examples: [
        'Smoking damages the lungs over time.',
        'She took a deep breath, filling her lungs with fresh air.',
        'COVID-19 can cause severe damage to the lungs.',
        "The diver's lungs were tested for capacity.",
        'Lung cancer is one of the most common cancers.',
      ],
    },
    {
      front: 'Nail',
      back: 'ноготь',
      examples: [
        'She bit her nails when she was nervous.',
        'He hammered the nail into the wood.',
        'Fungal infections can affect toenails.',
        'She got a manicure to polish her nails.',
        'The cat scratched him, leaving marks on his skin but not breaking the nail.',
      ],
    },
    {
      front: 'Iris',
      back: 'радужная оболочка глаза',
      examples: [
        'Her iris was a striking shade of green.',
        'The iris controls how much light enters the eye.',
        'Iris recognition is used in some security systems.',
        'Some people have two different colored irises.',
        'The iris is the colored part of the eye surrounding the pupil.',
      ],
    },
    {
      front: 'Heel',
      back: 'пятка',
      examples: [
        'She wore high heels to the party.',
        'He had a blister on his heel from new shoes.',
        'Achilles tendon connects the calf muscles to the heel.',
        'She clicked her heels together three times.',
        'The baby was born with a tiny heel prick for testing.',
      ],
    },
    {
      front: 'Kidneys',
      back: 'почки',
      examples: [
        'The kidneys filter waste from the blood.',
        'He donated one of his kidneys to his sister.',
        'Kidney stones can be extremely painful.',
        'Drinking enough water is important for kidney health.',
        'Kidney transplants require careful matching of donors and recipients.',
      ],
    },
    {
      front: 'Eyelashes',
      back: 'ресницы',
      examples: [
        'She applied mascara to make her eyelashes look longer.',
        'He had naturally long, dark eyelashes.',
        'False eyelashes are popular for special occasions.',
        'Dust made her eyelashes flutter as she blinked.',
        'Some people get eyelash extensions for a fuller look.',
      ],
    },
    {
      front: 'Eyebrow',
      back: 'бровь',
      examples: [
        'She raised one eyebrow in skepticism.',
        'He got his eyebrows trimmed at the barber shop.',
        'Thick eyebrows are currently in fashion.',
        'The eyebrow shapes the expression on your face.',
        'She plucked stray hairs from her eyebrows.',
      ],
    },
    {
      front: 'Chest',
      back: 'грудная клетка',
      examples: [
        'He felt a tightness in his chest after running.',
        'She crossed her arms over her chest.',
        'Chest compressions are part of CPR.',
        'The medal hung proudly on his chest.',
        'Chest X-rays can reveal lung problems.',
      ],
    },
    {
      front: 'Elbow',
      back: 'локоть',
      examples: [
        'He leaned on his elbows while reading.',
        'She bumped her elbow on the door frame.',
        'Tennis elbow is a common sports injury.',
        'The child sat at the table, elbows properly positioned.',
        'He gave her a gentle nudge with his elbow.',
      ],
    },
    {
      front: 'Skull',
      back: 'череп',
      examples: [
        'The archaeologist found an ancient human skull.',
        'The skull protects the brain from injury.',
        'Skull and crossbones is a symbol of danger.',
        'He had a tattoo of a skull on his arm.',
        'Fractures to the skull can be very serious.',
      ],
    },
    {
      front: 'Foot',
      back: 'стопа',
      examples: [
        'Her foot hurt after walking all day.',
        'He measured his foot for new shoes.',
        'Foot massage can be very relaxing.',
        'She put her best foot forward in the interview.',
        "Athlete's foot is a common fungal infection.",
      ],
    },
    {
      front: 'Knee',
      back: 'колено',
      examples: [
        'She fell and scraped her knee.',
        'He had knee surgery after a sports injury.',
        "The child sat on her grandfather's knee.",
        'Knee-high socks were popular in the 90s.',
        'Arthritis often affects the knees in older adults.',
      ],
    },
    {
      front: 'Abdomen',
      back: 'живот (медицинское название)',
      examples: [
        'The doctor examined her abdomen for any abnormalities.',
        'Abdominal exercises strengthen the core muscles.',
        'He felt a sharp pain in his lower abdomen.',
        'The abdomen contains many vital organs.',
        'She had surgery to remove a tumor from her abdomen.',
      ],
    },
    {
      front: 'Waist',
      back: 'талия',
      examples: [
        'She measured her waist before starting the diet.',
        'The dress was tight around the waist.',
        'He put his arm around her waist.',
        'High-waisted pants are back in style.',
        'The belt was too big for his slender waist.',
      ],
    },
    {
      front: "Adam's apple",
      back: 'кадык',
      examples: [
        "His Adam's apple bobbed as he swallowed nervously.",
        "Men typically have more prominent Adam's apples than women.",
        'The name "Adam\'s apple" comes from the biblical story.',
        "She noticed his Adam's apple when he spoke.",
        "The Adam's apple is part of the thyroid cartilage.",
      ],
    },
    {
      front: 'Temple',
      back: 'висок',
      examples: [
        'She felt a throbbing pain in her temples.',
        'He had grey hair at his temples.',
        'The boxer was punched in the temple and staggered.',
        'She applied pressure to her temples to relieve the headache.',
        'Temples are sensitive areas on the head.',
      ],
    },
    {
      front: 'Jaw',
      back: 'челюсть',
      examples: [
        'His jaw dropped in surprise at the news.',
        'She clenched her jaw when she was angry.',
        'Jaw surgery can correct alignment problems.',
        'He had a strong, square jaw.',
        'The dentist examined her jaw for any issues.',
      ],
    },
    {
      front: 'Palm',
      back: 'ладонь',
      examples: [
        'She read his palm as a party trick.',
        'He had calluses on his palms from working with tools.',
        'She held the tiny bird gently in the palm of her hand.',
        'Sweaty palms can be a sign of nervousness.',
        'The fortune teller studied the lines on her palm.',
      ],
    },
    {
      front: 'Ring finger',
      back: 'безымянный палец',
      examples: [
        'She wore her wedding ring on her left ring finger.',
        'In many cultures, the ring finger is associated with marriage.',
        'He injured his ring finger while playing basketball.',
        'The ring finger is between the middle finger and pinky.',
        'Some people have a vein that supposedly connects the ring finger directly to the heart.',
      ],
    },
    {
      front: 'Little finger, pinky',
      back: 'мизинец',
      examples: [
        'She broke her pinky while playing volleyball.',
        'He held his teacup with his pinky finger extended.',
        'The little finger is the smallest finger on the hand.',
        'She wore a delicate ring on her pinky.',
        'In some cultures, a pinky promise is a serious commitment.',
      ],
    },
    {
      front: 'Knuckles',
      back: 'костяшки пальцев',
      examples: [
        'He cracked his knuckles before starting to type.',
        "The boxer's knuckles were bruised and swollen.",
        'She rapped her knuckles on the door.',
        'Brass knuckles are illegal weapons in many places.',
        'He had tattoos on his knuckles that spelled a word.',
      ],
    },
    {
      front: 'Thumb',
      back: 'большой палец руки',
      examples: [
        'The baby sucked its thumb for comfort.',
        'He gave a thumbs-up to show his approval.',
        'She accidentally hit her thumb with the hammer.',
        'Opposable thumbs are what make human hands so versatile.',
        'He scrolled through his phone with his thumb.',
      ],
    },
    {
      front: 'Joint',
      back: 'сустав',
      examples: [
        'Arthritis causes inflammation in the joints.',
        'He felt stiffness in his knee joints every morning.',
        'The shoulder is a ball-and-socket joint.',
        'She cracked her knuckle joints.',
        'Joint replacement surgery can relieve chronic pain.',
      ],
    },
    {
      front: 'Gum',
      back: 'десна',
      examples: [
        'Brushing too hard can damage your gums.',
        'Her gums bled when she flossed.',
        'Gum disease is common among adults.',
        'The baby was teething and had sore gums.',
        'Healthy gums are firm and pink, not red or swollen.',
      ],
    },
    {
      front: 'Shoulder blade',
      back: 'лопатка',
      examples: [
        'She felt tension between her shoulder blades.',
        'The shoulder blade is also called the scapula.',
        'He had a tattoo on his left shoulder blade.',
        'The massage therapist worked on her tight shoulder blades.',
        'The shoulder blade connects the arm to the torso.',
      ],
    },
  ];
}

function generateMedicalPossibilitiesCards() {
  return [
    {
      front: 'aimed',
      back: 'направленный, нацеленный',
      examples: [
        'The new drug is aimed at reducing inflammation in arthritis patients.',
        'The marketing campaign is aimed at young professionals.',
        'His criticism seemed aimed specifically at the management team.',
        'The program is aimed at helping unemployed people find work.',
        'Research funding is often aimed at the most promising areas of study.',
      ],
    },
    {
      front: 'poor vision, poor eyesight',
      back: 'плохое зрение',
      examples: [
        'Due to poor vision, she needs to wear glasses for driving.',
        'Poor eyesight prevented him from joining the military.',
        'Regular eye exams are important, especially if you have poor vision.',
        'Poor vision can result from various conditions like myopia or cataracts.',
        'Assistive technologies help people with poor eyesight use computers.',
      ],
    },
    {
      front: 'capable',
      back: 'способный, компетентный',
      examples: [
        'She is a capable surgeon with years of experience.',
        'The new software is capable of processing large amounts of data.',
        'He proved himself capable of handling difficult situations.',
        'Children are often more capable than adults give them credit for.',
        'We need a team capable of meeting tight deadlines.',
      ],
    },
    {
      front: 'prescription',
      back: 'рецепт (мед.)',
      examples: [
        "You need a doctor's prescription to buy these antibiotics.",
        'She lost her glasses prescription and needed a new eye exam.',
        'Prescription drug abuse is a growing problem.',
        'The pharmacy filled his prescription within an hour.',
        'Some medications are available without a prescription.',
      ],
    },
    {
      front: 'vision, eyesight',
      back: 'зрение',
      examples: [
        '20/20 vision is considered perfect eyesight.',
        'Regular eye check-ups help maintain good vision.',
        'His vision deteriorated as he got older.',
        'The optometrist tested her eyesight with various charts.',
        'Protective eyewear can prevent damage to your vision.',
      ],
    },
    {
      front: 'devoted',
      back: 'преданный, посвящённый',
      examples: [
        'She is devoted to her patients, often working overtime.',
        'He has devoted his career to cancer research.',
        'The nurse was devoted to providing compassionate care.',
        'A devoted team worked on the medical breakthrough.',
        'Her devoted attention to detail made her an excellent surgeon.',
      ],
    },
    {
      front: 'chance',
      back: 'шанс',
      examples: [
        'Early detection increases the chance of successful treatment.',
        "There's a good chance the new therapy will work.",
        'He took a chance on the experimental treatment.',
        'Medical research improves the chances of survival for many diseases.',
        "Given the circumstances, there's little chance of full recovery.",
      ],
    },
    {
      front: 'investment',
      back: 'инвестиция, вложение',
      examples: [
        'The government made a significant investment in healthcare infrastructure.',
        'Preventive care is an investment in long-term health.',
        'Pharmaceutical companies invest billions in research and development.',
        "Education is the best investment in a country's future health.",
        'The new hospital represents a major investment in community health.',
      ],
    },
    {
      front: 'resistant',
      back: 'устойчивый, стойкий',
      examples: [
        'Some bacteria have become resistant to common antibiotics.',
        'The new strain of virus is resistant to existing treatments.',
        'Cancer cells can become resistant to chemotherapy over time.',
        'Research focuses on developing drugs against resistant infections.',
        'Antibiotic-resistant superbugs are a major public health concern.',
      ],
    },
    {
      front: 'awareness',
      back: 'осознание, осведомлённость, понимание',
      examples: [
        'Public awareness campaigns have reduced smoking rates.',
        'Increasing awareness about mental health reduces stigma.',
        'Early symptom awareness can save lives in heart attack cases.',
        'The organization promotes awareness about rare diseases.',
        'Medical professionals need awareness of cultural differences in healthcare.',
      ],
    },
    {
      front: 'roughly',
      back: 'грубо, грубо говоря, примерно',
      examples: [
        'Roughly 30% of the population suffers from allergies.',
        'The procedure takes roughly two hours to complete.',
        'Roughly speaking, the treatment is effective in about 70% of cases.',
        'The hospital serves roughly 500 patients daily.',
        'Rough estimates suggest the research will cost $2 million.',
      ],
    },
    {
      front: 'these problems alone justify the search for new treatments',
      back: 'Уже одни эти проблемы оправдывают поиск новых методов лечения',
      examples: [
        'Given the side effects of current medications, these problems alone justify the search for new treatments.',
        'The high cost and limited effectiveness of existing therapies - these problems alone justify the search for new treatments.',
        'When patients suffer from chronic pain with no relief, these problems alone justify the search for new treatments.',
        'The growing antibiotic resistance crisis means these problems alone justify the search for new treatments.',
        'With so many people still dying from the disease, these problems alone justify the search for new treatments.',
      ],
    },
  ];
}

function generateEyeCards() {
  return [
    {
      front: 'Pupil',
      back: 'Зрачок',
      examples: [
        'The doctor checked how her pupils responded to light.',
        'In bright light, the pupil constricts to protect the retina.',
        'Pupil dilation is often used to examine the back of the eye.',
        'Some medications can cause abnormal pupil size.',
        'The pupil appears black because light is absorbed by the retina.',
      ],
    },
    {
      front: 'Choroid',
      back: 'Сосудистая оболочка, Хориоидея',
      examples: [
        'The choroid provides oxygen and nutrients to the outer retina.',
        'Choroidal thickness can be measured with specialized imaging.',
        'The choroid is located between the retina and the sclera.',
        "Certain diseases can affect the choroid's blood vessels.",
        'The choroid helps regulate temperature in the eye.',
      ],
    },
    {
      front: 'Cornea',
      back: 'Роговица',
      examples: [
        'The cornea is the clear front surface of the eye that focuses light.',
        'LASIK surgery reshapes the cornea to correct vision.',
        'Corneal transplants can restore vision in some cases.',
        'The cornea has no blood vessels, getting oxygen directly from air.',
        'Scratches on the cornea can be very painful but usually heal quickly.',
      ],
    },
    {
      front: 'Macula',
      back: 'Макула, Жёлтое пятно',
      examples: [
        'The macula is responsible for central, detailed vision.',
        'Age-related macular degeneration affects the macula.',
        'The macula contains the highest concentration of cone cells.',
        'Damage to the macula can cause loss of central vision.',
        'Macular edema is swelling in the macula that distorts vision.',
      ],
    },
    {
      front: 'Lens',
      back: 'Хрусталик',
      examples: [
        'The lens focuses light onto the retina by changing shape.',
        'Cataracts occur when the lens becomes cloudy.',
        'The lens becomes less flexible with age, causing presbyopia.',
        'Artificial lenses can replace natural ones during cataract surgery.',
        'The lens is located behind the iris and pupil.',
      ],
    },
    {
      front: 'Retina',
      back: 'Сетчатка',
      examples: [
        'The retina converts light into electrical signals for the brain.',
        'Retinal detachment is a medical emergency requiring surgery.',
        'Diabetic retinopathy damages blood vessels in the retina.',
        'The retina contains photoreceptor cells called rods and cones.',
        'Retinal scans are used for biometric identification.',
      ],
    },
    {
      front: 'Optic nerve',
      back: 'Зрительный нерв',
      examples: [
        'The optic nerve carries visual information from the eye to the brain.',
        'Glaucoma damages the optic nerve, leading to vision loss.',
        'The optic nerve is actually part of the central nervous system.',
        'Optic neuritis is inflammation of the optic nerve.',
        'The point where the optic nerve exits the eye creates a blind spot.',
      ],
    },
    {
      front: 'Fovea',
      back: 'Центральная ямка, Фовеа',
      examples: [
        'The fovea is the center of the macula and provides the sharpest vision.',
        'Only cone cells are found in the fovea, allowing detailed color vision.',
        'When you focus directly on an object, its image falls on the fovea.',
        'The fovea has the highest visual acuity of any part of the retina.',
        'Damage to the fovea severely impairs reading and facial recognition.',
      ],
    },
    {
      front: 'Ciliary body',
      back: 'Цилиарное тело, Ресничное тело',
      examples: [
        'The ciliary body produces aqueous humor and controls lens shape.',
        'Ciliary muscles change the lens shape for focusing (accommodation).',
        'The ciliary body is part of the uvea, along with the iris and choroid.',
        'Ciliary body tumors, though rare, can affect eye function.',
        'The ciliary body is located behind the iris.',
      ],
    },
    {
      front: 'Iris',
      back: 'Радужка',
      examples: [
        'The iris gives eyes their color and controls pupil size.',
        'Iris recognition technology uses the unique patterns in the iris.',
        'The iris contains muscles that dilate and constrict the pupil.',
        'Some people have heterochromia, where each iris is a different color.',
        'Inflammation of the iris is called iritis or anterior uveitis.',
      ],
    },
    {
      front: 'Sclera',
      back: 'Склера',
      examples: [
        'The sclera is the white outer layer that protects the eye.',
        'The sclera maintains the shape of the eyeball.',
        'Yellowing of the sclera can indicate liver problems like jaundice.',
        'The sclera is thickest at the back of the eye and thinnest at the front.',
        'Scleral contact lenses rest on the sclera rather than the cornea.',
      ],
    },
    {
      front: 'Anterior Chamber',
      back: 'Передняя камера',
      examples: [
        'The anterior chamber is the space between the cornea and iris.',
        'Aqueous humor fills the anterior chamber, nourishing eye tissues.',
        'Glaucoma often involves increased pressure in the anterior chamber.',
        'The angle of the anterior chamber is important in glaucoma assessment.',
        'Hyphema is bleeding into the anterior chamber, usually from trauma.',
      ],
    },
  ];
}

function generateMedicalAdvancesCards() {
  return [
    {
      front: 'undergo surgery',
      back: 'подвергнуться хирургическому вмешательству, перенести операцию',
      examples: [
        'The patient will undergo surgery tomorrow morning to remove the tumor.',
        'She had to undergo surgery after the car accident.',
        'Modern techniques mean many surgeries are minimally invasive.',
        'He was nervous about undergoing surgery for the first time.',
        'The decision to undergo surgery should be made with your doctor.',
      ],
    },
    {
      front: 'hygiene',
      back: 'гигиена',
      examples: [
        'Good personal hygiene is essential for preventing disease spread.',
        'Hospital hygiene protocols have reduced infection rates significantly.',
        'Dental hygiene includes brushing, flossing, and regular checkups.',
        'Food hygiene standards protect consumers from contamination.',
        'Public health campaigns promote hand hygiene to prevent flu transmission.',
      ],
    },
    {
      front: 'food poisoning',
      back: 'пищевое отравление',
      examples: [
        'Several people got food poisoning from the poorly prepared buffet.',
        'Symptoms of food poisoning usually appear within hours of eating.',
        'Proper food storage and cooking prevent most cases of food poisoning.',
        'Severe food poisoning may require hospitalization and IV fluids.',
        'Reporting food poisoning helps health departments identify outbreaks.',
      ],
    },
    {
      front: 'treat constipation',
      back: 'лечить запор',
      examples: [
        'Increasing fiber intake and water consumption can help treat constipation.',
        'Doctors may recommend gentle laxatives to treat constipation temporarily.',
        'Regular exercise is often advised to treat and prevent constipation.',
        'Some medications list constipation as a side effect that needs treatment.',
        'Chronic constipation may require medical evaluation to treat underlying causes.',
      ],
    },
    {
      front: 'laxatives',
      back: 'слабительные',
      examples: [
        'Laxatives should be used cautiously and only when necessary.',
        'Some laxatives work by drawing water into the intestines.',
        'Overuse of laxatives can lead to dependency and electrolyte imbalances.',
        'Natural laxatives include prunes, kiwi, and certain herbal teas.',
        'Doctors may prescribe laxatives before certain medical procedures.',
      ],
    },
    {
      front: 'sneeze',
      back: 'чихать',
      examples: [
        'Cover your mouth and nose when you sneeze to prevent spreading germs.',
        'Some people sneeze when exposed to bright sunlight.',
        'A sneeze can expel particles at speeds up to 100 miles per hour.',
        'Allergies often cause frequent sneezing and runny nose.',
        'The urge to sneeze is called the sternutatory reflex.',
      ],
    },
    {
      front: 'a blister',
      back: 'волдырь',
      examples: [
        "New shoes often cause blisters until they're broken in.",
        'Second-degree burns typically cause painful blisters.',
        "It's usually best not to pop a blister, as the skin protects against infection.",
        'Friction blisters form when skin repeatedly rubs against a surface.',
        'Some diseases like chickenpox cause blister-like rashes.',
      ],
    },
    {
      front: 'stuck out',
      back: 'выставить, торчать, высовываться',
      examples: [
        'The nail was stuck out from the board and needed hammering down.',
        'His ears stuck out from under his hat.',
        "Don't stick your arm out the car window while driving.",
        'The peninsula sticks out into the ocean for several miles.',
        'The broken bone was sticking out through the skin in the injury.',
      ],
    },
    {
      front: 'a wound',
      back: 'рана',
      examples: [
        'The deep wound required stitches to heal properly.',
        'Proper wound care prevents infection and promotes healing.',
        'He suffered a gunshot wound during the incident.',
        'Psychological wounds can take longer to heal than physical ones.',
        'The nurse cleaned and dressed the wound daily.',
      ],
    },
    {
      front: 'painkillers',
      back: 'обезболивающие препараты',
      examples: [
        'Over-the-counter painkillers like ibuprofen can relieve mild to moderate pain.',
        'After surgery, stronger prescription painkillers may be necessary.',
        'Some painkillers carry risk of addiction if used long-term.',
        'Natural painkillers include heat, cold, and certain herbal remedies.',
        'Always follow dosage instructions when taking painkillers.',
      ],
    },
    {
      front: 'treat a condition',
      back: 'лечить какое-либо заболевание',
      examples: [
        'Early intervention is crucial to effectively treat a condition.',
        'Different approaches may be needed to treat the same condition in different patients.',
        'Modern medicine has developed new ways to treat conditions once considered untreatable.',
        'Some conditions require lifelong treatment to manage symptoms.',
        'The goal is not just to treat the condition but to improve quality of life.',
      ],
    },
    {
      front: 'ankle',
      back: 'лодыжка',
      examples: [
        'She twisted her ankle while hiking on uneven terrain.',
        'Ankle sprains are one of the most common sports injuries.',
        'The ankle joint connects the foot to the lower leg.',
        'He wore an ankle brace during recovery from the injury.',
        'Swelling around the ankle can indicate various medical issues.',
      ],
    },
    {
      front: 'have a checkup',
      back: 'пройти обследование',
      examples: [
        "It's important to have a checkup with your doctor at least once a year.",
        'The company requires employees to have a medical checkup annually.',
        'She scheduled to have a checkup before starting her new exercise regimen.',
        'Children need to have regular checkups to monitor growth and development.',
        'Having a dental checkup every six months helps prevent serious problems.',
      ],
    },
    {
      front: 'excessively',
      back: 'чрезмерно, избыточно',
      examples: [
        'Drinking alcohol excessively can damage the liver over time.',
        'She worries excessively about things that are unlikely to happen.',
        'Excessively high blood pressure requires medical management.',
        'The medication caused him to sweat excessively.',
        'Exercising excessively without proper rest can lead to injury.',
      ],
    },
    {
      front: 'pass from',
      back: 'передаваться от',
      examples: [
        'Some diseases can pass from animals to humans.',
        'Traditions often pass from one generation to the next.',
        'The virus can pass from person to person through close contact.',
        'Knowledge should pass from teachers to students effectively.',
        'Genetic conditions may pass from parents to children.',
      ],
    },
    {
      front: 'sprain',
      back: 'растяжение, вывих',
      examples: [
        'A sprain involves damage to ligaments, while a strain affects muscles.',
        'The RICE method (Rest, Ice, Compression, Elevation) helps treat sprains.',
        'Ankle sprains are common in basketball and soccer players.',
        'Severe sprains may require physical therapy for full recovery.',
        'Wrist sprains often occur when people fall on outstretched hands.',
      ],
    },
    {
      front: 'a sunburn',
      back: 'солнечный ожог',
      examples: [
        'She got a painful sunburn after falling asleep at the beach.',
        'Repeated sunburns increase the risk of skin cancer.',
        'Aloe vera gel can soothe the discomfort of a sunburn.',
        'A severe sunburn can cause blisters, fever, and chills.',
        'Prevention with sunscreen is better than treating a sunburn.',
      ],
    },
    {
      front: 'despite all my injuries',
      back: 'несмотря на все мои травмы',
      examples: [
        'Despite all my injuries, I finished the marathon.',
        'He returned to work despite all his injuries from the accident.',
        "Despite all my injuries, the doctor says I'll make a full recovery.",
        'She continued to care for her family despite all her injuries.',
        "Despite all my injuries, I'm grateful to be alive.",
      ],
    },
    {
      front: 'to soap',
      back: 'намыливать',
      examples: [
        'Make sure to soap your hands thoroughly for at least 20 seconds.',
        'The instructions say to soap the affected area before rinsing.',
        'Children need to learn how to properly soap their hands.',
        'He soaped the car before rinsing it with a hose.',
        'To remove stubborn dirt, you need to soap the fabric and let it sit.',
      ],
    },
    {
      front: 'fall ill, get sick',
      back: 'заболеть',
      examples: [
        'Several employees fell ill after eating at the company cafeteria.',
        'Children often get sick when they start daycare or school.',
        'She fell ill suddenly and had to be hospitalized.',
        'To prevent getting sick, maintain good hygiene and a healthy diet.',
        'He got sick while traveling abroad and needed medical attention.',
      ],
    },
    {
      front: 'runny nose',
      back: 'насморк',
      examples: [
        'A runny nose is a common symptom of colds and allergies.',
        'She always gets a runny nose when the weather turns cold.',
        'Antihistamines can help control allergy-related runny nose.',
        'A runny nose along with fever may indicate flu rather than a cold.',
        'The child had a constantly runny nose during winter.',
      ],
    },
    {
      front: 'sleeping pills',
      back: 'снотворное',
      examples: [
        'Sleeping pills should only be used short-term for insomnia.',
        'Some sleeping pills can cause dependency if used regularly.',
        'Natural alternatives to sleeping pills include meditation and herbal tea.',
        'The doctor prescribed sleeping pills for her temporary insomnia.',
        "Sleeping pills may help initially but don't address underlying sleep issues.",
      ],
    },
    {
      front: 'a stomach bug',
      back: 'расстройство желудка',
      examples: [
        'Half the office has a stomach bug this week.',
        'A stomach bug typically causes nausea, vomiting, and diarrhea.',
        'Stomach bugs are often caused by viruses and spread quickly.',
        'Rest and clear fluids are the best treatment for a stomach bug.',
        'She caught a stomach bug while traveling and missed two days of her vacation.',
      ],
    },
    {
      front: 'contagious',
      back: 'заразный',
      examples: [
        'The flu is highly contagious, especially in the first few days.',
        "Laughter is contagious and can improve everyone's mood.",
        'Some diseases are contagious even before symptoms appear.',
        'Contagious illnesses require isolation to prevent spreading.',
        'His enthusiasm was contagious and motivated the whole team.',
      ],
    },
    {
      front: 'a rash',
      back: 'сыпь',
      examples: [
        'The baby developed a rash after trying a new food.',
        'Some medications can cause a rash as a side effect.',
        'A rash that spreads quickly or is accompanied by fever needs medical attention.',
        'Poison ivy typically causes an itchy, blistering rash.',
        'Heat rash is common in hot, humid weather, especially in infants.',
      ],
    },
    {
      front: 'cough syrup',
      back: 'сироп от кашля',
      examples: [
        'Cough syrup can help relieve dry, irritating coughs.',
        'Some cough syrups contain codeine and require a prescription.',
        'Natural cough syrups often include honey and lemon.',
        'The pharmacist recommended a cough syrup for her persistent cough.',
        "Children's cough syrup has different dosages than adult versions.",
      ],
    },
    {
      front: 'spreader of infections',
      back: 'распространитель инфекций',
      examples: [
        'Airports can be major spreaders of infections during pandemics.',
        'Children in daycare are often spreaders of infections to their families.',
        'Asymptomatic carriers can be spreaders of infections without knowing it.',
        'Proper hand hygiene makes you less likely to be a spreader of infections.',
        'Mosquitoes are spreaders of infections like malaria and dengue fever.',
      ],
    },
    {
      front: 'endure pain',
      back: 'терпеть боль',
      examples: [
        'She had to endure pain during her long recovery from surgery.',
        'Some cultures teach people to endure pain without showing discomfort.',
        "Modern medicine offers many options so patients don't have to endure pain unnecessarily.",
        'Athletes often endure pain to compete at high levels.',
        'Chronic pain patients learn strategies to endure pain daily.',
      ],
    },
    {
      front: 'come round',
      back: 'приходить в себя',
      examples: [
        'After fainting, it took her several minutes to come round.',
        'The patient began to come round from the anesthesia.',
        'He was knocked unconscious but came round after a few seconds.',
        'It took her a while to come round to the idea of moving abroad.',
        'After the shock, she slowly came round and started thinking clearly again.',
      ],
    },
    {
      front: 'insomnia',
      back: 'бессонница',
      examples: [
        'Chronic insomnia affects both falling asleep and staying asleep.',
        'Stress and anxiety are common causes of temporary insomnia.',
        'Cognitive behavioral therapy is often effective for treating insomnia.',
        'Shift workers frequently experience insomnia due to disrupted sleep patterns.',
        'Some people have insomnia their entire lives despite trying various treatments.',
      ],
    },
    {
      front: 'to dry',
      back: 'сушить',
      examples: [
        'Hang the clothes outside to dry in the sun.',
        'The medication may dry out your skin as a side effect.',
        'She used a towel to dry her hair after swimming.',
        'Dehydrated foods are dried to preserve them longer.',
        'The desert air will quickly dry the washed car.',
      ],
    },
    {
      front: 'minor',
      back: 'незначительный',
      examples: [
        'She suffered only minor injuries in the accident.',
        'The repair required only minor adjustments to the mechanism.',
        "Minor symptoms don't usually require medical attention.",
        'There were minor differences between the two versions of the document.',
        'He made a minor mistake that was easily corrected.',
      ],
    },
    {
      front: 'bumps',
      back: 'шишки (на голове)',
      examples: [
        'The child got several bumps on his head from falling.',
        'Put ice on bumps to reduce swelling.',
        'Goosebumps are tiny bumps on the skin caused by cold or emotion.',
        'The road was full of bumps that made for an uncomfortable ride.',
        'Skin bumps can be caused by various conditions from acne to infections.',
      ],
    },
    {
      front: 'a sprained ankle',
      back: 'вывихнутая лодыжка',
      examples: [
        'She got a sprained ankle during soccer practice.',
        'A sprained ankle typically swells and bruises quickly.',
        'Crutches help keep weight off a sprained ankle during healing.',
        'Physical therapy exercises can strengthen a previously sprained ankle.',
        'He wrapped his sprained ankle with an elastic bandage for support.',
      ],
    },
    {
      front: 'throw up',
      back: 'рвать',
      examples: [
        'The amusement park ride made him feel like he might throw up.',
        'Food poisoning often causes people to throw up repeatedly.',
        'Some chemotherapy patients throw up as a side effect of treatment.',
        'If you throw up after taking medication, check if you need another dose.',
        'The child threw up in the car during the long, winding drive.',
      ],
    },
    {
      front: 'pass out, faint',
      back: 'потерять сознание',
      examples: [
        'She felt dizzy and thought she might pass out.',
        'Some people faint at the sight of blood.',
        'Dehydration and heat exhaustion can cause people to pass out.',
        'He passed out briefly after standing up too quickly.',
        'If someone faints, lay them down and elevate their legs.',
      ],
    },
    {
      front: 'catch a cold',
      back: 'простудиться',
      examples: [
        'Children catch colds more frequently than adults.',
        "You're more likely to catch a cold when you're stressed or tired.",
        'Despite washing her hands frequently, she still caught a cold.',
        "Vitamin C doesn't prevent colds but may reduce their duration.",
        'He caught a cold from his coworker who came to work sick.',
      ],
    },
    {
      front: 'cold-like symptoms',
      back: 'симптомы, похожие на простуду',
      examples: [
        'The new virus initially causes cold-like symptoms before progressing.',
        'Allergies can produce cold-like symptoms such as runny nose and sneezing.',
        'Some serious illnesses begin with mild cold-like symptoms.',
        'The flu often starts with cold-like symptoms but becomes more severe.',
        'She had cold-like symptoms for a day before developing a fever.',
      ],
    },
    {
      front: 'digest food',
      back: 'переваривать пищу',
      examples: [
        'It takes the body several hours to completely digest food.',
        'Some people have difficulty digesting certain foods like dairy or gluten.',
        'Chewing thoroughly helps your stomach digest food more easily.',
        'Enzymes in the digestive system help break down and digest food.',
        'As we age, our bodies may become less efficient at digesting food.',
      ],
    },
    {
      front: 'a bruise',
      back: 'синяк',
      examples: [
        'She got a nasty bruise on her arm from bumping into the door.',
        'Bruises change color from purple to green to yellow as they heal.',
        'Some people bruise more easily than others, especially as they age.',
        'The apple had a bruise on one side where it had been dropped.',
        'Apply ice immediately to minimize bruising after an injury.',
      ],
    },
    {
      front: 'life expectancy',
      back: 'продолжительность жизни',
      examples: [
        'Life expectancy has increased significantly over the past century.',
        'Women generally have higher life expectancy than men.',
        'Access to healthcare greatly affects life expectancy in different regions.',
        'Smoking reduces life expectancy by several years on average.',
        'Medical advances continue to push life expectancy higher in developed countries.',
      ],
    },
  ];
}

function generateTEDCards() {
  return [
    {
      front: 'To fan the flame of humanity',
      back: 'раздувать пламя человечности',
      examples: [
        'Through her advocacy work, she continues to fan the flame of humanity in others.',
        'Small acts of kindness can fan the flame of humanity in a冷漠world.',
        'The documentary aimed to fan the flame of humanity by showing stories of compassion.',
        'In difficult times, we must fan the flame of humanity rather than succumb to despair.',
        'His speech was designed to fan the flame of humanity and inspire social change.',
      ],
    },
    {
      front: 'To be at rock bottom',
      back: 'быть на самом дне',
      examples: [
        'After losing his job and home, he felt he was at rock bottom.',
        'Her addiction brought her to rock bottom before she sought help.',
        "When you're at rock bottom, the only way is up.",
        'The company was at rock bottom financially before the turnaround.',
        'She described the accident as hitting rock bottom in her life.',
      ],
    },
    {
      front: 'To pump legs',
      back: 'разминать ноги',
      examples: [
        'After sitting for hours, she stood up to pump her legs and get circulation going.',
        'The physical therapist taught him exercises to pump his legs during recovery.',
        'Before the race, athletes pump their legs to warm up their muscles.',
        'He would pump his legs on the swing to go higher and higher.',
        'To prevent blood clots during long flights, remember to pump your legs occasionally.',
      ],
    },
    {
      front: 'To let go of smth',
      back: 'отпустить что-либо',
      examples: [
        'She needed to let go of past resentments to move forward.',
        'Sometimes you have to let go of control and trust the process.',
        'He finally let go of his childhood dream to pursue a more practical career.',
        'Letting go of expectations can lead to greater happiness.',
        'The therapy helped her let go of traumatic memories.',
      ],
    },
    {
      front: 'Ward',
      back: 'палата',
      examples: [
        'She was moved from ICU to a regular ward after her condition stabilized.',
        "The children's ward was decorated with bright colors and cartoon characters.",
        'Hospital wards are often organized by medical specialty.',
        'He spent two weeks in the psychiatric ward receiving treatment.',
        'The maternity ward was busy with several births that night.',
      ],
    },
    {
      front: 'Alight',
      back: 'зажжённый',
      examples: [
        'Her face was alight with excitement when she heard the good news.',
        'The candles were alight, casting a warm glow over the dinner table.',
        'The building was set alight during the protests.',
        'His eyes were alight with curiosity as he listened to the story.',
        'The night sky was alight with fireworks during the celebration.',
      ],
    },
    {
      front: 'To take smth for granted',
      back: 'принимать что-либо как должное',
      examples: [
        'We often take our health for granted until we lose it.',
        "Don't take your loved ones for granted - show appreciation regularly.",
        'He took his job for granted and was shocked when he was laid off.',
        'Modern conveniences like electricity are things we take for granted.',
        'The accident made her realize she had taken her mobility for granted.',
      ],
    },
    {
      front: 'Bliss',
      back: 'счастье',
      examples: [
        'Lying on the beach with a good book was pure bliss.',
        'The first few months of their marriage were domestic bliss.',
        'Ignorance is bliss, as the saying goes.',
        'She found bliss in simple pleasures like gardening and baking.',
        'The meditation retreat promised a week of peace and bliss.',
      ],
    },
    {
      front: 'To be at a crossroads',
      back: 'быть на распутье',
      examples: [
        'Graduating from college, she felt she was at a crossroads in her life.',
        'The company is at a crossroads - either adapt to new technology or become obsolete.',
        'At 40, he found himself at a crossroads, unsure whether to change careers.',
        'Their relationship was at a crossroads after the disagreement.',
        'The country stands at a crossroads between tradition and modernization.',
      ],
    },
    {
      front: 'To suck in air',
      back: 'вдыхать воздух',
      examples: [
        'She sucked in air sharply when she saw the unexpected sight.',
        'Before diving, he sucked in air deeply to fill his lungs.',
        'The asthma attack made it difficult for her to suck in air.',
        'He sucked in air through his teeth, a habit when concentrating.',
        'The vacuum cleaner sucks in air along with dirt and debris.',
      ],
    },
    {
      front: 'Spinal cord',
      back: 'спинной мозг',
      examples: [
        'The injury damaged his spinal cord, resulting in paralysis.',
        'The spinal cord transmits signals between the brain and the body.',
        'Spinal cord research offers hope for paralysis treatments.',
        'The vertebrae protect the delicate spinal cord.',
        'A spinal cord injury can have life-changing consequences.',
      ],
    },
    {
      front: 'To become airborne',
      back: 'оторваться от земли',
      examples: [
        'The plane became airborne just as the storm began.',
        'The virus can become airborne through coughing and sneezing.',
        'The helicopter struggled to become airborne in the thin mountain air.',
        'Dust particles become airborne during construction work.',
        'The space shuttle becomes airborne attached to its booster rockets.',
      ],
    },
    {
      front: 'Internal bleeding',
      back: 'внутреннее кровотечение',
      examples: [
        "The car crash caused internal bleeding that wasn't immediately apparent.",
        'Internal bleeding can be life-threatening if not detected and treated quickly.',
        'Some medications increase the risk of internal bleeding.',
        'The boxer suffered internal bleeding after the brutal match.',
        'Symptoms of internal bleeding include dizziness, fainting, and abdominal pain.',
      ],
    },
    {
      front: 'To be tied to smth',
      back: 'быть привязанным к чему-либо',
      examples: [
        'Her success is tied to her relentless work ethic.',
        'He felt tied to his hometown despite opportunities elsewhere.',
        "The company's future is tied to the success of this new product.",
        'She was tied to her bed during recovery from surgery.',
        'Our fates seem to be tied together in unexpected ways.',
      ],
    },
    {
      front: 'To grasp',
      back: 'осознать',
      examples: [
        'It took her a moment to grasp the full implications of the news.',
        'Children gradually grasp complex concepts as they develop.',
        "He couldn't grasp why she would make such a decision.",
        'The magnitude of the disaster was difficult to grasp.',
        'She finally grasped the solution to the problem after hours of thought.',
      ],
    },
    {
      front: 'To head towards smth',
      back: 'направляться к чему-либо',
      examples: [
        'The ship was heading towards the storm despite warnings.',
        'We need to head towards sustainable energy solutions.',
        'His career seems to be heading towards political office.',
        'The conversation was heading towards uncomfortable territory.',
        'The economy appears to be heading towards recession.',
      ],
    },
    {
      front: 'Spectacular',
      back: 'захватывающий',
      examples: [
        'The fireworks display was absolutely spectacular.',
        'She made a spectacular recovery after the serious illness.',
        'The view from the mountaintop was spectacular at sunrise.',
        "The team's spectacular comeback won them the championship.",
        'The ballet performance was technically difficult and visually spectacular.',
      ],
    },
    {
      front: 'Cockpit',
      back: 'кабина пилотов',
      examples: [
        'The pilot welcomed the children into the cockpit before the flight.',
        'Modern aircraft cockpits are filled with digital displays.',
        'The cockpit voice recorder was recovered after the crash.',
        'Access to the cockpit is strictly controlled for security reasons.',
        "The race car's cockpit is designed for safety and efficiency.",
      ],
    },
  ];
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
