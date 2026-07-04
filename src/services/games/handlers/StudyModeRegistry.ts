import { BadRequestError } from '../../../exceptions';
import { StudyMode } from '../studyMode.const';
import { StudyModeHandler } from './StudyModeHandler';
import writeModeHandler, { WriteModeHandler } from './WriteModeHandler';
import revealModeHandler, { RevealModeHandler } from './RevealModeHandler';
import matchModeHandler, { MatchModeHandler } from './MatchModeHandler';

export class StudyModeRegistry {
  private readonly handlers = new Map<StudyMode, StudyModeHandler>();

  constructor(handlers: StudyModeHandler[]) {
    for (const handler of handlers) {
      this.handlers.set(handler.mode, handler);
    }
  }

  getHandler(mode: StudyMode): StudyModeHandler {
    const handler = this.handlers.get(mode);
    if (!handler) {
      throw new BadRequestError(`Study mode "${mode}" is not supported yet`);
    }

    return handler;
  }
}

export default new StudyModeRegistry([
  writeModeHandler as WriteModeHandler,
  revealModeHandler as RevealModeHandler,
  matchModeHandler as MatchModeHandler,
]);
