import { buildQueryParams } from './queryParams';

describe('buildQueryParams', () => {
  it('always includes page and pageSize', () => {
    const params = buildQueryParams({ page: 3, pageSize: 20 });
    expect(params.get('page')).toBe('3');
    expect(params.get('pageSize')).toBe('20');
  });

  it('omits status/category/rfpId/search when not provided', () => {
    const params = buildQueryParams({ page: 1, pageSize: 20 });
    expect(params.has('status')).toBe(false);
    expect(params.has('category')).toBe(false);
    expect(params.has('rfpId')).toBe(false);
    expect(params.has('search')).toBe(false);
  });

  it('includes every filter when all are provided', () => {
    const params = buildQueryParams({
      status: 'answered',
      category: '10',
      rfpId: 'rfp-1',
      search: 'commercial terms',
      page: 2,
      pageSize: 50,
    });
    expect(params.get('status')).toBe('answered');
    expect(params.get('category')).toBe('10');
    expect(params.get('rfpId')).toBe('rfp-1');
    expect(params.get('search')).toBe('commercial terms');
    expect(params.get('page')).toBe('2');
    expect(params.get('pageSize')).toBe('50');
  });

  it('treats an empty-string filter the same as "not provided"', () => {
    const params = buildQueryParams({ status: '', category: '', page: 1, pageSize: 20 });
    expect(params.has('status')).toBe(false);
    expect(params.has('category')).toBe(false);
  });
});
