import { Component } from '@angular/core';
import { CommonExternalComponent } from '../common-external/common-external.component';

/*
  Features:
  - Add new tasks using PrimeNG input and button.
  - List tasks with checkboxes to mark as completed (PrimeNG).
  - Remove tasks using PrimeNG button.
  - Uses strict type checking for all variables.
*/

@Component({
  selector: 'app-dashboard',
  template: `
    <div style="max-width:400px;margin:auto;">
      <h2>To-Do List</h2>
      <div class="p-inputgroup" style="margin-bottom:1rem;">
        <input pInputText [(ngModel)]="newTask" placeholder="Add a task" [ngModelOptions]="{standalone: true}" />
        <button pButton type="button" icon="pi pi-plus" label="Add" (click)="addTask()" [disabled]="!newTask.trim()"></button>
      </div>
      <ul style="list-style:none;padding:0;">
        <li *ngFor="let task of tasks; let i = index" class="task-item">
          <p-checkbox 
            [(ngModel)]="task.completed"
            binary="true"
            [ngModelOptions]="{standalone: true}">
          </p-checkbox>
          <span [ngStyle]="{'text-decoration': task.completed ? 'line-through' : 'none', 'margin-left':'0.5rem'}">
            {{ task.title }}
          </span>
          <button pButton icon="pi pi-trash" class="p-button-danger p-button-text" style="float:right;" (click)="removeTask(i)"></button>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .task-item {
      display: flex;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f0f0f0;
    }
  `]
})
export class DashboardComponent extends CommonExternalComponent {
  newTask: string = '';
  tasks: Array<{ title: string; completed: boolean }> = [];

  addTask(): void {
    const trimmedTask: string = this.newTask.trim();
    if (trimmedTask.length > 0) {
      this.tasks.push({ title: trimmedTask, completed: false });
      this.newTask = '';
    }
  }

  removeTask(index: number): void {
    this.tasks.splice(index, 1);
  }
}