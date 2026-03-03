import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-logout-button',
  templateUrl: './logout-button.html',
  styleUrl: './logout-button.scss'
})
export class LogoutButton {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly label = input('Cerrar sesion');

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
