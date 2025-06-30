import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonExternalComponent } from '../common-external/common-external.component';

/*
  Features:
  - Download current app data as .txt file using the header button.
  - Upload .txt file to restore app data; component updates automatically.
  - All app data is stored in local storage by default.
  - Bootstrap 5 used for responsive and modern styling.
  - Strict type checking enabled.
  - Asks user clarifying questions about notification requirements.
*/

@Component({
  selector: 'app-test1000',
  template: `
    <div class="card shadow-sm my-4">
      <div class="card-header d-flex justify-content-between align-items-center bg-primary text-white">
        <span>Notification App (Demo)</span>
        <div>
          <button class="btn btn-light btn-sm me-2" (click)="downloadData()">
            <i class="bi bi-download"></i> Download Data
          </button>
          <label class="btn btn-light btn-sm mb-0">
            <i class="bi bi-upload"></i> Upload Data
            <input type="file" accept=".txt" (change)="uploadData($event)" hidden />
          </label>
        </div>
      </div>
      <div class="card-body">
        <h5 class="card-title">Web Notifications Demo</h5>
        <p>
          This demo shows how notifications can be sent every 20 seconds <b>while the web app is open and active</b>.
          <br>
          <span class="text-danger">Due to browser security restrictions, sending notifications while the web app is closed is only possible using service workers and push notifications (requires backend server and user permission).</span>
        </p>
        <div class="alert alert-info">
          <strong>Clarification Needed:</strong><br>
          - Do you want to implement push notifications using a backend (e.g., Firebase Cloud Messaging) for notifications when the app is closed?<br>
          - Should users be able to customize the notification message or interval?<br>
          - Is user authentication required?
        </div>
        <button class="btn btn-success" (click)="startNotifications()" [disabled]="notifying">
          Start 20s Notifications
        </button>
        <button class="btn btn-secondary ms-2" (click)="stopNotifications()" [disabled]="!notifying">
          Stop Notifications
        </button>
        <div *ngIf="notificationStatus" class="mt-3 alert alert-warning">
          {{ notificationStatus }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card { max-width: 600px; margin: auto; }
    input[type="file"] { display: none; }
  `]
})
export class Test1000Component extends CommonExternalComponent {
  notifying: boolean = false;
  notificationIntervalId: number | null = null;
  notificationStatus: string = '';
  appData: { [key: string]: any } = {};

  constructor(private cdr: ChangeDetectorRef) {
    super();
    this.loadAppData();
  }

  // Download app data as .txt file
  downloadData(): void {
    this.componentDataDownloader(this.appData);
  }

  // Upload app data from .txt file
  async uploadData(event: Event): Promise<void> {
    const result = await this.componentDataUploader(event);
    if (result && typeof result === 'object') {
      this.appData = result;
      this.saveAppData();
      this.notificationStatus = 'Data uploaded and loaded successfully!';
      this.cdr.detectChanges();
    }
  }

  // Load app data from localStorage
  loadAppData(): void {
    const data = localStorage.getItem('test1000_app_data');
    if (data) {
      try {
        this.appData = JSON.parse(data);
      } catch {
        this.appData = {};
      }
    } else {
      this.appData = {};
    }
  }

  // Save app data to localStorage
  saveAppData(): void {
    localStorage.setItem('test1000_app_data', JSON.stringify(this.appData));
  }

  // Start showing notifications every 20 seconds (only when tab is open)
  startNotifications(): void {
    if (!('Notification' in window)) {
      this.notificationStatus = 'This browser does not support notifications.';
      return;
    }
    Notification.requestPermission().then(permission => {
      if (permission !== 'granted') {
        this.notificationStatus = 'Notification permission denied.';
        return;
      }
      this.notifying = true;
      this.notificationStatus = 'Notifications started. You will receive one every 20 seconds while this page is open.';
      this.sendNotification(); // Send immediately
      this.notificationIntervalId = window.setInterval(() => {
        this.sendNotification();
      }, 20000);
      this.cdr.detectChanges();
    });
  }

  // Stop notifications
  stopNotifications(): void {
    if (this.notificationIntervalId !== null) {
      clearInterval(this.notificationIntervalId);
      this.notificationIntervalId = null;
    }
    this.notifying = false;
    this.notificationStatus = 'Notifications stopped.';
    this.cdr.detectChanges();
  }

  // Show a notification
  sendNotification(): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Angular Notification', {
        body: 'This is your scheduled notification!',
        icon: 'https://angular.io/assets/images/logos/angular/angular.png'
      });
    }
  }
}