import { Component } from '@angular/core';
import { CommonExternalComponent } from '../common-external/common-external.component';

@Component({
  selector: 'app-static-text',
  template: `
    <div class="static-text-container">
      <h1>Welcome to Our Application!</h1>
      <p>This is a static text component that displays some information.</p>
    </div>
  `,
  styles: [`
    .static-text-container {
      text-align: center;
      margin: 20px;
      padding: 20px;
      border: 2px solid #007bff;
      border-radius: 8px;
      background-color: #f9f9f9;
    }
    h1 {
      color: #007bff;
      font-size: 24px;
    }
    p {
      color: #333;
      font-size: 16px;
    }
  `]
})
export class StaticText extends CommonExternalComponent {}