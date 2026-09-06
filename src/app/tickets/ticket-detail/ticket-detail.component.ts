import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TicketService } from '../../core/services/ticket.service';
import { AuthService } from '../../core/services/auth.service';
import { Ticket, TicketDTO, TICKET_STATUSES, TICKET_PRIORITIES } from '../../core/models/ticket.models';
import { ValidationApiError } from '../../core/models/error.models';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ReplacePipe } from '../../shared/pipes/replace.pipe';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    StatusChipComponent,
    ReplacePipe,
  ],
  template: `
    @if (loadingTicket) {
      <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    }

    @if (ticket) {
      <div class="page-header">
        <button mat-icon-button routerLink="/dashboard">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Ticket Detail</h1>
        <span class="spacer"></span>

        @if (!editMode) {
          <button mat-stroked-button (click)="enterEdit()">
            <mat-icon>edit</mat-icon> Edit
          </button>
        }

        @if (authService.hasRole('ROLE_ADMIN')) {
          <button mat-stroked-button color="warn" (click)="deleteTicket()">
            <mat-icon>delete</mat-icon> Delete
          </button>
        }
      </div>

      <!-- View mode -->
      @if (!editMode) {
        <mat-card class="detail-card">
          <mat-card-header>
            <mat-card-title>{{ ticket.title }}</mat-card-title>
            <mat-card-subtitle>
              <app-status-chip [status]="ticket.status" />
              &nbsp;
              <app-status-chip [priority]="ticket.priority" />
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <p class="description">{{ ticket.description }}</p>
            <mat-divider></mat-divider>

            <dl class="meta-grid">
              <dt>Created by</dt>
              <dd>{{ ticket.createdBy ?? '—' }}</dd>

              <dt>Created at</dt>
              <dd>{{ ticket.createdAt | date:'dd MMM y, HH:mm' }}</dd>

              <dt>Last modified</dt>
              <dd>{{ ticket.modifiedAt | date:'dd MMM y, HH:mm' }}</dd>

              <dt>Assigned to</dt>
              <dd>{{ ticket.assignedTo ?? 'Unassigned' }}</dd>
            </dl>
          </mat-card-content>
        </mat-card>

        <!-- Assign section (ADMIN/AGENT only) -->
        @if (authService.hasAnyRole('ROLE_ADMIN', 'ROLE_AGENT')) {
          <mat-card class="detail-card assign-card">
            <mat-card-header>
              <mat-card-title>Assign Ticket</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="assignForm" (ngSubmit)="assignTicket()">
                <mat-form-field class="full-width">
                  <mat-label>Assignee email</mat-label>
                  <input matInput type="email" formControlName="assignedTo"
                    placeholder="agent@example.com" />
                  @if (assignForm.get('assignedTo')?.invalid && assignForm.get('assignedTo')?.touched) {
                    <mat-error>Enter a valid email</mat-error>
                  }
                </mat-form-field>
                @if (assignError) {
                  <p class="error-message">{{ assignError }}</p>
                }
                <button mat-raised-button color="accent" type="submit" [disabled]="savingAssign">
                  @if (savingAssign) { <mat-spinner diameter="20"></mat-spinner> }
                  @else { Assign }
                </button>
              </form>
            </mat-card-content>
          </mat-card>
        }
      }

      <!-- Edit mode -->
      @if (editMode) {
        <mat-card class="detail-card">
          <mat-card-header>
            <mat-card-title>Edit Ticket</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="editForm" (ngSubmit)="saveEdit()">
              <mat-form-field class="full-width">
                <mat-label>Title</mat-label>
                <input matInput formControlName="title" />
                @if (fieldError('title')) {
                  <mat-error>{{ fieldError('title') }}</mat-error>
                }
              </mat-form-field>

              <mat-form-field class="full-width">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="5"></textarea>
                @if (fieldError('description')) {
                  <mat-error>{{ fieldError('description') }}</mat-error>
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

              @if (editError) {
                <p class="error-message">{{ editError }}</p>
              }

              <div class="form-actions">
                <button mat-button type="button" (click)="cancelEdit()">Cancel</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="saving">
                  @if (saving) { <mat-spinner diameter="20"></mat-spinner> }
                  @else { Save Changes }
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }
    }
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    h1 { margin: 0; }
    .detail-card {
      max-width: 800px;
      margin-bottom: 16px;
    }
    .assign-card { }
    .description {
      white-space: pre-wrap;
      line-height: 1.6;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 160px 1fr;
      gap: 8px 16px;
      margin-top: 16px;
    }
    dt { font-weight: 500; color: rgba(0,0,0,0.6); }
    dd { margin: 0; }
    .row-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .row-fields mat-form-field { width: 100%; }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }
    .error-message { color: #f44336; font-size: 12px; }
  `],
})
export class TicketDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ticketService = inject(TicketService);
  readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  ticket: Ticket | null = null;
  loadingTicket = true;
  editMode = false;
  saving = false;
  savingAssign = false;
  editError = '';
  assignError = '';
  serverFieldErrors: Record<string, string> = {};

  statuses = TICKET_STATUSES;
  priorities = TICKET_PRIORITIES;

  editForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    status: ['', Validators.required],
    priority: ['', Validators.required],
  });

  assignForm = this.fb.group({
    assignedTo: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.ticketService.getById(id).subscribe({
      next: (t) => {
        this.ticket = t;
        this.loadingTicket = false;
      },
      error: () => {
        this.loadingTicket = false;
        this.router.navigate(['/dashboard']);
      },
    });
  }

  enterEdit(): void {
    if (!this.ticket) return;
    this.editForm.patchValue({
      title: this.ticket.title,
      description: this.ticket.description,
      status: this.ticket.status,
      priority: this.ticket.priority,
    });
    this.editMode = true;
  }

  cancelEdit(): void {
    this.editMode = false;
    this.editError = '';
    this.serverFieldErrors = {};
  }

  fieldError(field: string): string {
    return this.serverFieldErrors[field] ?? '';
  }

  saveEdit(): void {
    if (this.editForm.invalid || !this.ticket) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.editError = '';
    this.serverFieldErrors = {};

    const { title, description, status, priority } = this.editForm.value;
    const dto: TicketDTO = {
      title: title!,
      description: description!,
      status: status as any,
      priority: priority as any,
    };

    this.ticketService.update(this.ticket.id, dto).subscribe({
      next: (updated) => {
        this.ticket = updated;
        this.editMode = false;
        this.saving = false;
        this.snackBar.open('Ticket updated', 'Dismiss', { duration: 3000 });
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        const body = err.error as ValidationApiError;
        if (body?.fieldErrors) {
          this.serverFieldErrors = body.fieldErrors;
        } else {
          this.editError = body?.message ?? 'Failed to update ticket.';
        }
      },
    });
  }

  assignTicket(): void {
    if (this.assignForm.invalid || !this.ticket) {
      this.assignForm.markAllAsTouched();
      return;
    }
    this.savingAssign = true;
    this.assignError = '';

    const assignedTo = this.assignForm.value.assignedTo!;
    // PATCH requires a full valid TicketDTO (backend validates all fields)
    const dto: TicketDTO = {
      title: this.ticket.title,
      description: this.ticket.description,
      status: this.ticket.status,
      priority: this.ticket.priority,
      assignedTo,
    };

    this.ticketService.assign(this.ticket.id, dto).subscribe({
      next: (updated) => {
        this.ticket = updated;
        this.savingAssign = false;
        this.assignForm.reset();
        this.snackBar.open(`Ticket assigned to ${assignedTo}`, 'Dismiss', { duration: 3000 });
      },
      error: (err: HttpErrorResponse) => {
        this.savingAssign = false;
        this.assignError = err.error?.message ?? 'Failed to assign ticket. Check the email address.';
      },
    });
  }

  deleteTicket(): void {
    if (!this.ticket) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message: `Delete ticket "${this.ticket.title}"? This cannot be undone.` },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed && this.ticket) {
        this.ticketService.delete(this.ticket.id).subscribe({
          next: () => {
            this.snackBar.open('Ticket deleted', 'Dismiss', { duration: 3000 });
            this.router.navigate(['/dashboard']);
          },
          error: () =>
            this.snackBar.open('Failed to delete ticket', 'Dismiss', { duration: 3000 }),
        });
      }
    });
  }
}
