export interface Role {
  id: number;
  name: string;
}

export interface Priority {
  id: number;
  priorityName: string;
  roles: Role[];
}