import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  JwtPayload,
} from '../models/auth.models';
import { decodeJwt, isTokenExpired } from '../utils/jwt.utils';

const ACCESS_TOKEN_KEY = 'e2d_access_token';
const REFRESH_TOKEN_KEY = 'e2d_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = environment.apiUrl;

  private _currentUser$ = new BehaviorSubject<JwtPayload | null>(
    this._loadUserFromStorage()
  );

  /** Emits the decoded JWT payload whenever auth state changes. */
  readonly currentUser$ = this._currentUser$.asObservable();

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/auth/login`, req)
      .pipe(tap((res) => this._handleAuthResponse(res)));
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/auth/register`, req)
      .pipe(tap((res) => this._handleAuthResponse(res)));
  }

  refresh(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http
      .post<AuthResponse>(`${this.base}/auth/refresh`, { refreshToken })
      .pipe(tap((res) => this._handleAuthResponse(res)));
  }

  logout(): void {
    const token = this.getAccessToken();
    if (token) {
      // Fire-and-forget; ignore errors since we're clearing state regardless
      this.http
        .post(`${this.base}/auth/logout`, {})
        .subscribe({ error: () => {} });
    }
    this._clearStorage();
    this._currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    return !!token && !isTokenExpired(token);
  }

  getRoles(): string[] {
    return this._currentUser$.value?.roles ?? [];
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  hasAnyRole(...roles: string[]): boolean {
    const userRoles = this.getRoles();
    return roles.some((r) => userRoles.includes(r));
  }

  private _handleAuthResponse(res: AuthResponse): void {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    } catch {}
    const payload = decodeJwt(res.accessToken);
    this._currentUser$.next(payload);
  }

  private _clearStorage(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {}
  }

  private _loadUserFromStorage(): JwtPayload | null {
    const token = this.getAccessToken();
    if (!token || isTokenExpired(token)) {
      this._clearStorage();
      return null;
    }
    return decodeJwt(token);
  }
}
