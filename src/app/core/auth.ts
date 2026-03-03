import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../enviroments/enviroment';

export interface LoginCredentials {
  UserName: string;
  Password: string;
}

export interface LoginResponse {
  token: string;
  idUser: number;
  userName: string;
  role: string;
}

interface LoginApiResponse {
  token?: string;
  idUser?: number;
  userName?: string;
  role?: string;
  Token?: string;
  IdUser?: number;
  UserName?: string;
  Role?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenStorageKey = 'token';
  private readonly roleStorageKey = 'role';
  private readonly loginUrl = `${environment.apiUrl}/auth/login`;

  constructor(private readonly http: HttpClient) {}

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginApiResponse>(this.loginUrl, credentials).pipe(
      map((response) => {
        const token = response.token ?? response.Token ?? '';
        const idUser = response.idUser ?? response.IdUser ?? 0;
        const userName = response.userName ?? response.UserName ?? '';
        const role = response.role ?? response.Role ?? this.getRoleFromToken(token) ?? '';

        return {
          token,
          idUser,
          userName,
          role
        };
      }),
      tap((response) => {
        this.setToken(response.token);
        this.setRole(response.role);
      })
    );
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenStorageKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  logout(): void {
    localStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem(this.roleStorageKey);
  }

  getRole(): string | null {
    const role = localStorage.getItem(this.roleStorageKey);
    return this.normalizeRole(role);
  }

  setRole(role: string): void {
    const normalizedRole = this.normalizeRole(role);
    if (!normalizedRole) {
      localStorage.removeItem(this.roleStorageKey);
      return;
    }

    localStorage.setItem(this.roleStorageKey, normalizedRole);
  }

  getRoleFromToken(token: string): string | null {
    const payload = this.getJwtPayload(token);
    if (!payload) {
      return null;
    }

    const roleCandidate =
      payload['role'] ??
      payload['roles'] ??
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    if (Array.isArray(roleCandidate)) {
      return typeof roleCandidate[0] === 'string' ? this.normalizeRole(roleCandidate[0]) : null;
    }

    return typeof roleCandidate === 'string' ? this.normalizeRole(roleCandidate) : null;
  }

  private normalizeRole(role: string | null): string | null {
    if (!role) {
      return null;
    }

    return role.trim().toLowerCase();
  }

  private getJwtPayload(token: string): Record<string, unknown> | null {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    try {
      const payload = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');

      const decoded = atob(payload);
      return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
