export interface UserTaskListItem {
  idTask: number;
  title: string;
  idState: number;
  stateValue: string;
  dateAssignment: string;
  dateDelivery: string | null;
  isUnassigned: boolean;
  isOverdue: boolean;
}
