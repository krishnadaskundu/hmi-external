import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonExternalComponent } from '../common-external/common-external.component';
import { LocalNotifications, PermissionStatus } from '@capacitor/local-notifications';

/*
  Features:
  - Schedule device notifications at any future date & time (Android background/foreground supported).
  - Uses @capacitor/local-notifications v7.0.1, @capacitor/core >=7.0.0.
  - Requests notification permission if not granted.
  - Lists all scheduled notifications with cancel option.
  - Download/upload scheduled notifications as .txt via provided functions.
  - Data persists in localStorage by default.
  - Strict typing, bootstrap 5 styling, change detection on upload.
*/

@Component({
  selector: 'app-notification',
  template: `
    <div class="card shadow-sm">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span><i class="bi bi-bell"></i> Schedule Notification</span>
        <div>
          <button type="button" class="btn btn-outline-primary btn-sm me-2" (click)="downloadData()">
            <i class="bi bi-download"></i> Download Data
          </button>
          <label class="btn btn-outline-secondary btn-sm mb-0">
            <i class="bi bi-upload"></i> Upload Data
            <input type="file" accept=".txt" hidden (change)="uploadData($event)">
          </label>
        </div>
      </div>
      <div class="card-body">
        <form class="row g-2 align-items-end mb-4" (ngSubmit)="scheduleNotification()" #notifForm="ngForm" autocomplete="off">
          <div class="col-md-5">
            <label class="form-label mb-1">Date</label>
            <input type="date" class="form-control form-control-sm" [(ngModel)]="date" name="date" required [min]="minDate"/>
          </div>
          <div class="col-md-4">
            <label class="form-label mb-1">Time</label>
            <input type="time" class="form-control form-control-sm" [(ngModel)]="time" name="time" required/>
          </div>
          <div class="col-md-3 d-grid">
            <button type="submit" class="btn btn-success btn-sm" [disabled]="!date || !time">Schedule</button>
          </div>
        </form>

        <div *ngIf="!permissionGranted" class="alert alert-warning py-2" role="alert">
          Please allow notifications to schedule alerts.
        </div>
        <div *ngIf="permissionGranted" class="alert alert-success py-2" role="alert">
          Notifications enabled! Scheduled notifications will work even in background (Android).
        </div>

        <h6 class="mt-4 mb-2">Scheduled Notifications</h6>
        <div *ngIf="notifications.length === 0" class="text-muted small mb-2">No notifications scheduled.</div>
        <div *ngIf="notifications.length > 0" class="table-responsive">
          <table class="table table-bordered table-sm align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>#</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Cancel</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let n of notifications; let i = index">
                <td>{{ i + 1 }}</td>
                <td>{{ n.datetime | date:'medium' }}</td>
                <td>
                  <span class="badge bg-success" *ngIf="n.datetime > now">Scheduled</span>
                  <span class="badge bg-secondary" *ngIf="n.datetime <= now">Past</span>
                </td>
                <td>
                  <button class="btn btn-outline-danger btn-sm px-2 py-0"
                    (click)="cancelNotification(n.id)" [disabled]="n.datetime <= now">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card { max-width: 540px; margin: 2rem auto; }
    th, td { vertical-align: middle; }
    .form-label { font-size: 0.92rem; }
    .table td, .table th { font-size: 0.97rem; }
  `]
})
export class NotificationComponent extends CommonExternalComponent implements OnInit, OnDestroy {
  public permissionGranted: boolean = false;
  public date: string = '';
  public time: string = '';
  public notifications: Array<{ id: number, datetime: number }> = [];
  public now: number = Date.now();
  public minDate: string = '';

  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private cdr: ChangeDetectorRef) {
    super();
    this.minDate = new Date().toISOString().split('T')[0];
    this.loadAppData();
    this.intervalId = setInterval(() => {
      this.now = Date.now();
      this.cdr.markForCheck();
    }, 30_000);
  }

  ngOnInit(): void {
    this.checkNotificationPermission();
    this.refreshScheduled();
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private async checkNotificationPermission(): Promise<void> {
    try {
      const status: PermissionStatus = await LocalNotifications.requestPermissions();
      this.permissionGranted = (status.display === 'granted');
      this.cdr.detectChanges();
    } catch {
      this.permissionGranted = false;
    }
  }

  async scheduleNotification(): Promise<void> {
    if (!this.date || !this.time) return;
    const [year, month, day] = this.date.split('-').map(Number);
    const [hour, minute] = this.time.split(':').map(Number);

    // Ensure valid numbers
    if (
      isNaN(year) || isNaN(month) || isNaN(day) ||
      isNaN(hour) || isNaN(minute)
    ) {
      alert('Invalid date or time.');
      return;
    }

    const dt: Date = new Date(year, month - 1, day, hour, minute, 0);

    if (dt.getTime() <= Date.now()) {
      alert('Please select a future date and time.');
      return;
    }

    const id: number = this.getNextId();

    try {
      await LocalNotifications.schedule({
        notifications: [{
          title: 'Scheduled Notification',
          body: `Your notification for ${dt.toLocaleString()}`,
          id,
          schedule: { at: dt },
          sound: null,
          smallIcon: 'ic_stat_icon_config_sample'
        }]
      });
      this.notifications.push({ id, datetime: dt.getTime() });
      this.saveAppData();
      this.date = '';
      this.time = '';
      this.cdr.detectChanges();
    } catch (e) {
      alert('Failed to schedule notification.');
    }
  }

  async cancelNotification(id: number): Promise<void> {
    await LocalNotifications.cancel({ notifications: [{ id }] });
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.saveAppData();
    this.cdr.detectChanges();
  }

  private getNextId(): number {
    const ids: number[] = this.notifications.map((n) => n.id);
    let next = 1;
    while (ids.includes(next)) next++;
    return next;
  }

  private saveAppData(): void {
    localStorage.setItem('scheduled_notifications', JSON.stringify(this.notifications));
  }

  private loadAppData(): void {
    const raw: string | null = localStorage.getItem('scheduled_notifications');
    this.notifications = raw ? JSON.parse(raw) : [];
  }

  downloadData(): void {
    this.componentDataDownloader(this.notifications);
  }

  async uploadData(event: Event): Promise<void> {
    const uploaded: unknown = await this.componentDataUploader(event);
    if (Array.isArray(uploaded)) {
      this.notifications = uploaded.map((n: any) => ({
        id: Number(n.id),
        datetime: Number(n.datetime)
      }));
      localStorage.setItem('scheduled_notifications', JSON.stringify(this.notifications));
      this.refreshScheduled();
      this.cdr.detectChanges();
    }
  }

  private async refreshScheduled(): Promise<void> {
    // Optionally could sync with device notifications here.
  }
}