export interface ReviewDeliverableDto {
  taskId: string;
  decision: "accept" | "return";
  managerId: string;
  reason?: string; // Mandatory when decision is 'return'
}
