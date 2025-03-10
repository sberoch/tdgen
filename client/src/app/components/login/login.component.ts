import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-container">
      <h2>Login Page</h2>
      <p>This is a simple login page for testing routes.</p>
    </div>
  `,
  styles: [
    `
      .login-container {
        padding: 2rem;
        text-align: center;
      }
    `,
  ],
})
export class LoginComponent {}
