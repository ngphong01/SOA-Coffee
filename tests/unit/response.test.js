/**
 * Unit tests: API Response utility
 */
const ApiResponse = require('../../shared/utils/response');

describe('ApiResponse', () => {
  let res;

  beforeEach(() => {
    res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      },
    };
  });

  test('success() should return 200 with correct structure', () => {
    ApiResponse.success(res, { id: 1 }, 'OK');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.statusCode).toBe(200);
    expect(res.body.message).toBe('OK');
    expect(res.body.data).toEqual({ id: 1 });
    expect(res.body.timestamp).toBeDefined();
  });

  test('created() should return 201', () => {
    ApiResponse.created(res, { id: 2 });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('paginated() should include pagination meta', () => {
    ApiResponse.paginated(res, [{ id: 1 }], { page: 1, limit: 10, total: 100 });

    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.pagination).toEqual({ page: 1, limit: 10, total: 100 });
  });

  test('error() should return correct error structure', () => {
    ApiResponse.error(res, 'Not found', 404);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Not found');
  });
});
