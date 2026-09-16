import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('rfps')
export class Rfp {
  @PrimaryGeneratedColumn('uuid', { name: 'rfp_id' })
  rfpId!: string;

  @Column({ name: 'rfp_number', type: 'varchar', length: 100, unique: true })
  @Index()
  rfpNumber!: string;

  @Column({ name: 'rfp_title', type: 'text' })
  rfpTitle!: string;

  @Column({ name: 'rfp_description', type: 'text', nullable: true })
  rfpDescription?: string;

  @Column({ name: 'project_name', type: 'text' })
  projectName!: string;

  @Column({ name: 'project_location', type: 'varchar', length: 255, nullable: true })
  projectLocation?: string;

  @Column({ name: 'publish_date', type: 'date' })
  publishDate!: string;

  @Column({ name: 'bid_submission_deadline', type: 'date' })
  bidSubmissionDeadline!: string;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'draft' })
  @Index()
  status!: string;
}
