import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then(
        (m) => m.LayoutComponent
      ),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./tickets/ticket-list/ticket-list.component').then(
            (m) => m.TicketListComponent
          ),
      },
      {
        path: 'tickets/new',
        loadComponent: () =>
          import('./tickets/ticket-create/ticket-create.component').then(
            (m) => m.TicketCreateComponent
          ),
        canActivate: [roleGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_AGENT'] },
      },
      {
        path: 'tickets/:id',
        loadComponent: () =>
          import('./tickets/ticket-detail/ticket-detail.component').then(
            (m) => m.TicketDetailComponent
          ),
      },
      {
        path: 'admin/users',
        loadComponent: () =>
          import('./admin/user-management/user-management.component').then(
            (m) => m.UserManagementComponent
          ),
        canActivate: [roleGuard],
        data: { roles: ['ROLE_ADMIN'] },
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
