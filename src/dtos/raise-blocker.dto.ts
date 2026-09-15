import { BlockerCategory } from "../entities/blocker.entity";

export interface RaiseBlockerDto {
  taskId: string;
  category: BlockerCategory;
  description: string;
  ownerId: string;
  blockingTaskId?: string;
  actorId: string;
}
