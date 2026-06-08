const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Coffee Shop Management API',
    version: '1.0.0',
    description: 'Enterprise Coffee Shop Management System — API Documentation',
    contact: { name: 'Coffee Shop Dev Team', email: 'dev@coffeeshop.com' },
  },
  servers: [
    { url: 'http://localhost:3000/api', description: 'Development' },
    { url: 'https://api.coffeeshop.com/api', description: 'Production' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          statusCode: { type: 'integer' },
          message: { type: 'string' },
          data: { type: 'object' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      PaginatedResponse: {
        allOf: [{
          $ref: '#/components/schemas/ApiResponse',
        }, {
          properties: {
            meta: {
              type: 'object',
              properties: {
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' },
                  },
                },
              },
            },
          },
        }],
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@coffeeshop.com' },
                  password: { type: 'string', example: 'Admin@123456' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register new user',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['full_name', 'email', 'password'],
                properties: {
                  full_name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  phone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Registration successful' } },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh access token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Token refreshed' } },
      },
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'Get all products',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Products list' } },
      },
      post: {
        tags: ['Products'],
        summary: 'Create product',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'category_id', 'price', 'sku'],
                properties: {
                  name: { type: 'string' },
                  category_id: { type: 'integer' },
                  price: { type: 'number' },
                  sku: { type: 'string' },
                  initial_stock: { type: 'number', default: 0 },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Product created' } },
      },
    },
    '/orders': {
      get: { tags: ['Orders'], summary: 'List orders', responses: { 200: { description: 'OK' } } },
      post: {
        tags: ['Orders'],
        summary: 'Create order',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['items'],
                properties: {
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        product_id: { type: 'integer' },
                        quantity: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Order created' } },
      },
    },
    '/analytics/dashboard': {
      get: {
        tags: ['Analytics'],
        summary: 'Dashboard summary',
        responses: { 200: { description: 'Dashboard data' } },
      },
    },
    '/analytics/revenue': {
      get: {
        tags: ['Analytics'],
        summary: 'Revenue analytics',
        parameters: [
          {
            name: 'period',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['today', '7days', '30days', '90days', '1year'],
              default: '7days',
            },
          },
        ],
        responses: { 200: { description: 'Revenue data' } },
      },
    },
  },
};

module.exports = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { background: #6F4E37; }',
    customSiteTitle: 'Coffee Shop API Docs',
    swaggerOptions: { persistAuthorization: true },
  }));
};
