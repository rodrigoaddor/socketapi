//   STATUS   //
export type GameStage = 'waiting' | 'question' | 'answer' | 'result';

export interface BaseStatus {
  stage: GameStage;
  players: number;
  ready: number;
}

export interface AnswerStatus extends BaseStatus {
  stage: 'answer';
  questions: string[];
}

export interface ResultStatus extends BaseStatus {
  stage: 'result';
  answers: [string, string[]];
}

export type Status = BaseStatus | AnswerStatus | ResultStatus;

//   QUESTIONS   //
export type QuestionType = 'open' | 'choices';

interface BaseQuestion {
  title: string;
  type: QuestionType;
}

export interface OpenQuestion extends BaseQuestion {
  type: 'open';
}

export interface ChoiceQuestion extends BaseQuestion {
  type: 'choices';
  options: string[];
  max: number;
}

export type QuestionData = OpenQuestion | ChoiceQuestion;
