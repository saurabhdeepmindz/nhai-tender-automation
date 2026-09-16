import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateWorkflowTables1738052400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create workflow_executions table
    await queryRunner.createTable(
      new Table({
        name: 'workflow_executions',
        columns: [
          {
            name: 'workflow_id',
            type: 'varchar',
            length: '100',
            isPrimary: true,
          },
          {
            name: 'query_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'pending'",
          },
          {
            name: 'current_step',
            type: 'int',
            isNullable: false,
            default: 0,
          },
          {
            name: 'total_steps',
            type: 'int',
            isNullable: false,
            default: 6,
          },
          {
            name: 'processing_start',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'processing_end',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'total_duration_ms',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'final_result',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for workflow_executions
    await queryRunner.createIndex(
      'workflow_executions',
      new TableIndex({
        name: 'idx_workflow_executions_query_id',
        columnNames: ['query_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'workflow_executions',
      new TableIndex({
        name: 'idx_workflow_executions_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'workflow_executions',
      new TableIndex({
        name: 'idx_workflow_executions_created_at',
        columnNames: ['created_at'],
      }),
    );

    // Create foreign key to queries table
    await queryRunner.createForeignKey(
      'workflow_executions',
      new TableForeignKey({
        columnNames: ['query_id'],
        referencedTableName: 'queries',
        referencedColumnNames: ['query_id'],
        onDelete: 'CASCADE',
        name: 'fk_workflow_executions_query_id',
      }),
    );

    // Create workflow_steps table
    await queryRunner.createTable(
      new Table({
        name: 'workflow_steps',
        columns: [
          {
            name: 'step_id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'workflow_id',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'step_number',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'step_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'pending'",
          },
          {
            name: 'start_time',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'end_time',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'duration_ms',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'result',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create unique constraint on workflow_id + step_number
    await queryRunner.createIndex(
      'workflow_steps',
      new TableIndex({
        name: 'idx_workflow_steps_workflow_id_step_number',
        columnNames: ['workflow_id', 'step_number'],
        isUnique: true,
      }),
    );

    // Create index on workflow_id
    await queryRunner.createIndex(
      'workflow_steps',
      new TableIndex({
        name: 'idx_workflow_steps_workflow_id',
        columnNames: ['workflow_id'],
      }),
    );

    // Create index on status
    await queryRunner.createIndex(
      'workflow_steps',
      new TableIndex({
        name: 'idx_workflow_steps_status',
        columnNames: ['status'],
      }),
    );

    // Create foreign key to workflow_executions
    await queryRunner.createForeignKey(
      'workflow_steps',
      new TableForeignKey({
        columnNames: ['workflow_id'],
        referencedTableName: 'workflow_executions',
        referencedColumnNames: ['workflow_id'],
        onDelete: 'CASCADE',
        name: 'fk_workflow_steps_workflow_id',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('workflow_steps', 'fk_workflow_steps_workflow_id');
    await queryRunner.dropForeignKey('workflow_executions', 'fk_workflow_executions_query_id');

    // Drop indexes for workflow_steps
    await queryRunner.dropIndex('workflow_steps', 'idx_workflow_steps_status');
    await queryRunner.dropIndex('workflow_steps', 'idx_workflow_steps_workflow_id');
    await queryRunner.dropIndex('workflow_steps', 'idx_workflow_steps_workflow_id_step_number');

    // Drop workflow_steps table
    await queryRunner.dropTable('workflow_steps');

    // Drop indexes for workflow_executions
    await queryRunner.dropIndex('workflow_executions', 'idx_workflow_executions_created_at');
    await queryRunner.dropIndex('workflow_executions', 'idx_workflow_executions_status');
    await queryRunner.dropIndex('workflow_executions', 'idx_workflow_executions_query_id');

    // Drop workflow_executions table
    await queryRunner.dropTable('workflow_executions');
  }
}
