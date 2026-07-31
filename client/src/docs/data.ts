export interface DeptOption {
  readonly value: string;
  readonly label: string;
}

export const deptOptions: readonly DeptOption[] = [
  { value: "Accounting", label: "Accounting" },
  { value: "Admin", label: "Admin" },
  { value: "Assembly", label: "Assembly" },
  { value: "HR", label: "Human Resources" },
  { value: "IT", label: "Information Technology" },
  { value: "Planning", label: "Planning" },
  { value: "Quality Control", label: "Quality Control" },
  { value: "Technology 1", label: "Technology 1" },
  { value: "Technology 2", label: "Technology 2" },
  { value: "Warehouse Plannig", label: "Warehouse Plannig" },
];
