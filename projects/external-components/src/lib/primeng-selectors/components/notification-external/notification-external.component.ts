import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonExternalComponent } from '../common-external/common-external.component';

/*
  Features:
  - Triggers notification every 5 minutes using Service Worker if available, else falls back to Notification API.
  - Requests user permission for notifications.
  - Download/Upload app data (.txt) via provided functions.
  - App data stored in localStorage.
  - Bootstrap 5 styling.
  - Note: This works only while app/tab is open; background push requires backend + service worker push event.
*/

@Component({
  selector: 'app-notification',
  template: `
    <div class="card shadow-sm">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span><i class="bi bi-bell"></i> Push Notification Demo (Service Worker)</span>
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
        <div *ngIf="!permissionGranted" class="alert alert-warning" role="alert">
          Please allow notifications to receive push alerts every 5 minutes.
        </div>
        <div *ngIf="permissionGranted" class="alert alert-success" role="alert">
          Notifications enabled! You will get a notification every 5 minutes while this page is open.
        </div>
        <p class="mb-2">App Data (stored in localStorage):</p>
        <pre class="bg-light p-2 rounded">{{ appData | json }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .card { max-width: 480px; margin: 2rem auto; }
    pre { font-size: 0.95rem; }
  `]
})
export class NotificationComponent extends CommonExternalComponent {
  public permissionGranted: boolean = false;
  public appData: Record<string, unknown> = {};
  private notificationIntervalId: number | null = null;
  private readonly NOTIFICATION_INTERVAL_MS: number = 300000; // 5 minutes

  constructor(private cdr: ChangeDetectorRef) {
    super();
    this.loadAppData();
  }

  ngOnInit(): void {
    this.checkNotificationPermission();
  }

  ngOnDestroy(): void {
    if (this.notificationIntervalId !== null) {
      clearInterval(this.notificationIntervalId);
    }
  }

  private checkNotificationPermission(): void {
    if (!('Notification' in window)) {
      this.permissionGranted = false;
      return;
    }
    if (Notification.permission === 'granted') {
      this.permissionGranted = true;
      this.startNotifications();
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission: NotificationPermission) => {
        this.permissionGranted = (permission === 'granted');
        if (this.permissionGranted) {
          this.startNotifications();
        }
        this.cdr.detectChanges();
      });
    }
  }

  private startNotifications(): void {
    this.sendNotification(); // Send first immediately
    this.notificationIntervalId = window.setInterval(() => {
      this.sendNotification();
    }, this.NOTIFICATION_INTERVAL_MS);
  }

  private async sendNotification(): Promise<void> {
    const title: string = 'Angular SW Notification';
    const body: string = 'This notification uses Service Worker if available!';
    const icon: string = 'https://cdn-icons-png.flaticon.com/512/1827/1827379.png';
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.showNotification(title, {
            body,
            icon,
            tag: 'local-notification'
          });
        } else {
          new Notification(title, { body, icon });
        }
      } else {
        new Notification(title, { body, icon });
      }
      this.updateAppData();
    } catch (e) {
      // Ignore errors if notifications blocked
    }
  }

  private updateAppData(): void {
    const count: number = Number(localStorage.getItem('notification_count')) || 0;
    const newCount: number = count + 1;
    localStorage.setItem('notification_count', String(newCount));
    this.appData = { notification_count: newCount, last_sent: new Date().toISOString() };
    this.cdr.detectChanges();
  }

  private loadAppData(): void {
    const count: number = Number(localStorage.getItem('notification_count')) || 0;
    this.appData = { notification_count: count };
  }

  downloadData(): void {
    this.componentDataDownloader(this.appData);
  }

  async uploadData(event: Event): Promise<void> {
    const uploaded = await this.componentDataUploader(event);
    if (uploaded && typeof uploaded === 'object') {
      this.appData = uploaded;
      if ('notification_count' in uploaded) {
        localStorage.setItem('notification_count', String(uploaded['notification_count']));
      }
      this.cdr.detectChanges();
    }
  }
}