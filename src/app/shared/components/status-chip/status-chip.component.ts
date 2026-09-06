import { Component, Input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { TicketStatus, TicketPriority } from '../../../core/models/ticket.models';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  imports: [MatChipsModule],
  template: `
    <mat-chip [class]="chipClass" disabled>{{ label }}</mat-chip>
  `,
})
export class StatusChipComponent {
  @Input() status?: TicketStatus;
  @Input() priority?: TicketPriority;

  get label(): string {
    return (this.status ?? this.priority ?? '').replace('_', ' ');
  }

  get chipClass(): string {
    if (this.status) {
      return `status-${this.status.toLowerCase().replace('_', '-')}`;
    }
    if (this.priority) {
      return `priority-${this.priority.toLowerCase()}`;
    }
    return '';
  }
}
