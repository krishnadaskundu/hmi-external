import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonExternalComponent } from '../common-external/common-external.component';
import { Capacitor } from '@capacitor/core';

/*
  Features:
  - Add, delete, and mark todos as completed.
  - Set notification time per todo; browser notification sent at set time if allowed.
  - Download/upload todo list as .txt (JSON) via componentDataDownloader/componentDataUploader.
  - Bootstrap 5 styling throughout, inline HTML/CSS.
  - All changes synced to localStorage by default.
  - Uploaded file data is immediately reflected in UI.
  - Strict type checking for all variables.
  - Uses @capacitor/core >=7.0.0 for future mobile integration/readiness.
*/

interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
  notifyTime?: string;
  notified?: boolean;
}

@Component({
  selector: 'app-todoooos',
  template: `
    <div class="card shadow-sm mt-4 mx-auto" style="max-width: 500px;">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span class="fw-bold">Todo List</span>
        <div>
          <button type="button" class="btn btn-outline-primary btn-sm me-2"
            (click)="downloadTodos()" title="Download Todos">
            <i class="bi bi-download"></i> Download
          </button>
          <label class="btn btn-outline-secondary btn-sm mb-0" title="Upload Todos">
            <i class="bi bi-upload"></i> Upload
            <input type="file" accept=".txt" hidden (change)="uploadTodos($event)">
          </label>
        </div>
      </div>
      <div class="card-body">
        <form class="d-flex flex-column gap-2 mb-3" (submit)="addTodo()">
          <div class="input-group">
            <input type="text" class="form-control" placeholder="Add new todo"
              [(ngModel)]="newTodoText" name="todoInput" required maxlength="100" autocomplete="off">
            <button class="btn btn-success" type="submit">Add</button>
          </div>
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-clock"></i></span>
            <input type="datetime-local" class="form-control"
              [(ngModel)]="newNotifyTime" name="notifyTime"
              [min]="minDateTime" max="9999-12-31T23:59">
            <span class="input-group-text small text-muted">Notification time (optional)</span>
          </div>
        </form>
        <ul class="list-group">
          <li *ngFor="let todo of todos" class="list-group-item d-flex justify-content-between align-items-center"
              [class.list-group-item-secondary]="todo.completed">
            <div class="flex-grow-1">
              <input type="checkbox" class="form-check-input me-2" [checked]="todo.completed"
                (change)="toggleCompleted(todo)">
              <span [class.text-decoration-line-through]="todo.completed">{{ todo.text }}</span>
              <small *ngIf="todo.notifyTime" class="text-info ms-2">
                <i class="bi bi-bell"></i>
                {{ formatNotifyTime(todo.notifyTime) }}
                <span *ngIf="todo.notified" class="badge bg-success ms-1">Notified</span>
              </small>
            </div>
            <div class="ms-2 d-flex gap-1">
              <button *ngIf="!todo.completed && todo.notifyTime"
                class="btn btn-sm btn-outline-danger"
                (click)="removeNotifyTime(todo)" title="Remove notification time">
                <i class="bi bi-bell-slash"></i>
              </button>
              <button class="btn btn-sm btn-danger" (click)="deleteTodo(todo)" title="Delete">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </li>
        </ul>
        <div *ngIf="todos.length === 0" class="text-muted text-center mt-3">No todos yet.</div>
      </div>
    </div>
  `,
  styles: [`
    .card { min-height: 400px; }
    .list-group-item { transition: background 0.2s; }
    .list-group-item-secondary { background-color: #f8f9fa !important; }
    .text-decoration-line-through { text-decoration: line-through; }
    input[type="file"] { display: none; }
    .input-group-text i { font-size: 1.1em; }
    .badge.bg-success { font-size: 0.75em; }
  `]
})
export class TodoooosComponent extends CommonExternalComponent {
  todos: TodoItem[] = [];
  newTodoText: string = '';
  newNotifyTime: string = '';
  readonly STORAGE_KEY: string = 'todoooos-data';
  minDateTime: string = '';

  private notificationTimers: Map<number, ReturnType<typeof setTimeout>> = new Map();

  constructor(private cdr: ChangeDetectorRef) {
    super();
    this.setMinDateTime();
    this.loadFromLocalStorage();
    this.requestNotificationPermission();
    this.scheduleAllNotifications();
    // Optional: Log Capacitor platform info for debug/future use
    // console.log('Capacitor platform:', Capacitor.getPlatform());
  }

