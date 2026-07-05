import Table, { PgTransaction } from '../Table';
import { Query } from '../../index';
import { CARD_ORIENTATION } from '../../../../services/cards/card.const';

interface GetCardForFeedParams {
  userSub: string;
  exclude: string[];
  searchQuery: string;
  limit: number;
  sessionId: string;
  cardOrientation: CARD_ORIENTATION;
}

export class CardDiscoveryRepository extends Table {
  async getCardForFeed(params: GetCardForFeedParams) {
    const { userSub, exclude, searchQuery, limit, sessionId, cardOrientation } = params;

    const random = Math.random();

    const query: Query = {
      name: 'getCardForFeed',
      text: `
 WITH current_session_cards AS (
  SELECT sc.card_sub
  FROM games.session_card sc
  WHERE sc.session_id = $5
),
user_copied_original_ids AS (
  SELECT uc.copy_of AS original_id
  FROM cards.card uc
  INNER JOIN cards.desk ud ON ud.sub = uc.desk_sub AND ud.creator_sub = $1
  WHERE uc.copy_of IS NOT NULL
),
candidate_cards AS (
  SELECT
    c.sub,
    c.front_variants,
    c.back_variants,
    c.image_uuid,
    c.global_shown_count,
    c.global_like_count,
    c.global_answer_count,
    c.desk_sub,
    d.title as desk_title,
    ds.front_language,
    ds.back_language,
    CASE
      WHEN $2 = '' THEN 0
      ELSE COALESCE(
        ts_rank(
          c.desk_sub_text_search,
          to_tsquery('english', $2)
        ),
        0
      )
    END as topic_relevance,
    CASE
      WHEN c.global_shown_count = 0 THEN 0
      ELSE (c.global_like_count * 1.0 / c.global_shown_count)
    END as popularity_score,
    EXTRACT(EPOCH FROM (NOW() - c.created_at)) / 86400 as days_old
  FROM cards.card c
  INNER JOIN cards.desk d
    ON d.sub = c.desk_sub
    AND d.public = true
    AND d.creator_sub != $1
  INNER JOIN cards.desk_settings ds ON ds.desk_sub = c.desk_sub
  LEFT JOIN current_session_cards csc ON csc.card_sub = c.sub
  LEFT JOIN user_copied_original_ids uco ON uco.original_id = c.id
  WHERE
    c.copy_of IS NULL
    AND c.global_shown_count < 1000
    AND csc.card_sub IS NULL
    AND uco.original_id IS NULL
    AND (
      $3::uuid[] IS NULL
      OR array_length($3::uuid[], 1) IS NULL
      OR NOT (c.sub = ANY($3::uuid[]))
    )
),
random_pool AS (
  SELECT *
  FROM candidate_cards cc
  WHERE mod(abs(hashtextextended(cc.sub::text || $5::text, 0)), 4) = 0
  UNION ALL
  SELECT *
  FROM candidate_cards cc
  WHERE NOT EXISTS (
    SELECT 1
    FROM candidate_cards sampled
    WHERE mod(abs(hashtextextended(sampled.sub::text || $5::text, 0)), 4) = 0
  )
  LIMIT GREATEST($4::int * 100, 400)
),
scored_cards AS (
  SELECT
    rp.*,
    (topic_relevance * 0.4) +
    (popularity_score * 0.3) +
    (CASE WHEN days_old < 30 THEN (30 - days_old) / 30 * 0.2 ELSE 0 END) +
    (RANDOM() * 0.1) as final_score
  FROM random_pool rp
  ORDER BY final_score DESC
  LIMIT $4
),
card_examples AS (
  SELECT
    ce.card_sub,
    ARRAY_AGG(ce.sentence) as examples
  FROM cards.card_examples ce
  WHERE ce.card_sub IN (SELECT sub FROM scored_cards)
  GROUP BY ce.card_sub
)
SELECT
  sc.sub,
  CASE 
    WHEN $6 = 'normal' THEN sc.front_variants
    WHEN $6 = 'reversed' THEN sc.back_variants
    WHEN $6 = 'mixed' THEN 
      CASE 
        WHEN $7 > 0.5 THEN sc.front_variants
        ELSE sc.back_variants
      END
    ELSE sc.front_variants
  END as front_variants,
  CASE 
    WHEN $6 = 'normal' THEN sc.back_variants
    WHEN $6 = 'reversed' THEN sc.front_variants
    WHEN $6 = 'mixed' THEN 
      CASE 
        WHEN $7 > 0.5 THEN sc.back_variants
        ELSE sc.front_variants
      END
    ELSE sc.back_variants
  END as back_variants,
  sc.image_uuid,
  sc.global_shown_count,
  sc.global_like_count,
  sc.global_answer_count,
  sc.desk_sub,
  sc.desk_title,
  sc.front_language,
  sc.back_language,
  COALESCE(ce.examples, ARRAY[]::text[]) as examples,
  CASE 
    WHEN $6 = 'normal' THEN 'front_to_back'
    WHEN $6 = 'reversed' THEN 'back_to_front'
    WHEN $6 = 'mixed' THEN 
      CASE 
        WHEN $7 > 0.5 THEN 'front_to_back'
        ELSE 'back_to_front'
      END
    ELSE 'front_to_back'
  END as card_direction
FROM scored_cards sc
LEFT JOIN card_examples ce ON ce.card_sub = sc.sub
ORDER BY sc.final_score DESC
      `,
      values: [userSub, searchQuery, exclude, limit, sessionId, cardOrientation, random],
    };

    return await this.getItems<{
      sub: string;
      front_variants: string[];
      back_variants: string[];
      image_uuid?: string;
      global_shown_count: number;
      global_like_count: number;
      global_answer_count: number;
      desk_sub: string;
      desk_title: string;
      front_language: string;
      back_language: string;
      examples: string[];
      card_direction: 'front_to_back' | 'back_to_front';
    }>(query);
  }

