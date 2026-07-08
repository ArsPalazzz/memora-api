import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { checkAnswerCorrectness } from '../../../utils/answerGrading';
import {
  applyAnswerToScoreState,
  createInitialScoreState,
  computePlacement,
} from './duelScoring';
import { getExpectedCardIndex } from './duelRace.utils';
import { DuelAnswerRecord } from './duel.types';

describe('duel race grading pipeline', () => {
  it('uses server-side grading that ignores client assumptions', () => {
    const correct = checkAnswerCorrectness('hello', ['Hello (greeting)']);
    assert.equal(correct, true);

    const wrong = checkAnswerCorrectness('bye', ['Hello (greeting)']);
    assert.equal(wrong, false);
  });

  it('persists score state that matches server grading', () => {
    const backVariants = ['world', 'earth'];
    const answers: DuelAnswerRecord[] = [];

    const firstCorrect = checkAnswerCorrectness('world', backVariants);
    assert.equal(firstCorrect, true);

    let scoreState = createInitialScoreState();
    scoreState = applyAnswerToScoreState(scoreState, { correct: firstCorrect, durationMs: 800 });
    answers.push({
      cardIndex: 0,
      cardSub: 'card-1',
      answer: 'world',
      correct: firstCorrect,
      durationMs: 800,
    });

    const secondWrong = checkAnswerCorrectness('nope', backVariants);
    scoreState = applyAnswerToScoreState(scoreState, { correct: secondWrong, durationMs: 700 });
    answers.push({
      cardIndex: 1,
      cardSub: 'card-2',
      answer: 'nope',
      correct: secondWrong,
      durationMs: 700,
    });

    assert.equal(getExpectedCardIndex(answers), 2);
    assert.equal(scoreState.correctCount, 1);
    assert.equal(scoreState.wrongCount, 1);
    assert.ok(scoreState.score > 0);
    assert.equal(answers.every((entry) => entry.correct === checkAnswerCorrectness(entry.answer, backVariants)), true);
  });

  it('finishes with deterministic placement', () => {
    const ranked = computePlacement([
      { userSub: 'a', score: 300, totalTimeMs: 4000, correctCount: 5 },
      { userSub: 'b', score: 250, totalTimeMs: 3500, correctCount: 5 },
    ]);

    assert.deepEqual(
      ranked.map((entry) => [entry.userSub, entry.placement]),
      [
        ['a', 1],
        ['b', 2],
      ]
    );
  });
});
