import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, SlicePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TicketService } from '../../core/services/ticket.service';
import { AuthService } from '../../core/services/auth.service';
import { Ticket, Page } from '../../core/models/ticket.models';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatCardModule,
    MatTooltipModule,
    StatusChipComponent,
    SlicePipe,
  ],
  template: `
    <div class="page-header">
      <h1>Tickets</h1>
      @if (authService.hasAnyRole('ROLE_ADMIN', 'ROLE_AGENT')) {
        <button mat-raised-button color="primary" routerLink="/tickets/new">
          <mat-icon>add</mat-icon>
          New Ticket
        </button>
      }
    </div>

    @if (loading) {
      <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    }

    @if (errorMessage) {
      <mat-card class="error-card">
        <mat-card-content>{{ errorMessage }}</mat-card-content>
      </mat-card>
    }

    <mat-card>
      <table mat-table [dataSource]="tickets" class="full-width">
        <!-- ID column -->
        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef>ID</th>
          <td mat-cell *matCellDef="let t" class="id-cell">
            <span [matTooltip]="t.id">{{ t.id | slice:0:8 }}…</span>
          </td>
        </ng-container>

        <!-- Title column -->
        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef>Title</th>
          <td mat-cell *matCellDef="let t" class="title-cell">{{ t.title }}</td>
        </ng-container>

        <!-- Status column -->
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let t">
            <app-status-chip [status]="t.status" />
          </td>
        </ng-container>

        <!-- Priority column -->
        <ng-container matColumnDef="priority">
          <th mat-header-cell *matHeaderCellDef>Priority</th>
          <td mat-cell *matCellDef="let t">
            <app-status-chip [priority]="t.priority" />
          </td>
        </ng-container>

        <!-- Created by column -->
        <ng-container matColumnDef="createdBy">
          <th mat-header-cell *matHeaderCellDef>Created By</th>
          <td mat-cell *matCellDef="let t">{{ t.createdBy ?? '—' }}</td>
        </ng-container>

        <!-- Created at column -->
        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef>Created</th>
          <td mat-cell *matCellDef="let t">{{ t.createdAt | date:'dd MMM y, HH:mm' }}</td>
        </ng-container>

        <!-- Actions column -->
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let t">
            <button mat-icon-button [routerLink]="['/tickets', t.id]" matTooltip="View ticket">
              <mat-icon>open_in_new</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr
          mat-row
          *matRowDef="let t; columns: displayedColumns"
          class="clickable-row"
          (click)="router.navigate(['/tickets', t.id])"
        ></tr>
      </table>

      <mat-paginator
        [length]="totalElements"
        [pageSize]="pageSize"
        [pageIndex]="pageIndex"
        [pageSizeOptions]="[10, 20, 50]"
        (page)="onPage($event)"
        showFirstLastButtons
      ></mat-paginator>
    </mat-card>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    h1 {
      margin: 0;
    }
    .id-cell {
      font-family: monospace;
      font-size: 12px;
    }
    .title-cell {
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .clickable-row:hover {
      background-color: rgba(0, 0, 0, 0.04);
      cursor: pointer;
    }
    .error-card {
      background-color: #ffebee;
      margin-bottom: 16px;
    }
  `],
})
export class TicketListComponent implements OnInit {
  readonly router = inject(Router);
  private readonly ticketService = inject(TicketService);
  readonly authService = inject(AuthService);

  displayedColumns = ['id', 'title', 'status', 'priority', 'createdBy', 'createdAt', 'actions'];
  tickets: Ticket[] = [];
  totalElements = 0;
  pageSize = 20;
  pageIndex = 0;
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading = true;
    this.errorMessage = '';
    this.ticketService.listPaged(this.pageIndex, this.pageSize).subscribe({
      next: (page: Page<Ticket>) => {
        this.tickets = page.content;
        this.totalElements = page.totalElements;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Failed to load tickets. Please try again.';
      },
    });
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTickets();
  }
}
