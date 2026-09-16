import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { WorkflowExecution } from './workflow-execution.entity';

@Entity('workflow_steps')
export class WorkflowStep {
  @PrimaryGeneratedColumn({ name: 'step_id' })
  stepId: number;

  @Column({ name: 'workflow_id', type: 'varchar', length: 100 })
  workflowId: string;

  @ManyToOne(() => WorkflowExecution, execution => execution.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflowExecution: WorkflowExecution;

  @Column({ name: 'step_number', type: 'int' })
  stepNumber: number;

  @Column({ name: 'step_name', type: 'varchar', length: 100 })
  stepName: string;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'pending' })
  status: string; // pending, in_progress, completed, failed, skipped

  @Column({ name: 'start_time', type: 'timestamp', nullable: true })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ name: 'duration_ms', type: 'decimal', precision: 10, scale: 2, nullable: true })
  durationMs: number;

  @Column({ name: 'result', type: 'jsonb', nullable: true })
  result: any;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