  async updateCardStatsAnswerCount(cardSub: string) {
    const query: Query = {
      name: 'updateCardStatsAnswerCount',
      text: `
        UPDATE cards.card 
        SET global_answer_count = global_answer_count + 1
        WHERE sub = $1
      `,
      values: [cardSub],
    };

    return this.updateItems(query);
  }

  async updateCardStatsLikeCount(cardSub: string) {
    const query: Query = {
      name: 'updateCardStatsLikeCount',
      text: `
        UPDATE cards.card 
        SET global_like_count = global_like_count + 1
        WHERE sub = $1
      `,
      values: [cardSub],
    };

    return this.updateItems(query);
  }

  async updateCardStatsShownCount(cardSub: string) {
    const query: Query = {
      name: 'updateCardStatsShownCount',
      text: `
        UPDATE cards.card 
        SET global_shown_count = global_shown_count + 1
        WHERE sub = $1
      `,
      values: [cardSub],
    };

    return this.updateItems(query);
  }

  async analyzeCardTopics(cardSubs: string[]) {
    if (cardSubs.length === 0) return [];

    const query: Query = {
      name: 'analyzeCardTopics',
      text: `
        SELECT DISTINCT d.title as desk_title
        FROM cards.card c
        JOIN cards.desk d ON d.sub = c.desk_sub
        WHERE c.sub = ANY($1)
      `,
      values: [cardSubs],
    };

    const result = await this.getItems<{ desk_title: string }>(query);

    const topics = new Set<string>();
    result.forEach((row) => {
      const words = row.desk_title
        .toLowerCase()
        .split(/[^a-zA-Z0-9]/)
        .filter((word) => word.length > 3 && word.length < 20);

      words.forEach((word) => topics.add(word));
    });

    return Array.from(topics);
  }
}

export default new CardDiscoveryRepository();
