import { Socket } from 'socket.io';
import { Room } from '../../Generic/Room';
import { nextIn } from '../../Util/array';

import { AnswerStatus, GameStage, ResultStatus, Status } from './types';

export default class Ask extends Room {
  static readonly protocol = 'ASK';
  static readonly stages: GameStage[] = ['waiting', 'question', 'answer', 'result'];

  stage: GameStage = 'waiting';
  ready = new Set<string>();
  answers: [string, string[]][] = [];
  currentAnswer: number = 0;

  public get status(): Status {
    const data: Status = {
      stage: this.stage,
      players: this.players.size,
      ready: this.ready.size,
    };

    if (this.stage === 'answer') {
      (data as AnswerStatus).questions = this.answers.map(([question]) => question);
    }

    if (this.stage === 'result') {
      (data as ResultStatus).answers = this.answers[this.currentAnswer];
    }

    return data;
  }

  public get joinable(): boolean {
    return this.stage === 'waiting';
  }

  onJoin(socket: Socket) {
    super.onJoin(socket);
    this.sendStatus();

    socket.on('ready', ({ ready, data }: { ready: boolean; data?: any }) => {
      if (ready) {
        this.ready.add(socket.id);

        switch (this.stage) {
          case 'question':
            this.answers.push([data, []]);
            break;
          case 'answer':
            (data as any[]).forEach((value, index) => {
              this.answers[index][1].push(value);
            });
            break;
        }
      } else {
        this.ready.delete(socket.id);
      }

      if (this.ready.size === this.players.size) {
        if (this.stage === 'result' && this.currentAnswer < this.answers.length - 1) {
          this.currentAnswer++;
        } else {
          if (this.stage === 'result') {
            this.answers = [];
            this.currentAnswer = 0;
          }
          this.stage = nextIn<GameStage>(Ask.stages, this.stage);
          this.ready.clear();
        }
      }

      this.sendStatus();
    });

    socket.on('status', () => {
      this.sendStatus(socket);
    });
  }

  onLeave(socket: Socket) {
    super.onLeave(socket);
    this.ready.delete(socket.id);
  }

  protected sendStatus(socket?: Socket) {
    if (socket) {
      socket.emit('status', this.status);
    } else {
      this.io.emit('status', this.status);
    }
  }

  // WAITING HANDLERS
  protected whenWaiting: Record<string, (data: Record<string, any>) => void> = {
    start: (data: Record<string, any>) => {},
  };
}
