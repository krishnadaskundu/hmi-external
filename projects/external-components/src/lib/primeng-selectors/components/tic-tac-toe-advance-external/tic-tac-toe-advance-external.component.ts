import { Component } from '@angular/core';
import { CommonExternalComponent } from '../common-external/common-external.component';

/*
  Features:
  - Classic Tic Tac Toe (3x3 grid), Player vs Player
  - Game state, scores, and history stored in localStorage
  - Download/upload game data as .txt file using provided functions
  - Immediate UI update after upload
  - Bootstrap 5 styling for responsive layout
  - Header with download & upload buttons

  Please clarify: 
    - Should the app use any specific Capacitor plugins (e.g., Filesystem, Storage)?
    - Do you want to add mobile-specific features (vibration, haptics, etc.)?
    - Is offline support or PWA mode required?

  Note: "@capacitor/core" >=7.0.0 can be used for native features if needed.
*/

@Component({
  selector: 'app-tic-tac-toe-advance',
  template: `
  <div class="card shadow mt-4 mx-auto" style="max-width: 420px;">
    <div class="card-header d-flex justify-content-between align-items-center">
      <span class="fw-bold">Tic Tac Toe Advance</span>
      <div>
        <button class="btn btn-sm btn-outline-primary me-2" (click)="downloadData()" title="Download Game Data">
          <i class="bi bi-download"></i> Download
        </button>
        <label class="btn btn-sm btn-outline-secondary mb-0" title="Upload Game Data">
          <i class="bi bi-upload"></i> Upload
          <input type="file" accept=".txt" hidden (change)="uploadData($event)">
        </label>
      </div>
    </div>
    <div class="card-body text-center">
      <div class="mb-3">
        <span class="badge bg-primary me-2">X: {{scores.X}}</span>
        <span class="badge bg-danger">O: {{scores.O}}</span>
      </div>
      <div class="mb-2 fw-semibold">Current Turn: <span [ngClass]="{'text-primary': currentPlayer === 'X', 'text-danger': currentPlayer === 'O'}">{{currentPlayer}}</span></div>
      <div class="d-grid gap-1" style="grid-template-columns: repeat(3, 60px); justify-content:center;">
        <button *ngFor="let cell of board; let i = index"
                class="btn btn-lg border border-2"
                [ngClass]="{
                  'btn-light': !cell,
                  'btn-primary text-white': cell === 'X',
                  'btn-danger text-white': cell === 'O'
                }"
                style="width:60px;height:60px;font-size:2rem;"
                (click)="makeMove(i)"
                [disabled]="!!cell || winner">
          {{cell}}
        </button>
      </div>
      <div class="mt-3">
        <div *ngIf="winner" class="alert alert-success py-2">
          Winner: <b>{{winner}}</b>
        </div>
        <div *ngIf="!winner && isBoardFull()" class="alert alert-warning py-2">
          Draw!
        </div>
        <button class="btn btn-sm btn-outline-success mt-2" (click)="resetGame()">Restart</button>
      </div>
      <div class="mt-4 text-start">
        <h6>Game History</h6>
        <ul class="list-group small">
          <li *ngFor="let h of history; let idx = index" class="list-group-item px-2 py-1">
            #{{idx+1}} - Winner: <b>{{h.winner || 'Draw'}}</b>
          </li>
        </ul>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .card { min-width: 320px;}
    .list-group { max-height: 120px; overflow-y: auto;}
    input[type=file] { display:none; }
  `]
})
export class TicTacToeAdvanceComponent extends CommonExternalComponent {
  board: (string | null)[] = Array(9).fill(null);
  currentPlayer: 'X' | 'O' = 'X';
  winner: string | null = null;
  scores: { X: number; O: number } = { X: 0, O: 0 };
  history: { board: (string | null)[]; winner: string | null }[] = [];

  constructor() {
    super();
    this.loadFromLocalStorage();
  }

  makeMove(index: number): void {
    if (!this.board[index] && !this.winner) {
      this.board[index] = this.currentPlayer;
      this.winner = this.checkWinner();
      if (this.winner) {
        this.scores[this.winner as 'X' | 'O']++;
        this.addToHistory(this.winner);
      } else if (this.isBoardFull()) {
        this.addToHistory(null);
      } else {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
      }
      this.saveToLocalStorage();
    }
  }

  resetGame(): void {
    this.board = Array(9).fill(null);
    this.winner = null;
    this.currentPlayer = 'X';
    this.saveToLocalStorage();
  }

  checkWinner(): string | null {
    const wins: number[][] = [
      [0,1,2],[3,4,5],[6,7,8], // rows
      [0,3,6],[1,4,7],[2,5,8], // cols
      [0,4,8],[2,4,6]          // diagonals
    ];
    for (const [a,b,c] of wins) {
      if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
        return this.board[a];
      }
    }
    return null;
  }

  isBoardFull(): boolean {
    return this.board.every(cell => cell !== null);
  }

  addToHistory(winner: string | null): void {
    this.history.unshift({ board: [...this.board], winner });
    if (this.history.length > 10) this.history.pop();
  }

  saveToLocalStorage(): void {
    const data = this.getAppData();
    localStorage.setItem('tic_tac_toe_advance_data', JSON.stringify(data));
  }

  loadFromLocalStorage(): void {
    const raw = localStorage.getItem('tic_tac_toe_advance_data');
    if (raw) {
      try {
        const data = JSON.parse(raw);
        this.applyAppData(data);
      } catch {}
    }
  }

  getAppData(): object {
    return {
      board: this.board,
      currentPlayer: this.currentPlayer,
      winner: this.winner,
      scores: this.scores,
      history: this.history
    };
  }

  applyAppData(data: any): void {
    this.board = Array.isArray(data.board) && data.board.length === 9 ? data.board : Array(9).fill(null);
    this.currentPlayer = data.currentPlayer === 'O' ? 'O' : 'X';
    this.winner = typeof data.winner === 'string' ? data.winner : null;
    this.scores = data.scores && typeof data.scores.X === 'number' && typeof data.scores.O === 'number'
      ? { X: data.scores.X, O: data.scores.O }
      : { X: 0, O: 0 };
    this.history = Array.isArray(data.history) ? data.history.slice(0, 10) : [];
  }

  async uploadData(event: Event): Promise<void> {
    const data = await this.componentDataUploader(event);
    if (data) {
      this.applyAppData(data);
      this.saveToLocalStorage();
    }
  }

  downloadData(): void {
    this.componentDataDownloader(this.getAppData());
  }
}