  addTodo(): void {
    const trimmed: string = this.newTodoText.trim();
    if (!trimmed) return;
    const newTodo: TodoItem = {
      id: Date.now(),
      text: trimmed,
      completed: false,
      notifyTime: this.newNotifyTime ? this.newNotifyTime : undefined,
      notified: false
    };
    this.todos.unshift(newTodo);
    this.newTodoText = '';
    this.newNotifyTime = '';
    this.saveToLocalStorage();
    this.scheduleNotification(newTodo);
  }

  deleteTodo(todo: TodoItem): void {
    this.todos = this.todos.filter((t: TodoItem) => t.id !== todo.id);
    this.saveToLocalStorage();
    this.cancelNotification(todo.id);
  }

  toggleCompleted(todo: TodoItem): void {
    todo.completed = !todo.completed;
    this.saveToLocalStorage();
    if (todo.completed) {
      this.cancelNotification(todo.id);
    } else if (todo.notifyTime) {
      this.scheduleNotification(todo);
    }
  }

  removeNotifyTime(todo: TodoItem): void {
    todo.notifyTime = undefined;
    todo.notified = false;
    this.saveToLocalStorage();
    this.cancelNotification(todo.id);
  }

  downloadTodos(): void {
    this.componentDataDownloader({ todos: this.todos });
  }

  async uploadTodos(event: Event): Promise<void> {
    try {
      const result: any = await this.componentDataUploader(event);
      if (result && Array.isArray(result.todos)) {
        this.todos = result.todos.map((t: any): TodoItem => ({
          id: typeof t.id === 'number' ? t.id : Date.now(),
          text: typeof t.text === 'string' ? t.text : '',
          completed: !!t.completed,
          notifyTime: typeof t.notifyTime === 'string' ? t.notifyTime : undefined,
          notified: !!t.notified
        })).filter((t: TodoItem) => t.text.length > 0);
        this.saveToLocalStorage();
        this.scheduleAllNotifications();
        this.cdr.detectChanges();
      }
    } catch {}
    (event.target as HTMLInputElement).value = '';
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.todos));
  }

  private loadFromLocalStorage(): void {
    const data: string | null = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      try {
        const parsed: unknown = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.todos = parsed as TodoItem[];
        }
      } catch {}
    }
  }

  private setMinDateTime(): void {
    const now: Date = new Date();
    now.setSeconds(0, 0);
    this.minDateTime = now.toISOString().slice(0,16);
  }

  // --- Notification logic ---

  private requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  private scheduleNotification(todo: TodoItem): void {
    this.cancelNotification(todo.id);
    if (
      !todo.notifyTime ||
      todo.completed ||
      todo.notified ||
      !('Notification' in window) ||
      Notification.permission !== 'granted'
    ) return;

    const notifyDate: Date = new Date(todo.notifyTime);
    const now: Date = new Date();
    if (isNaN(notifyDate.getTime()) || notifyDate <= now) return;

    const delay: number = notifyDate.getTime() - now.getTime();
    const timer = setTimeout(() => {
      this.showNotification(todo);
      todo.notified = true;
      this.saveToLocalStorage();
      this.cdr.detectChanges();
    }, delay);

    this.notificationTimers.set(todo.id, timer);
  }

  private cancelNotification(todoId: number): void {
    const timer = this.notificationTimers.get(todoId);
    if (timer) {
      clearTimeout(timer);
      this.notificationTimers.delete(todoId);
    }
  }

  private scheduleAllNotifications(): void {
    this.notificationTimers.forEach((timer: any, id: number) => clearTimeout(timer));
    this.notificationTimers.clear();
    if ('Notification' in window && Notification.permission === 'granted') {
      for (const todo of this.todos) {
        this.scheduleNotification(todo);
      }
    }
  }

  private showNotification(todo: TodoItem): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Todo Reminder', {
        body: todo.text,
        icon: 'https://cdn-icons-png.flaticon.com/512/726/726476.png',
        tag: 'todoooos-' + todo.id
      });
    }
    // For mobile: Use Capacitor Push/Local Notifications here if needed in future
  }

  formatNotifyTime(dt: string | undefined): string {
    if (!dt) return '';
    const date: Date = new Date(dt);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString();
  }
}