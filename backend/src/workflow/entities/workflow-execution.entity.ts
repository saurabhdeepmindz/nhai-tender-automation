import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Query } from '../../queries/entities/query.entity';
import { WorkflowStep } from './workflow-step.entity';

@Entity('workflow_executions')
export class WorkflowExecution {
  @PrimaryColumn({ name: 'workflow_id', type: 'varchar', length: 100 })
  workflowId: string;

  @Column({ name: 'query_id', type: 'uuid' })
  queryId: string;

  @ManyToOne(() => Query, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'query_id' })
  query: Query;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'pending' })
  status: string; // pending, in_progress, completed, failed

  @Column({ name: 'current_step', type: 'int', default: 0 })
  currentStep: number;

  @Column({ name: 'total_steps', type: 'int', default: 6 })
  totalSteps: number;

  @Column({ name: 'processing_start', type: 'timestamp', nullable: true })
  processingStart: Date;

  @Column({ name: 'processing_end', type: 'timestamp', nullable: true })
  processingEnd: Date;

  @Column({ name: 'total_duration_ms', type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalDurationMs: number;

  @Column({ name: 'final_result', type: 'jsonb', nullable: true })
  finalResult: any;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => WorkflowStep, step => step.workflowExecution)
  steps: WorkflowStep[];
}
