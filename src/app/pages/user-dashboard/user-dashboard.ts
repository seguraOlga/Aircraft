import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { LogoutButton } from '../../components/logout-button/logout-button';
import { UserTaskListItem } from '../../models/user-task-list-item';
import { TaskService } from '../../services/task';

@Component({
  selector: 'app-user-dashboard',
  imports: [DatePipe, LogoutButton],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.scss'
})
export class UserDashboard {
  private readonly taskService = inject(TaskService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly tasks = signal<UserTaskListItem[]>([]);

  readonly totalTasks = computed(() => this.tasks().length);
  readonly overdueTasks = computed(() => this.tasks().filter((task) => task.isOverdue).length);

  constructor() {
    this.loadMyTasks();
  }

  loadMyTasks(): void {
    this.loading.set(true);
    this.error.set(null);

    this.taskService.getMyTasks().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          this.error.set('No autorizado para consultar tus tareas. Inicia sesion de nuevo.');
          this.loading.set(false);
          return;
        }

        this.error.set(`No se pudieron cargar tus tareas (HTTP ${error.status}).`);
        this.loading.set(false);
      }
    });
  }
}
