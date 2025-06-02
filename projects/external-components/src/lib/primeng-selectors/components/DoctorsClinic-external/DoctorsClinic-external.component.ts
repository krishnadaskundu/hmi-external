/**
 * DoctorsClinicComponent
 * ----------------------
 * - Patient management with IndexedDB (idb)
 * - Add/search patients, set appointments, send WhatsApp reminders
 * - Inline HTML & CSS, Angular 18 compatible, strict typing enforced
 * - Patient name field now shows a required asterisk (*)
 */

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonExternalComponent } from '../common-external/common-external.component';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface Patient {
  key?: string;
  name: string;
  dob?: Date | string;
  countryCode?: string;
  phone?: string;
  whatsapp: string;
  email?: string;
  address?: string;
  appointments: Appointment[];
}

interface Appointment {
  date: Date | string;
  time: string;
  reason: string;
}

interface ClinicDB extends DBSchema {
  patients: {
    key: string;
    value: Patient;
  };
}

@Component({
  selector: 'app-doctors-clinic',
  template: `
    <form [formGroup]="patientForm" (ngSubmit)="addPatient()" class="clinic-form card shadow-sm p-4 mb-4">
      <h2 class="mb-3">Add New Patient</h2>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Name: <span class="text-danger">*</span>
            <input formControlName="name" required class="form-control" />
          </label>
          <div *ngIf="patientForm.get('name')?.invalid && patientForm.get('name')?.touched" class="text-danger small">
            Name is required.
          </div>
        </div>
        <div class="col-md-6">
          <label class="form-label">Date of Birth:
            <input type="date" formControlName="dob" class="form-control" />
          </label>
        </div>
        <div class="col-md-3">
          <label class="form-label">Country Code:
            <input formControlName="countryCode" maxlength="4" class="form-control" style="width:80px;" />
          </label>
        </div>
        <div class="col-md-4">
          <label class="form-label">Phone Number:
            <input formControlName="phone" maxlength="15" class="form-control" />
          </label>
        </div>
        <div class="col-md-5">
          <label class="form-label w-100">WhatsApp Number: <span class="text-danger">*</span>
            <div class="input-group">
              <input formControlName="whatsapp" required maxlength="15"
                [readonly]="patientForm.get('sameAsPhone')?.value" class="form-control" />
              <span class="input-group-text bg-white border-0">
                <input type="checkbox" formControlName="sameAsPhone" class="form-check-input me-1" /> Same as above
              </span>
            </div>
          </label>
          <div *ngIf="patientForm.get('whatsapp')?.invalid && patientForm.get('whatsapp')?.touched" class="text-danger small">
            WhatsApp number is required.
          </div>
        </div>
        <div class="col-md-6">
          <label class="form-label">Email:
            <input formControlName="email" type="email" class="form-control" />
          </label>
        </div>
        <div class="col-md-6">
          <label class="form-label">Address:
            <input formControlName="address" class="form-control" />
          </label>
        </div>
      </div>
      <button type="submit"
        [disabled]="!patientForm.get('name')?.value || !patientForm.get('whatsapp')?.value"
        class="btn btn-primary mt-3">
        Save Patient
      </button>
    </form>

    <div class="patients-list card shadow-sm p-4 mb-4">
      <h2>Patients</h2>
      <div class="mb-3">
        <input
          type="text"
          placeholder="Search by name or phone"
          [(ngModel)]="searchTerm"
          (ngModelChange)="onSearchTermChange()"
          class="form-control search-box"
          name="patientSearch"
          autocomplete="off"
        />
      </div>
      <ul class="list-group">
        <li *ngFor="let patient of filteredPatients; let idx = index" class="list-group-item d-flex justify-content-between align-items-center">
          <span>
            {{ patient.name }} <small class="text-muted" *ngIf="patient.dob">({{ patient.dob | date:'mediumDate' }})</small>
          </span>
          <button (click)="selectPatient(getOriginalIndex(idx))" class="btn btn-outline-success btn-sm">Set Appointment</button>
        </li>
      </ul>
    </div>

    <form *ngIf="selectedPatientIdx !== null" [formGroup]="appointmentForm" (ngSubmit)="addAppointment()" class="appointment-form card shadow-sm p-4 mb-4">
      <h3 class="mb-3">New Appointment for <span class="text-primary">{{ patients[selectedPatientIdx]?.name }}</span></h3>
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label">Date:
            <input type="date" formControlName="date" required class="form-control" />
          </label>
        </div>
        <div class="col-md-4">
          <label class="form-label">Time:
            <input type="time" formControlName="time" required class="form-control" />
          </label>
        </div>
        <div class="col-md-4">
          <label class="form-label">Reason:
            <input formControlName="reason" required class="form-control" />
          </label>
        </div>
      </div>
      <div class="mt-3">
        <button type="submit" [disabled]="!appointmentForm.valid" class="btn btn-success me-2">Add Appointment</button>
        <button type="button" (click)="cancelAppointment()" class="btn btn-secondary">Cancel</button>
      </div>
    </form>

    <div class="appointments-table card shadow-sm p-4">
      <h2>Upcoming Appointments</h2>
      <div class="table-responsive">
        <table class="table table-bordered align-middle">
          <thead class="table-light">
            <tr>
              <th>Patient</th>
              <th>Date</th>
              <th>Time</th>
              <th>Reason</th>
              <th>Reminder</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of upcomingAppointments">
              <td>{{ item.patientName }}</td>
              <td>{{ item.appointment.date | date:'mediumDate' }}</td>
              <td>{{ item.appointment.time }}</td>
              <td>{{ item.appointment.reason }}</td>
              <td>
                <button
                  type="button"
                  (click)="sendWhatsAppReminder(item.patient, item.appointment)"
                  title="Send WhatsApp Reminder"
                  class="btn btn-outline-success btn-sm"
                >Send WhatsApp</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [
    `
    .card { border-radius: 10px; }
    .search-box { max-width: 320px; }
    .list-group-item { transition: background 0.2s; }
    .list-group-item:hover { background: #f8f9fa; }
    .btn { min-width: 110px; }
    .table th, .table td { vertical-align: middle; }
    `,
  ],
})
export class DoctorsClinicComponent
  extends CommonExternalComponent
  implements OnInit
{
  patientForm: FormGroup;
  appointmentForm: FormGroup;
  patients: Patient[] = [];
  selectedPatientIdx: number | null = null;
  searchTerm: string = '';
  filteredPatients: Patient[] = [];
  private filteredPatientIndices: number[] = [];
  private db!: IDBPDatabase<ClinicDB>;

  constructor(private fb: FormBuilder) {
    super();
    this.patientForm = this.fb.group({
      name: ['', Validators.required],
      dob: [''],
      countryCode: ['91', [Validators.maxLength(4)]],
      phone: ['', [Validators.maxLength(15)]],
      whatsapp: ['', [Validators.required, Validators.maxLength(15)]],
      sameAsPhone: [false],
      email: [''],
      address: [''],
    });

    this.appointmentForm = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required],
      reason: ['', Validators.required],
    });
  }

  async ngOnInit(): Promise<void> {
    await this.initDB();
    await this.loadPatientsFromDB();

    this.patientForm
      .get('sameAsPhone')
      ?.valueChanges.subscribe((checked: boolean) => {
        if (checked) {
          const phoneValue: string = this.patientForm.get('phone')?.value || '';
          this.patientForm.get('whatsapp')?.setValue(phoneValue);
          this.patientForm.get('whatsapp')?.disable();
        } else {
          this.patientForm.get('whatsapp')?.enable();
        }
      });

    this.patientForm
      .get('phone')
      ?.valueChanges.subscribe((phoneValue: string) => {
        if (this.patientForm.get('sameAsPhone')?.value) {
          this.patientForm.get('whatsapp')?.setValue(phoneValue || '');
        }
      });

    this.updateFilteredPatients();
  }

  private async initDB(): Promise<void> {
    this.db = await openDB<ClinicDB>('doctors-clinic-db', 1, {
      upgrade(db: IDBPDatabase<ClinicDB>) {
        if (!db.objectStoreNames.contains('patients')) {
          db.createObjectStore('patients', { keyPath: 'key' });
        }
      },
    });
  }

  private getPatientKey(name: string, whatsapp: string): string {
    return `${name.trim().toLowerCase()}_${whatsapp.trim()}`;
  }

  private async loadPatientsFromDB(): Promise<void> {
    const tx = this.db.transaction('patients', 'readonly');
    const store = tx.objectStore('patients');
    const allPatients: Patient[] = [];
    let cursor = await store.openCursor();
    while (cursor) {
      const patient = { ...cursor.value };
      delete (patient as any).key;
      allPatients.push(patient);
      cursor = await cursor.continue();
    }
    this.patients = allPatients;
    this.updateFilteredPatients();
  }

  async addPatient(): Promise<void> {
    if (
      this.patientForm.get('name')?.value &&
      this.patientForm.get('whatsapp')?.value
    ) {
      const formValue = this.patientForm.getRawValue();
      const patient: Patient = {
        name: formValue.name,
        dob: formValue.dob || undefined,
        countryCode: formValue.countryCode || undefined,
        phone: formValue.phone || undefined,
        whatsapp: formValue.whatsapp,
        email: formValue.email || undefined,
        address: formValue.address || undefined,
        appointments: [],
      };
      const key = this.getPatientKey(patient.name, patient.whatsapp);
      await this.db.put('patients', { ...patient, key });
      await this.loadPatientsFromDB();
      this.patientForm.reset({ countryCode: '91' });
      this.patientForm.get('whatsapp')?.enable();
    }
  }

  selectPatient(idx: number): void {
    this.selectedPatientIdx = idx;
    this.appointmentForm.reset();
  }

  cancelAppointment(): void {
    this.selectedPatientIdx = null;
    this.appointmentForm.reset();
  }

  async addAppointment(): Promise<void> {
    if (this.selectedPatientIdx !== null && this.appointmentForm.valid) {
      const appointment: Appointment = {
        ...this.appointmentForm.value,
      };
      const patient = this.patients[this.selectedPatientIdx];
      patient.appointments.push(appointment);
      const key = this.getPatientKey(patient.name, patient.whatsapp);
      await this.db.put('patients', { ...patient, key });
      await this.loadPatientsFromDB();
      this.selectedPatientIdx = null;
      this.appointmentForm.reset();
    }
  }

  get upcomingAppointments(): {
    patientName: string;
    appointment: Appointment;
    patient: Patient;
  }[] {
    const now: Date = new Date();
    return this.patients
      .reduce(
        (
          acc: {
            patientName: string;
            appointment: Appointment;
            patient: Patient;
          }[],
          patient: Patient
        ) => {
          const upcoming = patient.appointments
            .filter((app: Appointment) => new Date(app.date) >= now)
            .map((app: Appointment) => ({
              patientName: patient.name,
              appointment: app,
              patient: patient,
            }));
          return acc.concat(upcoming);
        },
        []
      )
      .sort((a, b) => {
        const d1 = new Date(a.appointment.date + 'T' + a.appointment.time);
        const d2 = new Date(b.appointment.date + 'T' + b.appointment.time);
        return d1.getTime() - d2.getTime();
      });
  }

  onSearchTermChange(): void {
    this.updateFilteredPatients();
  }

  private updateFilteredPatients(): void {
    const term: string = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredPatients = [...this.patients];
      this.filteredPatientIndices = this.patients.map((_p, i) => i);
    } else {
      this.filteredPatients = [];
      this.filteredPatientIndices = [];
      this.patients.forEach((patient: Patient, idx: number) => {
        if (
          patient.name.toLowerCase().includes(term) ||
          (patient.phone && patient.phone.toLowerCase().includes(term))
        ) {
          this.filteredPatients.push(patient);
          this.filteredPatientIndices.push(idx);
        }
      });
    }
  }

  getOriginalIndex(filteredIdx: number): number {
    return this.filteredPatientIndices[filteredIdx];
  }

  sendWhatsAppReminder(patient: Patient, appointment: Appointment): void {
    let phoneNumber: string = patient.whatsapp || '';
    let cleanPhoneNumber: string = phoneNumber.replace(/[^\d]/g, '');
    let countryCode: string = (patient.countryCode || '91').replace(
      /[^\d]/g,
      ''
    );
    cleanPhoneNumber = cleanPhoneNumber.replace(/^0+/, '');
    const phoneForWhatsApp = `${countryCode}${cleanPhoneNumber}`;
    const message: string =
      `Hi ${patient.name},\n` +
      `This is a reminder for your appointment at Swasthayu Clinic.\n` +
      `Date: ${this.formatDate(appointment.date)}\n` +
      `Time: ${appointment.time}\n` +
      `Reason: ${appointment.reason}\n\n` +
      `Thank you. \nBest regards, \nSwasthayu Clinic, Ravet`;
    const encodedMessage: string = encodeURIComponent(message);
    const whatsappUrl: string = `https://wa.me/${phoneForWhatsApp}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  private formatDate(date: Date | string): string {
    const d: Date = typeof date === 'string' ? new Date(date) : date;
    const day: string = ('0' + d.getDate()).slice(-2);
    const month: string = ('0' + (d.getMonth() + 1)).slice(-2);
    const year: string = d.getFullYear().toString();
    return `${day}/${month}/${year}`;
  }
}