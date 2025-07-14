// notification.component.ts
import { Component, ChangeDetectorRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonExternalComponent } from '../common-external/common-external.component';

/**
 * Features:
 * - Users can schedule reminders with a title, message, date/time, and optional redirect URL.
 * - Reminders are sent to the backend via POST /rest/reminders (not stored in local storage).
 * - Responsive, clean interface with Bootstrap 5 and PrimeIcons v7.
 * - Download/upload buttons removed since no user data is stored locally.
 */

interface Reminder {
  id?: number;
  title: string;
  message: string;
  dateTime: string; // ISO string
  url?: string;
}

@Component({
  selector: 'app-notification',
  template: `
    <!-- 
      Features:
      - Schedule reminders with title, message, date/time, and optional URL.
      - Submits to backend (no local storage).
      - Clean, responsive UI using Bootstrap 5 & PrimeIcons.
    -->
    <div class="card shadow-sm my-3">
      <div class="card-header d-flex align-items-center bg-primary text-white">
        <i class="pi pi-bell me-2"></i>
        Reminder Scheduler
      </div>
      <div class="card-body">
        <form class="row g-2 align-items-end" #reminderForm="ngForm" (ngSubmit)="scheduleReminder(reminderForm)">
          <div class="col-md-4">
            <label for="title" class="form-label">Title</label>
            <input required [(ngModel)]="newReminder.title" name="title" id="title" maxlength="50"
              class="form-control" placeholder="Enter title" />
          </div>
          <div class="col-md-4">
            <label for="message" class="form-label">Message</label>
            <input required [(ngModel)]="newReminder.message" name="message" id="message" maxlength="100"
              class="form-control" placeholder="Enter reminder message" />
          </div>
          <div class="col-md-3">
            <label for="dateTime" class="form-label">Date & Time</label>
            <input required [(ngModel)]="newReminder.dateTime" name="dateTime" id="dateTime"
              class="form-control" type="datetime-local" />
          </div>
          <div class="col-md-6">
            <label for="url" class="form-label">Redirect URL (optional)</label>
            <input [(ngModel)]="newReminder.url" name="url" id="url"
              class="form-control" type="url" placeholder="https://example.com" />
          </div>
          <div class="col-md-2 mt-4">
            <button [disabled]="!reminderForm.form.valid"
              class="btn btn-success w-100" type="submit">
              <i class="pi pi-plus"></i> Schedule
            </button>
          </div>
        </form>
        <hr>
        <div *ngIf="successMsg" class="alert alert-success d-flex align-items-center mt-2" role="alert">
          <i class="pi pi-check-circle me-2"></i>
          {{ successMsg }}
        </div>
        <div *ngIf="errorMsg" class="alert alert-danger d-flex align-items-center mt-2" role="alert">
          <i class="pi pi-times-circle me-2"></i>
          {{ errorMsg }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card { max-width: 700px; margin: auto; }
    input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
  `]
})
export class NotificationComponent extends CommonExternalComponent {
  newReminder: Reminder = { title: '', message: '', dateTime: '', url: '' };
  successMsg: string = '';
  errorMsg: string = '';

  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {
    super();
  }

  scheduleReminder(form: NgForm): void {
    this.successMsg = '';
    this.errorMsg = '';
    const payload: Reminder = {
      title: this.newReminder.title.trim(),
      message: this.newReminder.message.trim(),
      dateTime: this.newReminder.dateTime,
      url: this.newReminder.url?.trim() || undefined
    };

    this.http.post<Reminder>('/rest/reminders', payload).subscribe({
      next: () => {
        this.successMsg = 'Reminder scheduled successfully!';
        form.resetForm();
        this.newReminder = { title: '', message: '', dateTime: '', url: '' };
        this.cd.detectChanges();
      },
      error: err => {
        this.errorMsg = 'Failed to schedule reminder. Please try again.';
        this.cd.detectChanges();
      }
    });
  }
}