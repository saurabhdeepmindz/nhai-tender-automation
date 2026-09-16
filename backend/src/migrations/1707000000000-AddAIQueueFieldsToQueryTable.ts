import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAIQueueFieldsToQueryTable1707000000000 implements MigrationInterface {
    name = 'AddAIQueueFieldsToQueryTable1707000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Query" ADD COLUMN IF NOT EXISTS "ai_status" VARCHAR(32) DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "Query" ADD COLUMN IF NOT EXISTS "queue_position" INTEGER`);
        await queryRunner.query(`ALTER TABLE "Query" ADD COLUMN IF NOT EXISTS "estimated_completion_time" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Query" DROP COLUMN IF EXISTS "ai_status"`);
        await queryRunner.query(`ALTER TABLE "Query" DROP COLUMN IF EXISTS "queue_position"`);
        await queryRunner.query(`ALTER TABLE "Query" DROP COLUMN IF EXISTS "estimated_completion_time"`);
    }
}
