export interface TaskAssignee {
  idUser: number;
  userName: string;
  role: string;
}

export interface TaskListItem {
  idTask: number;
  title: string;
  idState: number;
  stateCode: number;
  stateValue: string;
  dateAssignment: string;
  dateDelivery: string;
  assignees: TaskAssignee[];
  isUnassigned: boolean;
  isOverdue: boolean;
}
