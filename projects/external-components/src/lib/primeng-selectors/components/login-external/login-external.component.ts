import { Component } from '@angular/core';
import { CommonExternalComponent } from '../common-external/common-external.component';

@Component({
  selector: 'app-login',
  template: `
    <div style="max-width: 400px; margin: auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
      <h2 style="text-align: center;">Login</h2>
      <form (submit)="onSubmit()" style="display: flex; flex-direction: column;">
        <label for="email" style="margin-bottom: 10px;">Email:</label>
        <input type="email" id="email" name="email" required style="margin-bottom: 15px; padding: 10px; border: 1px solid #ccc; border-radius: 4px;"/>
        
        <label for="password" style="margin-bottom: 10px;">Password:</label>
        <input type="password" id="password" name="password" required style="margin-bottom: 15px; padding: 10px; border: 1px solid #ccc; border-radius: 4px;"/>
        
        <button type="submit" style="padding: 10px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Login
        </button>
      </form>
    </div>
  `,
  styles: []
})
export class LoginComponent extends CommonExternalComponent {
  onSubmit() {
    // Handle login logic here
  }
}