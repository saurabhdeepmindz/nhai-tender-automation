import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { HistoricalData } from './historical-data.entity';

@Entity('ai_references')
@Index(['historicalDataId'])
@Index(['referenceTime'])
@Index(['accuracyScore'])
export class AIReference {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => HistoricalData, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'historical_data_id' })
  historicalData: HistoricalData;

  @Column({ type: 'int' })
  historicalDataId: number;

  @Column({ length: 100 })
  rfpNumber: string;

  @Column({ type: 'text', nullable: true })
  queryContext: string;

  @Column({ type: 'text', nullable: true })
  responseGenerated: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  accuracyScore: number;

  @CreateDateColumn()
  referenceTime: Date;

  @Column({ type: 'int', nullable: true })
  queryId: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Feedback from admin/user on the AI response quality
  @Column({ type: 'boolean', nullable: true })
  wasHelpful: boolean;

  @Column({ type: 'text', nullable: true })
  feedbackNotes: string;
}
