import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InternalServerErrorException } from '@nestjs/common';
import { PrebidQueryService } from './prebid-query.service';
import { Query } from '../queries/entities/query.entity';

describe('PrebidQueryService', () => {
  let service: PrebidQueryService;
  let queryBuilderMock: any;
  let repositoryMock: any;

  beforeEach(async () => {
    queryBuilderMock = {
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    repositoryMock = {
      createQueryBuilder: jest.fn(() => queryBuilderMock),
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      manager: { query: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrebidQueryService,
        { provide: getRepositoryToken(Query), useValue: repositoryMock },
      ],
    }).compile();

    service = module.get<PrebidQueryService>(PrebidQueryService);
  });

  describe('getQueries', () => {
    it('enriches each query with srNo, rfpNumber and categoryName', async () => {
      const rows = [
        { queryId: 'q1', rfpId: 'rfp-1', categoryId: 10 },
        { queryId: 'q2', rfpId: 'rfp-1', categoryId: 11 },
      ];
      queryBuilderMock.getManyAndCount.mockResolvedValue([rows, 2]);
      repositoryMock.manager.query
        .mockResolvedValueOnce([{ rfp_id: 'rfp-1', rfp_number: 'RFP-001' }]) // rfp lookup
        .mockResolvedValueOnce([
          { category_id: 10, category_name: 'Technical' },
          { category_id: 11, category_name: 'Commercial' },
        ]); // category lookup

      const result = await service.getQueries({ page: 1, pageSize: 20 });

      expect(result.data.queries).toEqual([
        { ...rows[0], srNo: 1, rfpNumber: 'RFP-001', categoryName: 'Technical' },
        { ...rows[1], srNo: 2, rfpNumber: 'RFP-001', categoryName: 'Commercial' },
      ]);
      expect(result.data.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('applies the search filter as an ILIKE clause on query_text', async () => {
      queryBuilderMock.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getQueries({ page: 1, pageSize: 20, search: 'commercial terms' });

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'query.query_text ILIKE :search',
        { search: '%commercial terms%' },
      );
    });

    it('does not query rfps/categories when there are no results', async () => {
      queryBuilderMock.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getQueries({ page: 1, pageSize: 20 });

      expect(repositoryMock.manager.query).not.toHaveBeenCalled();
    });
  });

  describe('getFilters', () => {
    it('returns the fixed status list plus DB-driven categories and rfps', async () => {
      repositoryMock.manager.query
        .mockResolvedValueOnce([{ id: 10, name: 'Technical' }])
        .mockResolvedValueOnce([{ id: 'rfp-1', number: 'RFP-001' }]);

      const result = await service.getFilters();

      expect(result.data.statuses).toEqual([
        'pending',
        'under_review',
        'answered',
        'clarification_needed',
      ]);
      expect(result.data.categories).toEqual([{ id: 10, name: 'Technical' }]);
      expect(result.data.rfps).toEqual([{ id: 'rfp-1', number: 'RFP-001' }]);
    });
  });

  describe('bulkUpdateStatus', () => {
    it('updates status for every matched query and sets answeredAt when moving to answered', async () => {
      const queries = [
        { queryId: 'q1', status: 'pending', answeredAt: null },
        { queryId: 'q2', status: 'under_review', answeredAt: null },
      ];
      repositoryMock.find.mockResolvedValue(queries);
      repositoryMock.save.mockResolvedValue(queries);

      const result = await service.bulkUpdateStatus(['q1', 'q2'], 'answered');

      expect(queries[0].status).toBe('answered');
      expect(queries[0].answeredAt).not.toBeNull();
      expect(queries[1].status).toBe('answered');
      expect(result.data).toEqual({ requested: 2, updated: 2, status: 'answered' });
    });

    it('reports fewer updated than requested when some IDs do not match', async () => {
      repositoryMock.find.mockResolvedValue([{ queryId: 'q1', status: 'pending' }]);
      repositoryMock.save.mockResolvedValue([{ queryId: 'q1', status: 'rejected-not-a-real-status' }]);

      const result = await service.bulkUpdateStatus(['q1', 'does-not-exist'], 'under_review');

      expect(result.data.requested).toBe(2);
      expect(result.data.updated).toBe(1);
    });

    it('rejects an invalid status without touching the database', async () => {
      await expect(
        service.bulkUpdateStatus(['q1'], 'not-a-real-status'),
      ).rejects.toThrow(InternalServerErrorException);
      expect(repositoryMock.find).not.toHaveBeenCalled();
    });
  });
});
