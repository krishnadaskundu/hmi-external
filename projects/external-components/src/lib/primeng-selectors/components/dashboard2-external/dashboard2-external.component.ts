import { Component } from '@angular/core';
import { CommonExternalComponent } from '../common-external/common-external.component';

/*
  Features:
  - Add tasks using PrimeNG input and button
  - Display task list with PrimeNG checkboxes to mark complete/incomplete
  - Remove tasks with PrimeNG button
  - Inline HTML & CSS, strict typing
*/

interface TodoItem {
  text: string;
  completed: boolean;
}

@Component({
  selector: 'app-dashboard2',
  template: `
    <div style="max-width:400px;margin:auto;">
      <h3>To-Do List</h3>
      <div class="p-inputgroup" style="margin-bottom:10px;">
        <input pInputText type="text" [(ngModel)]="newTask" placeholder="Add new task..." (keyup.enter)="addTask()" />
        <button pButton type="button" label="Add" icon="pi pi-plus" (click)="addTask()" [disabled]="!newTask.trim()"></button>
      </div>
      <ul style="list-style:none;padding:0;">
        <li *ngFor="let item of tasks; let i = index" style="display:flex;align-items:center;margin-bottom:8px;">
          <p-checkbox [(ngModel)]="item.completed" binary="true"></p-checkbox>
          <span [style.textDecoration]="item.completed ? 'line-through' : 'none'" style="flex:1;margin-left:8px;">{{item.text}}</span>
          <button pButton type="button" icon="pi pi-trash" class="p-button-danger p-button-sm" (click)="removeTask(i)" style="margin-left:8px;"></button>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    h3 { text-align: center; }
  `]
})
export class Dashboard2Component extends CommonExternalComponent {
  newTask: string = '';
  tasks: TodoItem[] = [];

  addTask(): void {
    const trimmed: string = this.newTask.trim();
    if (trimmed) {
      this.tasks.push({ text: trimmed, completed: false });
      this.newTask = '';
    }
  }

  removeTask(index: number): void {
    this.tasks.splice(index, 1);
  }
}