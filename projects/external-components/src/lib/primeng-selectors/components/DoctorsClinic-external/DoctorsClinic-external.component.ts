// DoctorsClinicComponent: Patient registration, appointment scheduling, search,
// WhatsApp reminders (with proper line breaks), and explicit country code input (default 91).

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
    <form [formGroup]="patientForm" (ngSubmit)="addPatient()" class="clinic-form">
      <h2>Add New Patient</h2>
      <label>
        Name:
        <input formControlName="name" required />
      </label>
      <label>
        Date of Birth:
        <input type="date" formControlName="dob" required />
      </label>

      <label>
        Country Code:
        <input formControlName="countryCode" required maxlength="4" style="width:50px;" />
      </label>

      <label>
        Phone Number:
        <input formControlName="phone" required maxlength="15" />
      </label>

      <label>
        WhatsApp Number:
        <input formControlName="whatsapp" required maxlength="15" [readonly]="patientForm.get('sameAsPhone')?.value" />
        <label style="display:inline; margin-left:8px;">
          <input type="checkbox" formControlName="sameAsPhone" /> Same as above
        </label>
      </label>

      <label>
        Email:
        <input formControlName="email" type="email" />
      </label>
      <label>
        Address:
        <input formControlName="address" />
      </label>
      <button type="submit" [disabled]="!patientForm.valid">Save Patient</button>
    </form>

    <div class="patients-list">
      <h2>Patients</h2>
      <input
        type="text"
        placeholder="Search by name or phone"
        [(ngModel)]="searchTerm"
        (ngModelChange)="onSearchTermChange()"
        class="search-box"
        style="margin-bottom:12px; width:220px;"
        name="patientSearch"
        autocomplete="off"
      />
      <ul>
        <li *ngFor="let patient of filteredPatients; let idx = index">
          {{ patient.name }} ({{ patient.dob | date:'mediumDate' }})
          <button (click)="selectPatient(getOriginalIndex(idx))">Set Appointment</button>
        </li>
      </ul>
    </div>

    <form *ngIf="selectedPatientIdx !== null" [formGroup]="appointmentForm" (ngSubmit)="addAppointment()" class="appointment-form">
      <h3>New Appointment for {{ patients[selectedPatientIdx]?.name }}</h3>
      <label>
        Date:
        <input type="date" formControlName="date" required />
      </label>
      <label>
        Time:
        <input type="time" formControlName="time" required />
      </label>
      <label>
        Reason:
        <input formControlName="reason" required />
      </label>
      <button type="submit" [disabled]="!appointmentForm.valid">Add Appointment</button>
      <button type="button" (click)="cancelAppointment()">Cancel</button>
    </form>

    <div class="appointments-table">
      <h2>Upcoming Appointments</h2>
      <table>
        <thead>
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
              >Send WhatsApp</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
    .clinic-form, .appointment-form { border: 1px solid #ccc; padding: 16px; margin-bottom: 24px; border-radius: 8px; }
    label { display: block; margin-bottom: 8px; }
    input[type="text"], input[type="email"], input[type="date"], input[type="time"] { width: 200px; margin-left: 8px; }
    .patients-list ul { list-style: none; padding: 0; }
    .patients-list li { margin-bottom: 6px; }
    .appointments-table table { width: 100%; border-collapse: collapse; }
    .appointments-table th, .appointments-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .appointments-table th { background: #f7f7f7; }
    button { margin-top: 8px; margin-right: 8px; }
    .search-box { padding: 4px 8px; font-size: 15px; border-radius: 5px; border: 1px solid #aaa; }
  `,
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
      const formValue = this.patientForm.getRawValue(); // getRawValue gets disabled fields too
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
      this.patientForm.reset({ countryCode: '91' }); // Reset and set default country code
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
      this.updateFilteredPatients(); // To reflect any changes in the UI
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
    // Clean phone numbers (remove all non-digit characters)
    let phoneNumber: string = patient.whatsapp || '';
    let cleanPhoneNumber: string = phoneNumber.replace(/[^\d]/g, '');

    // Clean country code (remove non-digits)
    let countryCode: string = (patient.countryCode || '91').replace(/[^\d]/g, '');

    // Remove leading zeros from phone number if present
    cleanPhoneNumber = cleanPhoneNumber.replace(/^0+/, '');

    // Final phone for WhatsApp API: country code + phone
    const phoneForWhatsApp = `${countryCode}${cleanPhoneNumber}`;

    // Message (using \n for line breaks)
    const message: string =
      `Dear ${patient.name},\n` +
      `This is a reminder for your appointment at our clinic.\n` +
      `Date: ${this.formatDate(appointment.date)}\n` +
      `Time: ${appointment.time}\n` +
      `Reason: ${appointment.reason}\n\n` +
      `Please contact us if you need to reschedule.`;

    // Encode message for URL
    const encodedMessage: string = encodeURIComponent(message);

    // WhatsApp API URL
    const whatsappUrl: string = `https://wa.me/${phoneForWhatsApp}?text=${encodedMessage}`;

    // Open WhatsApp in new window/tab
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