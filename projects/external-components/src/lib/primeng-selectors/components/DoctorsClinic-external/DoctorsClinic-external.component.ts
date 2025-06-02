// DoctorsClinicComponent: Patient registration, appointment scheduling, search,
// WhatsApp reminders (with proper line breaks), and explicit country code input (default 91).
// Features: Bootstrap-styled forms, tables, buttons, and inputs for modern UI.

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonExternalComponent } from '../common-external/common-external.component';

interface Patient {
  name: string;
  dob: Date;
  countryCode: string;
  phone: string;
  whatsapp: string;
  email?: string;
  address?: string;
  appointments: Appointment[];
}

interface Appointment {
  date: Date;
  time: string;
  reason: string;
}

@Component({
  selector: 'app-doctors-clinic',
  template: `
    <form [formGroup]="patientForm" (ngSubmit)="addPatient()" class="clinic-form card shadow-sm p-4 mb-4">
      <h2 class="mb-3">Add New Patient</h2>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Name:
            <input formControlName="name" required class="form-control" />
          </label>
        </div>
        <div class="col-md-6">
          <label class="form-label">Date of Birth:
            <input type="date" formControlName="dob" required class="form-control" />
          </label>
        </div>
        <div class="col-md-3">
          <label class="form-label">Country Code:
            <input formControlName="countryCode" required maxlength="4" class="form-control" style="width:80px;" />
          </label>
        </div>
        <div class="col-md-4">
          <label class="form-label">Phone Number:
            <input formControlName="phone" required maxlength="15" class="form-control" />
          </label>
        </div>
        <div class="col-md-5">
          <label class="form-label w-100">WhatsApp Number:
            <div class="input-group">
              <input formControlName="whatsapp" required maxlength="15"
                [readonly]="patientForm.get('sameAsPhone')?.value" class="form-control" />
              <span class="input-group-text bg-white border-0">
                <input type="checkbox" formControlName="sameAsPhone" class="form-check-input me-1" /> Same as above
              </span>
            </div>
          </label>
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
      <button type="submit" [disabled]="!patientForm.valid" class="btn btn-primary mt-3">Save Patient</button>
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
            {{ patient.name }} <small class="text-muted">({{ patient.dob | date:'mediumDate' }})</small>
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
    `
  ],
})
export class DoctorsClinicComponent extends CommonExternalComponent implements OnInit {
  patientForm: FormGroup;
  appointmentForm: FormGroup;
  patients: Patient[] = [];
  selectedPatientIdx: number | null = null;

  // For search functionality
  searchTerm: string = '';
  filteredPatients: Patient[] = [];
  private filteredPatientIndices: number[] = [];

  constructor(private fb: FormBuilder) {
    super();
    this.patientForm = this.fb.group({
      name: ['', Validators.required],
      dob: ['', Validators.required],
      countryCode: ['91', [Validators.required, Validators.maxLength(4)]],
      phone: ['', [Validators.required, Validators.maxLength(15)]],
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

  ngOnInit(): void {
    // Sync WhatsApp number with Phone if "Same as above" is checked
    this.patientForm.get('sameAsPhone')?.valueChanges.subscribe((checked: boolean) => {
      if (checked) {
        const phoneValue: string = this.patientForm.get('phone')?.value || '';
        this.patientForm.get('whatsapp')?.setValue(phoneValue);
        this.patientForm.get('whatsapp')?.disable();
      } else {
        this.patientForm.get('whatsapp')?.enable();
      }
    });

    // Also update WhatsApp number when phone changes and "Same as above" is checked
    this.patientForm.get('phone')?.valueChanges.subscribe((phoneValue: string) => {
      if (this.patientForm.get('sameAsPhone')?.value) {
        this.patientForm.get('whatsapp')?.setValue(phoneValue || '');
      }
    });

    this.updateFilteredPatients();
  }

  addPatient(): void {
    if (this.patientForm.valid) {
      const formValue = this.patientForm.getRawValue();
      const patient: Patient = {
        name: formValue.name,
        dob: formValue.dob,
        countryCode: formValue.countryCode,
        phone: formValue.phone,
        whatsapp: formValue.whatsapp,
        email: formValue.email,
        address: formValue.address,
        appointments: [],
      };
      this.patients.push(patient);
      this.patientForm.reset({ countryCode: '91' });
      this.patientForm.get('whatsapp')?.enable();
      this.updateFilteredPatients();
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

  addAppointment(): void {
    if (this.selectedPatientIdx !== null && this.appointmentForm.valid) {
      const appointment: Appointment = {
        ...this.appointmentForm.value,
      };
      this.patients[this.selectedPatientIdx].appointments.push(appointment);
      this.selectedPatientIdx = null;
      this.appointmentForm.reset();
      this.updateFilteredPatients();
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
          acc: { patientName: string; appointment: Appointment; patient: Patient }[],
          patient: Patient
        ) => {
          const upcoming = patient.appointments
            .filter((app: Appointment) => new Date(app.date) >= now)
            .map((app: Appointment) => ({
              patientName: patient.name,
              appointment: app,
              patient: patient
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
          patient.phone.toLowerCase().includes(term)
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

    let countryCode: string = (patient.countryCode || '91').replace(/[^\d]/g, '');

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
