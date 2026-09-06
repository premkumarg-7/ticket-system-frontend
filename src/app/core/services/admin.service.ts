import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminRegisterRequest, AuthResponse } from '../models/auth.models';

export const AVAILABLE_ROLES = ['ROLE_USER', 'ROLE_AGENT', 'ROLE_ADMIN'];

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  registerUser(req: AdminRegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/register`, req);
  }
}
