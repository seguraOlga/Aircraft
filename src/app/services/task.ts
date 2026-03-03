import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../enviroments/enviroment';
import { TaskListItem } from '../models/task-list-item';
import { UserTaskListItem } from '../models/user-task-list-item';

export interface CreateTaskRequest {
  Title: string;
  Description: string;
  DateDelivery: string;
}

export interface SetAssigneesRequest {
  UserIds: number[];
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly getTasksUrl = `${environment.apiUrl}/Task`;
  private readonly getMyTasksUrl = `${environment.apiUrl}/Task/my-tasks`;
  private readonly setAssigneesUrl = `${environment.apiUrl}/Assignements`;

  constructor(private readonly http: HttpClient) {}

  getTasks(): Observable<TaskListItem[]> {
    return this.http.get<TaskListItem[]>(this.getTasksUrl);
  }

  getMyTasks(): Observable<UserTaskListItem[]> {
    return this.http.get<UserTaskListItem[]>(this.getMyTasksUrl);
  }

  createTask(request: CreateTaskRequest): Observable<number | null> {
    return this.http
      .post<number | { idTask?: number; IdTask?: number }>(this.getTasksUrl, request, { observe: 'response' })
      .pipe(
        map((response) => {
          const { body } = response;

          if (typeof body === 'number') {
            return body;
          }

          if (typeof body === 'object' && body !== null) {
            if (typeof body.idTask === 'number') {
              return body.idTask;
            }

            if (typeof body.IdTask === 'number') {
              return body.IdTask;
            }
          }

          const location = response.headers.get('Location') ?? response.headers.get('location');
          if (location) {
            const match = location.match(/\/(\d+)(?:\?.*)?$/);
            if (match) {
              return Number(match[1]);
            }

            const idInQuery = location.match(/[?&]id=(\d+)/i);
            if (idInQuery) {
              return Number(idInQuery[1]);
            }
          }

          return null;
        })
      );
  }

  setTaskAssignees(taskId: number, userIds: number[]): Observable<void> {
    const body: SetAssigneesRequest = { UserIds: userIds };
    return this.http.put<void>(`${this.setAssigneesUrl}/${taskId}`, body);
  }
}
