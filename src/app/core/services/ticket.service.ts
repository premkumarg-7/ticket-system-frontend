import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Ticket, TicketDTO, Page } from '../models/ticket.models';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/ticket`;

  /** Paginated list — preferred for the dashboard */
  listPaged(
    page = 0,
    size = 20,
    sort = 'createdAt,desc'
  ): Observable<Page<Ticket>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort);
    return this.http.get<Page<Ticket>>(`${this.base}/page`, { params });
  }

  /** Flat list — used for quick lookups */
  list(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.base);
  }

  getById(id: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.base}/${id}`);
  }

  create(dto: TicketDTO): Observable<Ticket> {
    return this.http.post<Ticket>(this.base, dto);
  }

  update(id: string, dto: TicketDTO): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.base}/${id}`, dto);
  }

  /** Assign a ticket to an agent/user by their email */
  assign(id: string, dto: TicketDTO): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.base}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
