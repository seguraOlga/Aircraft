import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { map, of, switchMap } from 'rxjs';

import { LogoutButton } from '../../components/logout-button/logout-button';
import { TaskListItem } from '../../models/task-list-item';
import { UserListItem } from '../../models/user-list-item';
import { CreateTaskRequest, TaskService } from '../../services/task';
import { UserService } from '../../services/user';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, LogoutButton],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard {
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly userService = inject(UserService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly tasks = signal<TaskListItem[]>([]);
  readonly usersLoading = signal(false);
  readonly usersError = signal<string | null>(null);
  readonly users = signal<UserListItem[]>([]);
  readonly selectedAssigneeIds = signal<number[]>([]);
  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);
  readonly createSuccess = signal<string | null>(null);

  readonly totalTasks = computed(() => this.tasks().length);
  readonly overdueTasks = computed(() => this.tasks().filter((task) => task.isOverdue).length);
  readonly unassignedTasks = computed(() => this.tasks().filter((task) => task.isUnassigned).length);
  readonly createTaskForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(1000)]],
    dateDelivery: [this.buildDefaultDateDelivery()]
  });

  constructor() {
    this.loadTasks();
    this.loadUsers();
  }

  loadTasks(): void {
    this.loading.set(true);
    this.error.set(null);

    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las tareas.');
        this.loading.set(false);
      }
    });
  }

  assigneesLabel(task: TaskListItem): string {
    if (!task.assignees.length) {
      return 'Sin asignar';
    }

    return task.assignees.map((assignee) => assignee.userName).join(', ');
  }

  loadUsers(): void {
    this.usersLoading.set(true);
    this.usersError.set(null);

    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.usersLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.usersError.set(`No se pudieron cargar los usuarios (HTTP ${error.status}).`);
        this.usersLoading.set(false);
      }
    });
  }

  toggleAssignee(userId: number, checked: boolean): void {
    this.selectedAssigneeIds.update((current) => {
      if (checked) {
        return current.includes(userId) ? current : [...current, userId];
      }

      return current.filter((id) => id !== userId);
    });
  }

  isAssigneeSelected(userId: number): boolean {
    return this.selectedAssigneeIds().includes(userId);
  }

  submitCreateTask(): void {
    this.createError.set(null);
    this.createSuccess.set(null);

    if (this.createTaskForm.invalid) {
      this.createTaskForm.markAllAsTouched();
      this.createError.set('Completa titulo y descripcion (minimo 3 caracteres).');
      return;
    }

    const { title, description, dateDelivery } = this.createTaskForm.getRawValue();
    const parsedUserIds = this.selectedAssigneeIds();
    const formattedDateDelivery = this.formatDateDelivery(dateDelivery);

    const request: CreateTaskRequest = {
      Title: title.trim(),
      Description: description.trim(),
      DateDelivery: formattedDateDelivery
    };

    this.creating.set(true);

    this.taskService
      .createTask(request)
      .pipe(
        switchMap((taskId) => {
          if (!parsedUserIds.length) {
            return of({ taskId, assignmentDone: false, assignmentSkippedByMissingId: false });
          }

          if (taskId === null) {
            return of({ taskId, assignmentDone: false, assignmentSkippedByMissingId: true });
          }

          return this.taskService
            .setTaskAssignees(taskId, parsedUserIds)
            .pipe(map(() => ({ taskId, assignmentDone: true, assignmentSkippedByMissingId: false })));
        })
      )
      .subscribe({
        next: (result) => {
          this.creating.set(false);
          if (result.assignmentSkippedByMissingId) {
            this.createSuccess.set('Tarea creada, pero no se pudo asignar automaticamente (id no disponible).');
          } else if (result.assignmentDone) {
            this.createSuccess.set('Tarea creada y asignada correctamente.');
          } else {
            this.createSuccess.set('Tarea creada correctamente.');
          }

          this.createTaskForm.reset({
            title: '',
            description: '',
            dateDelivery: this.buildDefaultDateDelivery()
          });
          this.selectedAssigneeIds.set([]);
          this.loadTasks();
        },
        error: (error: HttpErrorResponse) => {
          this.creating.set(false);
          if (typeof error.error === 'string' && error.error.trim().length > 0) {
            this.createError.set(error.error);
            return;
          }

          this.createError.set(`No se pudo completar la operacion (HTTP ${error.status}).`);
        }
      });
  }

  private formatDateDelivery(value: string): string {
    const normalized = value.trim();
    const defaultDateTime = this.buildDefaultDateDelivery();

    if (!normalized) {
      return `${defaultDateTime}:00`;
    }

    const onlyDatePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (onlyDatePattern.test(normalized)) {
      return `${normalized}T00:00:00`;
    }

    const withoutSecondsPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    if (withoutSecondsPattern.test(normalized)) {
      return `${normalized}:00`;
    }

    const withSecondsPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
    if (withSecondsPattern.test(normalized)) {
      return normalized;
    }

    return `${defaultDateTime}:00`;
  }

  private buildDefaultDateDelivery(): string {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    date.setHours(0, 0, 0, 0);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
