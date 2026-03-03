import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService, LoginCredentials } from '../../core/auth';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss'
})
export class LoginPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly loginForm = this.fb.nonNullable.group({
    user: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    pwd: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(100)]]
  });

  ngOnInit(): void {
    const existingToken = this.authService.getToken();
    if (existingToken) {
      const storedRole = this.authService.getRole();
      if (storedRole) {
        this.routeByRole(storedRole);
        return;
      }

      const roleFromToken = this.authService.getRoleFromToken(existingToken);
      if (roleFromToken) {
        this.routeByRole(roleFromToken);
      }
    }
  }

  submit(): void {
    this.errorMessage.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials = this.buildCredentials();
    this.loading.set(true);

    this.authService.login(credentials).subscribe({
      next: ({ role }) => {
        this.loading.set(false);
        this.routeByRole(role || 'usuario');
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('No se pudo iniciar sesion. Verifica usuario y contrasena.');
      }
    });
  }

  private buildCredentials(): LoginCredentials {
    const { user, pwd } = this.loginForm.getRawValue();

    return {
      UserName: user.trim(),
      Password: pwd.trim()
    };
  }

  private routeByRole(roleValue: string): void {
    const role = (roleValue ?? '').trim().toLowerCase();
    if (role === 'admin') {
      void this.router.navigate(['/admin']);
      return;
    }

    void this.router.navigate(['/usuario']);
  }
}
