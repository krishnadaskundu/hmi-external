import { Component, HostListener } from '@angular/core';
import { CommonExternalComponent } from '../common-external/common-external.component';

/*
  Features:
  - Click/tap to make the bird fly upward.
  - Animated pipes move leftward; new pipes are generated at intervals.
  - Collision detection: game over if bird hits a pipe or ground/ceiling.
  - Score increases for each pipe passed.
  - Simple graphics with inline CSS and HTML.
*/

@Component({
  selector: 'app-flappy-bird-clone',
  template: `
    <div class="game-container" (click)="flap()" tabindex="0">
      <div class="bird" [ngStyle]="{'top.px': birdY}"></div>
      <div *ngFor="let pipe of pipes"
           class="pipe"
           [ngStyle]="{
             'left.px': pipe.x,
             'height.px': pipe.height,
             'top.px': pipe.top ? 0 : pipe.gapY + gapHeight
           }"
           [class.top-pipe]="pipe.top"
           [class.bottom-pipe]="!pipe.top">
      </div>
      <div class="score">Score: {{ score }}</div>
      <div class="game-over" *ngIf="gameOver">
        <span>Game Over!</span>
        <button (click)="restart($event)">Restart</button>
      </div>
    </div>
  `,
  styles: [`
    .game-container {
      position: relative;
      width: 400px;
      height: 600px;
      background: linear-gradient(#70c5ce, #fff);
      overflow: hidden;
      margin: 20px auto;
      border: 2px solid #333;
      outline: none;
    }
    .bird {
      position: absolute;
      left: 80px;
      width: 40px;
      height: 40px;
      background: yellow;
      border-radius: 50%;
      border: 2px solid #ff0;
      box-shadow: 2px 2px 6px rgba(0,0,0,0.1);
      transition: top 0.04s;
      z-index: 2;
    }
    .pipe {
      position: absolute;
      width: 60px;
      background: linear-gradient(to right, #4ec04e, #388e3c);
      border: 2px solid #2e7d32;
      z-index: 1;
    }
    .top-pipe {
      border-bottom-left-radius: 30px;
      border-bottom-right-radius: 30px;
    }
    .bottom-pipe {
      border-top-left-radius: 30px;
      border-top-right-radius: 30px;
    }
    .score {
      position: absolute;
      top: 16px;
      left: 16px;
      font-size: 24px;
      color: #222;
      font-weight: bold;
      text-shadow: 1px 1px 2px #fff;
      z-index: 3;
    }
    .game-over {
      position: absolute;
      top: 45%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 32px;
      color: #b71c1c;
      background: rgba(255,255,255,0.9);
      padding: 32px 48px;
      border-radius: 12px;
      text-align: center;
      z-index: 10;
    }
    .game-over button {
      margin-top: 16px;
      font-size: 18px;
      padding: 8px 24px;
      cursor: pointer;
      background: #388e3c;
      color: #fff;
      border: none;
      border-radius: 6px;
    }
  `]
})
export class FlappyBirdCloneComponent extends CommonExternalComponent {
  readonly gravity: number = 0.55;
  readonly flapStrength: number = -8;
  readonly pipeSpeed: number = 2.5;
  readonly pipeInterval: number = 1400;
  readonly gapHeight: number = 150;
  readonly birdSize: number = 40;
  readonly gameWidth: number = 400;
  readonly gameHeight: number = 600;

  birdY: number = this.gameHeight / 2;
  birdVelocity: number = 0;
  pipes: Array<{ x: number; height: number; top: boolean; gapY: number }> = [];
  score: number = 0;
  gameOver: boolean = false;

  private animationFrameId: number | null = null;
  private pipeTimer: any = null;

  ngOnInit(): void {
    this.startGame();
  }

  ngOnDestroy(): void {
    this.stopGame();
  }

  startGame(): void {
    this.birdY = this.gameHeight / 2;
    this.birdVelocity = 0;
    this.score = 0;
    this.gameOver = false;
    this.pipes = [];
    this.spawnPipe();
    this.pipeTimer = setInterval(() => this.spawnPipe(), this.pipeInterval);
    this.loop();
  }

  stopGame(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.pipeTimer) {
      clearInterval(this.pipeTimer);
    }
  }

  restart(event: Event): void {
    event.stopPropagation();
    this.stopGame();
    this.startGame();
  }

  loop(): void {
    if (this.gameOver) return;
    this.updateBird();
    this.updatePipes();
    this.checkCollision();
    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  updateBird(): void {
    this.birdVelocity += this.gravity;
    this.birdY += this.birdVelocity;
    if (this.birdY < 0) this.birdY = 0;
    if (this.birdY > this.gameHeight - this.birdSize) this.birdY = this.gameHeight - this.birdSize;
  }

  updatePipes(): void {
    for (const pipe of this.pipes) {
      pipe.x -= this.pipeSpeed;
    }
    // Remove pipes out of view and update score
    if (this.pipes.length && this.pipes[0].x + 60 < 80 && !this.pipes[0].top) {
      this.score++;
    }
    this.pipes = this.pipes.filter(pipe => pipe.x > -60);
  }

  spawnPipe(): void {
    const minGapY = 80;
    const maxGapY = this.gameHeight - this.gapHeight - 80;
    const gapY = Math.floor(Math.random() * (maxGapY - minGapY + 1)) + minGapY;
    // Top pipe
    this.pipes.push({ x: this.gameWidth, height: gapY, top: true, gapY });
    // Bottom pipe
    this.pipes.push({
      x: this.gameWidth,
      height: this.gameHeight - gapY - this.gapHeight,
      top: false,
      gapY
    });
  }

  checkCollision(): void {
    // Bird rectangle
    const birdRect = {
      left: 80,
      right: 80 + this.birdSize,
      top: this.birdY,
      bottom: this.birdY + this.birdSize
    };
    for (const pipe of this.pipes) {
      const pipeRect = {
        left: pipe.x,
        right: pipe.x + 60,
        top: pipe.top ? 0 : pipe.gapY + this.gapHeight,
        bottom: pipe.top ? pipe.height : this.gameHeight
      };
      if (
        birdRect.right > pipeRect.left &&
        birdRect.left < pipeRect.right &&
        birdRect.bottom > pipeRect.top &&
        birdRect.top < pipeRect.bottom
      ) {
        this.triggerGameOver();
        return;
      }
    }
    // Ground/ceiling collision
    if (this.birdY <= 0 || this.birdY >= this.gameHeight - this.birdSize) {
      this.triggerGameOver();
    }
  }

  triggerGameOver(): void {
    this.gameOver = true;
    this.stopGame();
  }

  flap(): void {
    if (!this.gameOver) {
      this.birdVelocity = this.flapStrength;
    }
  }

  @HostListener('window:keydown.space', ['$event'])
  onSpacebar(event: KeyboardEvent): void {
    event.preventDefault();
    this.flap();
  }
}