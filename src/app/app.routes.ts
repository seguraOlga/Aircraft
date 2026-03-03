import { Routes } from '@angular/router';

import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { LoginPage } from './pages/login/login-page';
import { UserDashboard } from './pages/user-dashboard/user-dashboard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginPage },
  { path: 'admin', component: AdminDashboard },
  { path: 'usuario', component: UserDashboard },
  { path: '**', redirectTo: 'login' }
];
