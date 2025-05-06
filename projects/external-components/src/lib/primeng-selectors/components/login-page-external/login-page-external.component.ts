import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonExternalComponent } from '../common-external/common-external.component';

/*
  Features:
  - Simple login form with email and password fields
  - Inline validation for required fields and valid email format
  - Submit button disabled until the form is valid
*/

@Component({
  selector: 'app-login-page',
  template: `
    <div class="login-container">
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
        <h2>Login</h2>
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" />
          <div class="error" *ngIf="email.invalid && (email.dirty || email.touched)">
            <span *ngIf="email.errors?.['required']">Email is required.</span>
            <span *ngIf="email.errors?.['email']">Enter a valid email.</span>
          </div>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input id="password" type="password" formControlName="password" />
          <div class="error" *ngIf="password.invalid && (password.dirty || password.touched)">
            <span *ngIf="password.errors?.['required']">Password is required.</span>
          </div>
        </div>
        <button type="submit" [disabled]="loginForm.invalid">Login</button>
      </form>
    </div>
  `,
  styles: [`
    .login-container {
      max-width: 350px;
      margin: 40px auto;
      padding: 24px;
      border-radius: 8px;
      background: #f7f7f7;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    }
    h2 {
      text-align: center;
      margin-bottom: 18px;
    }
    .form-group {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-weight: 500;
      margin-bottom: 6px;
    }
    input[type="email"], input[type="password"] {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 15px;
    }
    .error {
      color: #e53935;
      font-size: 13px;
      margin-top: 3px;
    }
    button {
      width: 100%;
      padding: 10px;
      background: #1976d2;
      color: #fff;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.2s;
    }
    button[disabled] {
      background: #90caf9;
      cursor: not-allowed;
    }
  `]
})
export class LoginPageComponent extends CommonExternalComponent {
  loginForm: FormGroup;

  constructor(private readonly fb: FormBuilder) {
    super();
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  get email() {
    return this.loginForm.get('email')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      // Handle login logic here
      // e.g., emit event or call authentication service
    }
  }
}