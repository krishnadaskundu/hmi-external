import { Component } from '@angular/core';
import { CommonExternalComponent } from '../common-external/common-external.component';

@Component({
  selector: 'app-tic-tac-toe-1',
  template: `
    <div class="tic-tac-toe">
      <h2>Tic Tac Toe</h2>
      <div class="board">
        <div *ngFor="let cell of board; let i = index" 
             class="cell" 
             (click)="makeMove(i)">
          {{ cell }}
        </div>
      </div>
      <div class="status">{{ status }}</div>
      <button (click)="reset()">Reset</button>
    </div>
  `,
  styles: [`
    .tic-tac-toe {
      text-align: center;
    }
    .board {
      display: grid;
      grid-template-columns: repeat(3, 100px);
      gap: 5px;
      margin: 20px auto;
    }
    .cell {
      width: 100px;
      height: 100px;
      background-color: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      cursor: pointer;
    }
    .cell:hover {
      background-color: #ddd;
    }
  `]
})
export class TicTacToe1Component extends CommonExternalComponent {
  board: string[] = Array(9).fill(null);
  currentPlayer: string = 'X';
  status: string = 'Your turn!';

  makeMove(index: number): void {
    if (!this.board[index] && !this.checkWinner()) {
      this.board[index] = this.currentPlayer;
      if (this.checkWinner()) {
        this.status = `${this.currentPlayer} wins!`;
      } else if (this.board.every(cell => cell)) {
        this.status = 'It\'s a draw!';
      } else {
        this.currentPlayer = 'O';
        this.machineMove();
      }
    }
  }

  machineMove(): void {
    const availableMoves = this.board.map((cell, index) => (cell === null ? index : null)).filter(index => index !== null);
    if (availableMoves.length > 0) {
      const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
      this.board[randomMove] = this.currentPlayer;
      if (this.checkWinner()) {
        this.status = `${this.currentPlayer} wins!`;
      } else if (this.board.every(cell => cell)) {
        this.status = 'It\'s a draw!';
      } else {
        this.currentPlayer = 'X';
        this.status = 'Your turn!';
      }
    }
  }

  checkWinner(): boolean {
    const winningCombinations = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    return winningCombinations.some(combination => {
      const [a, b, c] = combination;
      return this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c];
    });
  }

  reset(): void {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.status = 'Your turn!';
  }
}