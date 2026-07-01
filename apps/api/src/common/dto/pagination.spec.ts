import { PaginationDto, paginar } from './pagination.dto';

describe('Paginação', () => {
  it('calcula skip a partir de page/limit', () => {
    const dto = new PaginationDto();
    dto.page = 3;
    dto.limit = 20;
    expect(dto.skip).toBe(40);
  });

  it('monta meta corretamente', () => {
    const r = paginar([1, 2], 42, 1, 20);
    expect(r.meta).toEqual({ page: 1, limit: 20, total: 42, totalPaginas: 3 });
    expect(r.dados).toHaveLength(2);
  });

  it('garante ao menos 1 página quando vazio', () => {
    const r = paginar([], 0, 1, 20);
    expect(r.meta.totalPaginas).toBe(1);
  });
});
