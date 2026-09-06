import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { ValidationApiError } from '../../core/models/error.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Create Account</mat-card-title>
          <mat-card-subtitle>Register a new E2D Helpdesk account</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field class="full-width mt-16">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username" />
              @if (fieldError('username') || (form.get('username')?.invalid && form.get('username')?.touched)) {
                <mat-error>{{ fieldError('username') || 'Username must be 3–50 characters' }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
              @if (fieldError('email') || (form.get('email')?.invalid && form.get('email')?.touched)) {
                <mat-error>{{ fieldError('email') || 'Enter a valid email address' }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="new-password" />
              @if (fieldError('password') || (form.get('password')?.invalid && form.get('password')?.touched)) {
                <mat-error>{{ fieldError('password') || 'Password must be 8–100 characters' }}</mat-error>
              }
            </mat-form-field>

            @if (generalError) {
              <p class="error-message">{{ generalError }}</p>
            }

            <button
              mat-raised-button
              color="primary"
              class="full-width mt-16"
              type="submit"
              [disabled]="loading"
            >
              @if (loading) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Register
              }
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions align="end">
          <a mat-button routerLink="/login">Already have an account? Sign in</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
    }
    .auth-card {
      width: 400px;
      padding: 8px;
    }
    .error-message {
      color: #f44336;
      font-size: 12px;
      margin: 8px 0 0;
    }
  `],
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
  });

  loading = false;
  generalError = '';
  serverFieldErrors: Record<string, string> = {};

  fieldError(field: string): string {
    return this.serverFieldErrors[field] ?? '';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.generalError = '';
    this.serverFieldErrors = {};
    const { username, email, password } = this.form.value;
    this.authService
      .register({ username: username!, email: email!, password: password! })
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          const body = err.error as ValidationApiError;
          if (body?.fieldErrors) {
            this.serverFieldErrors = body.fieldErrors;
          } else {
            this.generalError = body?.message ?? 'Registration failed. Try again.';
          }
        },
      });
  }
}
