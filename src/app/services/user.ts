import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../enviroments/enviroment';
import { UserListItem } from '../models/user-list-item';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly getUsersUrl = `${environment.apiUrl}/Users`;
  private readonly getUsersFallbackUrl = `${environment.apiUrl}/User`;

  constructor(private readonly http: HttpClient) {}

  getUsers(): Observable<UserListItem[]> {
    return this.http.get<UserListItem[]>(this.getUsersUrl).pipe(
      catchError((error) => {
        if (error?.status === 404) {
          return this.http.get<UserListItem[]>(this.getUsersFallbackUrl);
        }

        return throwError(() => error);
      })
    );
  }
}
