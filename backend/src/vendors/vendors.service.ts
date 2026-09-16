import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Rfp } from './entities/rfp.entity';
import { Query } from '../queries/entities/query.entity';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Rfp)
    private readonly rfpRepository: Repository<Rfp>,
    @InjectRepository(Query)
    private readonly queryRepository: Repository<Query>,
  ) {}

  private mapRfpStatus(rfp: Rfp): 'open' | 'closed' {
    const deadlineHasPassed = new Date(rfp.bidSubmissionDeadline) < new Date();
    return rfp.status.toLowerCase() === 'published' && !deadlineHasPassed ? 'open' : 'closed';
  }

  async getRfps() {
    const rfps = await this.rfpRepository.find({
      order: { publishDate: 'DESC' },
    });

    const queryCounts = await this.queryRepository
      .createQueryBuilder('query')
      .select('query.rfpId', 'rfpId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('query.rfpId')
      .getRawMany<{ rfpId: string; count: string }>();

    const countByRfpId = new Map(queryCounts.map((row) => [row.rfpId, Number(row.count)]));

    return rfps.map((rfp) => ({
      id: rfp.rfpId,
      rfpNumber: rfp.rfpNumber,
      title: rfp.rfpTitle,
      publishedDate: rfp.publishDate,
      deadline: rfp.bidSubmissionDeadline,
      status: this.mapRfpStatus(rfp),
      queriesCount: countByRfpId.get(rfp.rfpId) ?? 0,
    }));
  }

  async getQueries() {
    const queries = await this.queryRepository.find({
      order: { submittedAt: 'DESC' },
      take: 100,
    });

    const rfpIds = [...new Set(queries.map((query) => query.rfpId).filter(Boolean))] as string[];
    const rfps = rfpIds.length
      ? await this.rfpRepository.find({ where: { rfpId: In(rfpIds) } })
      : [];
    const rfpNumberById = new Map(rfps.map((rfp) => [rfp.rfpId, rfp.rfpNumber]));

    return queries.map((query) => ({
      id: query.queryId,
      queryNumber: query.queryNumber,
      rfpNumber: query.rfpId ? rfpNumberById.get(query.rfpId) ?? '' : '',
      queryText: query.queryText,
      status: query.status,
      submittedAt: query.submittedAt,
      answeredAt: query.answeredAt,
      response: query.adminResponse ?? query.aiResponse ?? null,
    }));
  }

  async getDashboard() {
    const [totalRFPs, openRfps, queriesSubmitted, queriesAnswered, pendingQueries] =
      await Promise.all([
        this.rfpRepository.count(),
        this.rfpRepository
          .createQueryBuilder('rfp')
          .where('LOWER(rfp.status) = :status', { status: 'published' })
          .andWhere('rfp.bidSubmissionDeadline >= :today', { today: new Date() })
          .getCount(),
        this.queryRepository.count(),
        this.queryRepository.count({ where: { status: 'answered' } }),
        this.queryRepository.count({ where: { status: 'pending' } }),
      ]);

    const answeredQueries = await this.queryRepository
      .createQueryBuilder('query')
      .where('query.status = :status', { status: 'answered' })
      .andWhere('query.answeredAt IS NOT NULL')
      .getMany();

    const avgResponseTime = this.formatAverageResponseTime(answeredQueries);

    return {
      totalRFPs,
      activeRFPs: openRfps,
      queriesSubmitted,
      queriesAnswered,
      avgResponseTime,
      pendingQueries,
    };
  }

  private formatAverageResponseTime(answeredQueries: Query[]): string {
    if (answeredQueries.length === 0) {
      return 'N/A';
    }

    const totalMs = answeredQueries.reduce((sum, query) => {
      const submitted = new Date(query.submittedAt).getTime();
      const answered = new Date(query.answeredAt as Date).getTime();
      return sum + Math.max(answered - submitted, 0);
    }, 0);

    const avgHours = totalMs / answeredQueries.length / (1000 * 60 * 60);
    if (avgHours < 24) {
      return `${avgHours.toFixed(1)} hrs`;
    }
    return `${(avgHours / 24).toFixed(1)} days`;
  }
}
