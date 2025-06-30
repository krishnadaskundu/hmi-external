import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonExternalComponent } from '../common-external/common-external.component';

/*
  Features:
  - Sends browser push notifications every 20 seconds while app is open.
  - Requests notification permission from user.
  - Download and upload app data (.txt) using base class functions.
  - App data is stored in localStorage by default.
  - Bootstrap 5 used for styling.
  - Note: Background notifications (when app/tab is closed) require Service Worker & server integration.
*/

@Component({
  selector: 'app-notification',
  template: `
    <div class="card shadow-sm">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span><i class="bi bi-bell"></i> Push Notification Demo</span>
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
          Please allow notifications to receive push alerts every 20 seconds.
        </div>
        <div *ngIf="permissionGranted" class="alert alert-success" role="alert">
          Notifications enabled! You will get a notification every 20 seconds while this page is open.
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
    }, 20000);
  }

  private sendNotification(): void {
    const title: string = 'Angular Push Notification';
    const options: NotificationOptions = {
      body: 'You are receiving this notification every 20 seconds!',
      icon: 'https://cdn-icons-png.flaticon.com/512/1827/1827379.png'
    };
    try {
      new Notification(title, options);
      this.updateAppData();
    } catch (e) {
      // Ignore errors if notifications blocked
    }
  }

  private updateAppData(): void {
    // Example: increment counter for notifications sent
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