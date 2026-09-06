import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService, AVAILABLE_ROLES } from '../../core/services/admin.service';
import { ValidationApiError } from '../../core/models/error.models';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="page-header">
      <h1>User Management</h1>
    </div>

    <mat-card class="form-card">
      <mat-card-header>
        <mat-card-title>Create New User</mat-card-title>
        <mat-card-subtitle>Register a user with explicit roles</mat-card-subtitle>
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

          <mat-form-field class="full-width">
            <mat-label>Roles</mat-label>
            <mat-select formControlName="roles" multiple>
              @for (role of availableRoles; track role) {
                <mat-option [value]="role">{{ role }}</mat-option>
              }
            </mat-select>
            @if (form.get('roles')?.invalid && form.get('roles')?.touched) {
              <mat-error>Select at least one role</mat-error>
            }
          </mat-form-field>

          @if (generalError) {
            <p class="error-message">{{ generalError }}</p>
          }

          <div class="form-actions">
            <button mat-raised-button color="primary" type="submit" [disabled]="loading">
              @if (loading) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Create User
              }
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header {
      margin-bottom: 16px;
    }
    h1 { margin: 0; }
    .form-card {
      max-width: 500px;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
    .error-message {
      color: #f44336;
      font-size: 12px;
    }
  `],
})
export class UserManagementComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly snackBar = inject(MatSnackBar);

  availableRoles = AVAILABLE_ROLES;

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    roles: [[] as string[], Validators.required],
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
    const roles = this.form.value.roles ?? [];
    if (roles.length === 0) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.generalError = '';
    this.serverFieldErrors = {};

    const { username, email, password } = this.form.value;
    this.adminService
      .registerUser({ username: username!, email: email!, password: password!, roles })
      .subscribe({
        next: () => {
          this.loading = false;
          this.form.reset();
          this.snackBar.open('User created successfully', 'Dismiss', { duration: 4000 });
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          const body = err.error as ValidationApiError;
          if (body?.fieldErrors) {
            this.serverFieldErrors = body.fieldErrors;
          } else {
            this.generalError = body?.message ?? 'Failed to create user. Try again.';
          }
        },
      });
  }
}
