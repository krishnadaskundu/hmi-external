// notification.component.ts
import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonExternalComponent } from '../common-external/common-external.component';

interface NotificationData {
  notifications: ScheduledNotification[];
}

interface ScheduledNotification {
  id: number;
  message: string;
  dateTime: string; // ISO string
  shown: boolean;
}

@Component({
  selector: 'app-notification',
  template: `
    <!-- 
      Features:
      - Schedule notifications with custom message and date/time.
      - Notifications list with status (upcoming/shown).
      - Download/upload all scheduled notifications as .txt file.
      - Uses local storage to persist data.
      - Simple, responsive design using Bootstrap 5 & PrimeIcons.
    -->
    <div class="card shadow-sm my-3">
      <div class="card-header d-flex justify-content-between align-items-center bg-primary text-white">
        <span>
          <i class="pi pi-bell"></i>
          Notification Scheduler
        </span>
        <div>
          <button class="btn btn-light btn-sm me-2" title="Download Data"
            (click)="downloadData()">
            <i class="pi pi-download"></i>
          </button>
          <label class="btn btn-light btn-sm mb-0" title="Upload Data">
            <i class="pi pi-upload"></i>
            <input type="file" accept=".txt" hidden (change)="uploadData($event)">
          </label>
        </div>
      </div>
      <div class="card-body">
        <form class="row g-2 align-items-end" (ngSubmit)="scheduleNotification()" #notifForm="ngForm">
          <div class="col-md-6">
            <label for="message" class="form-label">Message</label>
            <input required [(ngModel)]="newNotification.message" name="message" id="message" maxlength="100"
              class="form-control" placeholder="Enter notification message" />
          </div>
          <div class="col-md-4">
            <label for="dateTime" class="form-label">Date & Time</label>
            <input required [(ngModel)]="newNotification.dateTime" name="dateTime" id="dateTime"
              class="form-control" type="datetime-local" />
          </div>
          <div class="col-md-2">
            <button [disabled]="!newNotification.message || !newNotification.dateTime"
              class="btn btn-success w-100" type="submit">
              <i class="pi pi-plus"></i> Schedule
            </button>
          </div>
        </form>
        <hr>
        <div *ngIf="notifications.length === 0" class="text-muted text-center mt-4">
          <i class="pi pi-info-circle"></i> No notifications scheduled.
        </div>
        <ul class="list-group mt-2" *ngIf="notifications.length > 0">
          <li *ngFor="let notif of notifications" class="list-group-item d-flex justify-content-between align-items-center"
              [class.list-group-item-success]="notif.shown"
              [class.list-group-item-warning]="!notif.shown && isUpcoming(notif)">
            <div>
              <i class="pi pi-clock text-secondary me-2"></i>
              <strong>{{ notif.message }}</strong>
              <br>
              <small class="text-muted">
                {{ notif.dateTime | date:'medium' }}
              </small>
              <span *ngIf="notif.shown" class="badge bg-success ms-2">
                <i class="pi pi-check"></i> Shown
              </span>
              <span *ngIf="!notif.shown && isUpcoming(notif)" class="badge bg-warning text-dark ms-2">
                <i class="pi pi-hourglass"></i> Upcoming
              </span>
              <span *ngIf="!notif.shown && !isUpcoming(notif)" class="badge bg-danger ms-2">
                <i class="pi pi-times"></i> Missed
              </span>
            </div>
            <button class="btn btn-outline-danger btn-sm" (click)="deleteNotification(notif.id)">
              <i class="pi pi-trash"></i>
            </button>
          </li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .card { max-width: 600px; margin: auto; }
    input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
    .list-group-item { transition: background 0.2s; }
  `]
})
export class NotificationComponent extends CommonExternalComponent {
  notifications: ScheduledNotification[] = [];
  newNotification: { message: string; dateTime: string } = { message: '', dateTime: '' };
  private readonly LS_KEY = 'notification_app_data';

  constructor(private cd: ChangeDetectorRef) {
    super();
    this.loadNotifications();
    this.startNotificationWatcher();
  }

  scheduleNotification(): void {
    const notif: ScheduledNotification = {
      id: Date.now(),
      message: this.newNotification.message.trim(),
      dateTime: this.newNotification.dateTime,
      shown: false
    };
    this.notifications.push(notif);
    this.saveNotifications();
    this.newNotification = { message: '', dateTime: '' };
  }

  deleteNotification(id: number): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
  }

  saveNotifications(): void {
    const data: NotificationData = { notifications: this.notifications };
    localStorage.setItem(this.LS_KEY, JSON.stringify(data));
  }

  loadNotifications(): void {
    const dataStr = localStorage.getItem(this.LS_KEY);
    if (dataStr) {
      try {
        const data: NotificationData = JSON.parse(dataStr);
        this.notifications = data.notifications || [];
      } catch {
        this.notifications = [];
      }
    }
  }

  downloadData(): void {
    const data: NotificationData = { notifications: this.notifications };
    this.componentDataDownloader(data);
  }

  async uploadData(event: Event): Promise<void> {
    const data = await this.componentDataUploader(event);
    if (data && Array.isArray(data.notifications)) {
      this.notifications = data.notifications;
      this.saveNotifications();
      this.cd.detectChanges();
    }
  }

  isUpcoming(notif: ScheduledNotification): boolean {
    return new Date(notif.dateTime).getTime() > Date.now();
  }

  private startNotificationWatcher(): void {
    setInterval(() => {
      let changed = false;
      this.notifications.forEach(n => {
        if (!n.shown && new Date(n.dateTime).getTime() <= Date.now()) {
          n.shown = true;
          changed = true;
          this.showBrowserNotification(n.message);
        }
      });
      if (changed) {
        this.saveNotifications();
        this.cd.detectChanges();
      }
    }, 15000); // check every 15 seconds
  }

  private showBrowserNotification(message: string): void {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Scheduled Notification', { body: message });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Scheduled Notification', { body: message });
          }
        });
      }
    }
  }
}