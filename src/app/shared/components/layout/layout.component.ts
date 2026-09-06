import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    AsyncPipe,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #sidenav mode="side" opened class="sidenav">
        <mat-toolbar color="primary" class="sidenav-header">
          <span>E2D Helpdesk</span>
        </mat-toolbar>

        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>

          @if (authService.hasAnyRole('ROLE_ADMIN', 'ROLE_AGENT')) {
            <a mat-list-item routerLink="/tickets/new">
              <mat-icon matListItemIcon>add_circle</mat-icon>
              <span matListItemTitle>New Ticket</span>
            </a>
          }

          @if (authService.hasRole('ROLE_ADMIN')) {
            <a mat-list-item routerLink="/admin/users">
              <mat-icon matListItemIcon>manage_accounts</mat-icon>
              <span matListItemTitle>User Management</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="top-toolbar">
          <span class="spacer"></span>
          @if (user$ | async; as user) {
            <span class="username">{{ user.sub }}</span>
          }
          <button mat-icon-button [matMenuTriggerFor]="userMenu" aria-label="User menu">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu>
            <button mat-menu-item (click)="authService.logout()">
              <mat-icon>logout</mat-icon>
              <span>Logout</span>
            </button>
          </mat-menu>
        </mat-toolbar>

        <div class="content">
          <router-outlet />
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
    }
    .sidenav {
      width: 240px;
    }
    .sidenav-header {
      padding: 0 16px;
    }
    .top-toolbar {
      position: sticky;
      top: 0;
      z-index: 1;
    }
    .username {
      font-size: 14px;
      margin-right: 8px;
    }
    .content {
      padding: 24px;
    }
  `],
})
export class LayoutComponent {
  readonly authService = inject(AuthService);
  readonly user$ = this.authService.currentUser$;
}
