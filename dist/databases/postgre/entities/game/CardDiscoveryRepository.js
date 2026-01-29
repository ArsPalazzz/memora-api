"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardDiscoveryRepository = void 0;
const Table_1 = __importDefault(require("../Table"));
class CardDiscoveryRepository extends Table_1.default {
    async getCardForFeed(params) {
        const { userSub, exclude, searchQuery, limit, sessionId, cardOrientation } = params;
        const random = Math.random();
        const query = {
            name: 'getCardForFeed',
            text: `
 WITH candidate_cards AS (
  SELECT
    c.sub,
    c.front_variants,
    c.back_variants,
    c.image_uuid,
    c.global_shown_count,
    c.global_like_count,
    c.global_answer_count,
    c.desk_sub,
    c.copy_of,
    d.title as desk_title,
    d.creator_sub as desk_creator_sub,
    COALESCE(ts_rank(c.desk_sub_text_search,
      to_tsquery('english', $2)
    ), 0) as topic_relevance,
    CASE
      WHEN c.global_shown_count = 0 THEN 0
      ELSE (c.global_like_count * 1.0 / c.global_shown_count)
    END as popularity_score,
    EXTRACT(EPOCH FROM (NOW() - c.created_at)) / 86400 as days_old,
    EXISTS (
      SELECT 1 FROM games.session_card sc
      WHERE sc.card_sub = c.sub 
        AND sc.session_id = $5
    ) as shown_in_current_session
  FROM cards.card c
  JOIN cards.desk d ON d.sub = c.desk_sub
  WHERE
    d.public = true
    AND c.copy_of IS NULL
    AND d.creator_sub != $1
    AND (CASE 
      WHEN $3::uuid[] IS NULL OR array_length($3::uuid[], 1) IS NULL THEN true
      ELSE NOT (c.sub = ANY($3::uuid[]))
    END)
    AND NOT EXISTS (
      SELECT 1 FROM cards.card uc
      JOIN cards.desk ud ON ud.sub = uc.desk_sub
      WHERE uc.copy_of = c.id
        AND ud.creator_sub = $1
    )
    AND c.global_shown_count < 1000
),
current_session_cards AS (
  SELECT DISTINCT sc.card_sub
  FROM games.session_card sc
  WHERE sc.session_id = $5
),
scored_cards AS (
  SELECT *,
    (topic_relevance * 0.4) +
    (popularity_score * 0.3) +
    (CASE WHEN days_old < 30 THEN (30 - days_old) / 30 * 0.2 ELSE 0 END) +
    (CASE WHEN NOT shown_in_current_session THEN 0.2 ELSE -1.0 END) +
    (RANDOM() * 0.1) as final_score
  FROM candidate_cards
  WHERE NOT EXISTS (
    SELECT 1 FROM current_session_cards csc WHERE csc.card_sub = sub
  )
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
        return await this.getItems(query);
    }
    async updateCardStatsAnswerCount(cardSub) {
        const query = {
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
    async updateCardStatsLikeCount(cardSub) {
        const query = {
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
    async updateCardStatsShownCount(cardSub) {
        const query = {
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
    async analyzeCardTopics(cardSubs) {
        if (cardSubs.length === 0)
            return [];
        const query = {
            name: 'analyzeCardTopics',
            text: `
        SELECT DISTINCT d.title as desk_title
        FROM cards.card c
        JOIN cards.desk d ON d.sub = c.desk_sub
        WHERE c.sub = ANY($1)
      `,
            values: [cardSubs],
        };
        const result = await this.getItems(query);
        const topics = new Set();
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
exports.CardDiscoveryRepository = CardDiscoveryRepository;
exports.default = new CardDiscoveryRepository();
