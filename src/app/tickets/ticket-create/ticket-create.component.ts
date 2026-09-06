import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TicketService } from '../../core/services/ticket.service';
import { TICKET_STATUSES, TICKET_PRIORITIES } from '../../core/models/ticket.models';
import { ValidationApiError } from '../../core/models/error.models';
import { ReplacePipe } from '../../shared/pipes/replace.pipe';

@Component({
  selector: 'app-ticket-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReplacePipe,
  ],
  template: `
    <div class="page-header">
      <button mat-icon-button routerLink="/dashboard">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1>New Ticket</h1>
    </div>

    <mat-card class="form-card">
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field class="full-width">
            <mat-label>Title</mat-label>
            <input matInput formControlName="title" placeholder="Brief description of the issue" />
            @if (fieldError('title') || (form.get('title')?.invalid && form.get('title')?.touched)) {
              <mat-error>{{ fieldError('title') || 'Title must be 5–200 characters' }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field class="full-width">
            <mat-label>Description</mat-label>
            <textarea
              matInput
              formControlName="description"
              rows="6"
              placeholder="Detailed description of the issue"
            ></textarea>
            @if (fieldError('description') || (form.get('description')?.invalid && form.get('description')?.touched)) {
              <mat-error>{{ fieldError('description') || 'Description must be 10–5000 characters' }}</mat-error>
            }
          </mat-form-field>

          <div class="row-fields">
            <mat-form-field>
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                @for (s of statuses; track s) {
                  <mat-option [value]="s">{{ s | replace:'_':' ' }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Priority</mat-label>
              <mat-select formControlName="priority">
                @for (p of priorities; track p) {
                  <mat-option [value]="p">{{ p }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          @if (generalError) {
            <p class="error-message">{{ generalError }}</p>
          }

          <div class="form-actions">
            <button mat-button type="button" routerLink="/dashboard">Cancel</button>
            <button mat-raised-button color="primary" type="submit" [disabled]="loading">
              @if (loading) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Create Ticket
              }
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    h1 {
      margin: 0;
    }
    .form-card {
      max-width: 700px;
    }
    .row-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .row-fields mat-form-field {
      width: 100%;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
    .error-message {
      color: #f44336;
      font-size: 12px;
    }
  `],
})
export class TicketCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ticketService = inject(TicketService);
  private readonly router = inject(Router);

  statuses = TICKET_STATUSES;
  priorities = TICKET_PRIORITIES;

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    status: ['OPEN', Validators.required],
    priority: ['MEDIUM', Validators.required],
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

    const { title, description, status, priority } = this.form.value;
    this.ticketService
      .create({
        title: title!,
        description: description!,
        status: status as any,
        priority: priority as any,
      })
      .subscribe({
        next: (ticket) => this.router.navigate(['/tickets', ticket.id]),
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          const body = err.error as ValidationApiError;
          if (body?.fieldErrors) {
            this.serverFieldErrors = body.fieldErrors;
          } else {
            this.generalError = body?.message ?? 'Failed to create ticket. Try again.';
          }
        },
      });
  }
}
