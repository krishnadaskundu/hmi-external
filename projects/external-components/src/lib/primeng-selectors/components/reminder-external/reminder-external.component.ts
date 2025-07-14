// reminder.component.ts

import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonExternalComponent } from '../common-external/common-external.component';

@Component({
  selector: 'app-reminder',
  template: `
    <!-- 
      Reminder Scheduling App
      Features:
      - Schedule reminders with title, message, date/time, and optional redirect URL.
      - Submits reminders via POST to '/rest/reminders'.
      - Download/Upload buttons for exporting/importing all reminders (if needed in future).
      - Bootstrap 5 styling & PrimeIcons v7 icons.
    -->
    <div class="card shadow-sm mt-4 mx-auto" style="max-width: 500px;">
      <div class="card-header d-flex align-items-center justify-content-between">
        <span>
          <i class="pi pi-bell me-2"></i>
          <b>Schedule a Reminder</b>
        </span>
        <div>
          <button type="button" class="btn btn-outline-secondary btn-sm me-1"
            (click)="downloadData()" title="Download Reminders">
            <i class="pi pi-download"></i>
          </button>
          <label class="btn btn-outline-secondary btn-sm mb-0" title="Upload Reminders">
            <i class="pi pi-upload"></i>
            <input type="file" accept=".txt" hidden (change)="uploadData($event)">
          </label>
        </div>
      </div>
      <div class="card-body">
        <form [formGroup]="reminderForm" (ngSubmit)="onSubmit()">
          <div class="mb-3">
            <label class="form-label">Title <span class="text-danger">*</span></label>
            <input formControlName="title" type="text" class="form-control"
              placeholder="Enter reminder title" required>
            <div *ngIf="reminderForm.get('title')?.invalid && reminderForm.get('title')?.touched"
              class="text-danger small">Title is required.</div>
          </div>
          <div class="mb-3">
            <label class="form-label">Message <span class="text-danger">*</span></label>
            <textarea formControlName="message" rows="2" class="form-control"
              placeholder="Reminder message" required></textarea>
            <div *ngIf="reminderForm.get('message')?.invalid && reminderForm.get('message')?.touched"
              class="text-danger small">Message is required.</div>
          </div>
          <div class="mb-3">
            <label class="form-label">Scheduled Date & Time <span class="text-danger">*</span></label>
            <input formControlName="scheduledAt" type="datetime-local" class="form-control"
              required>
            <div *ngIf="reminderForm.get('scheduledAt')?.invalid && reminderForm.get('scheduledAt')?.touched"
              class="text-danger small">Date & time are required.</div>
          </div>
          <div class="mb-3">
            <label class="form-label">Redirect URL <small class="text-muted">(optional)</small></label>
            <input formControlName="redirectUrl" type="url" class="form-control"
              placeholder="https://example.com">
            <div *ngIf="reminderForm.get('redirectUrl')?.invalid && reminderForm.get('redirectUrl')?.touched"
              class="text-danger small">Invalid URL.</div>
          </div>
          <div class="d-grid gap-2">
            <button type="submit" class="btn btn-primary"
              [disabled]="reminderForm.invalid || submitting">
              <i class="pi pi-check-circle me-1"></i>
              {{ submitting ? 'Scheduling...' : 'Schedule Reminder' }}
            </button>
          </div>
        </form>
        <div *ngIf="successMsg" class="alert alert-success mt-3 py-2 d-flex align-items-center">
          <i class="pi pi-check-circle me-2"></i>
          {{ successMsg }}
        </div>
        <div *ngIf="errorMsg" class="alert alert-danger mt-3 py-2 d-flex align-items-center">
          <i class="pi pi-times-circle me-2"></i>
          {{ errorMsg }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card { border-radius: 12px; }
    .btn i { vertical-align: middle; }
    input[type="file"] { display: none; }
  `]
})
export class ReminderComponent extends CommonExternalComponent {
  reminderForm: FormGroup;
  submitting: boolean = false;
  successMsg: string = '';
  errorMsg: string = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cd: ChangeDetectorRef
  ) {
    super();
    this.reminderForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(80)]],
      message: ['', [Validators.required, Validators.maxLength(300)]],
      scheduledAt: ['', Validators.required],
      redirectUrl: ['', Validators.pattern('^$|^(https?://).+')]
    });
  }

  onSubmit(): void {
    this.successMsg = '';
    this.errorMsg = '';
    if (this.reminderForm.invalid) {
      this.reminderForm.markAllAsTouched();
      return;
    }
    this.submitting = true;

    const payload: Record<string, unknown> = {
      title: this.reminderForm.value.title as string,
      message: this.reminderForm.value.message as string,
      scheduledAt: new Date(this.reminderForm.value.scheduledAt as string).toISOString(),
      ...(this.reminderForm.value.redirectUrl ? { redirectUrl: this.reminderForm.value.redirectUrl } : {})
    };

    this.http.post('/rest/reminders', payload).subscribe({
      next: () => {
        this.successMsg = 'Reminder scheduled successfully!';
        this.reminderForm.reset();
        this.submitting = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Failed to schedule reminder.';
        this.submitting = false;
        this.cd.detectChanges();
      }
    });
  }

  // These functions allow users to download/upload all reminders data if needed
  downloadData(): void {
    // No reminders stored locally, so we just export empty or sample data
    const data = {}; // Could be replaced with actual list if needed
    this.componentDataDownloader(data);
  }

  async uploadData(event: Event): Promise<void> {
    try {
      await this.componentDataUploader(event);
      this.cd.detectChanges();
    } catch (e) {
      this.errorMsg = 'Failed to upload data.';
      this.cd.detectChanges();
    }
  }
}