export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'ScoutRover API',
    version: '2.0.0',
    description: 'REST API documentation for ScoutRover - Autonomous Mapping System',
    contact: {
      name: 'ScoutRover Development Team',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Local V1 server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token. Example: "Bearer [token]"',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'OPERATOR', 'VIEWER'] },
          avatar: { type: 'string' },
          lastLogin: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Map: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          width: { type: 'number' },
          height: { type: 'number' },
          resolution: { type: 'number' },
          originX: { type: 'number' },
          originY: { type: 'number' },
          gridData: { type: 'string', description: 'Stringified array of grid cells' },
          createdBy: { type: 'string', description: 'User ID of the creator' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Marker: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          mapId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          lat: { type: 'number' },
          lng: { type: 'number' },
          color: { type: 'string' },
        },
      },
      Route: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          mapId: { type: 'string' },
          name: { type: 'string' },
          points: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                lat: { type: 'number' },
                lng: { type: 'number' },
              },
            },
          },
          distance: { type: 'number' },
          color: { type: 'string' },
        },
      },
      AuditLog: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          action: { type: 'string' },
          description: { type: 'string' },
          ipAddress: { type: 'string' },
          userAgent: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user account',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  role: { type: 'string', enum: ['ADMIN', 'OPERATOR', 'VIEWER'], default: 'VIEWER' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Registration successful' },
          400: { description: 'Validation failed / user already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticates user and returns JWT access & refresh tokens',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authentication successful' },
          400: { description: 'Invalid login credentials' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Logs user session out and registers audit trail entry',
        responses: {
          200: { description: 'Logout successful' },
          401: { description: 'Unauthorized session' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Re-issues access token using valid refresh token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Tokens issued' },
          401: { description: 'Invalid/expired refresh token' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Dispatches password reset instructions via email service',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Instructions dispatched' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Resets user password with valid cryptographic token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password reset completed' },
          400: { description: 'Invalid token / password format error' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Gets profile information for the authenticated user',
        responses: {
          200: { description: 'Profile returned successfully' },
          401: { description: 'Unauthorized session' },
        },
      },
    },
    '/users/profile': {
      get: {
        tags: ['User Settings'],
        summary: 'Gets details of current logged user profile',
        responses: {
          200: { description: 'Profile loaded' },
        },
      },
      put: {
        tags: ['User Settings'],
        summary: 'Updates profile fields of the user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  bio: { type: 'string' },
                  location: { type: 'string' },
                  phone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile updated' },
        },
      },
    },
    '/users/change-password': {
      put: {
        tags: ['User Settings'],
        summary: 'Changes current user account password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password updated' },
          400: { description: 'Invalid current password' },
        },
      },
    },
    '/users/avatar': {
      post: {
        tags: ['User Settings'],
        summary: 'Uploads and attaches new user avatar image (jpeg/png up to 5MB)',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  avatar: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Avatar uploaded' },
          400: { description: 'Upload limits exceeded' },
        },
      },
    },
    '/users': {
      get: {
        tags: ['User Management (Admin Only)'],
        summary: 'List users with pagination, sorting and filter queries',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'sort', in: 'query', schema: { type: 'string', example: '-createdAt' } },
          { name: 'search', in: 'query', schema: { type: 'string', example: 'Admin' } },
        ],
        responses: {
          200: { description: 'User list loaded' },
          403: { description: 'Forbidden (Not Admin)' },
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['User Management (Admin Only)'],
        summary: 'Retrieve user details by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'User details returned' },
        },
      },
      put: {
        tags: ['User Management (Admin Only)'],
        summary: 'Admin update user profile fields and role settings',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['ADMIN', 'OPERATOR', 'VIEWER'] },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'User updated successfully' },
        },
      },
      delete: {
        tags: ['User Management (Admin Only)'],
        summary: 'Admin delete user account',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'User deleted' },
        },
      },
    },
    '/maps': {
      get: {
        tags: ['Maps System'],
        summary: 'List saved maps with pagination and sorting queries',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'sort', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Maps list returned' },
        },
      },
      post: {
        tags: ['Maps System'],
        summary: 'Saves a new LiDAR map scan (requires ADMIN/OPERATOR)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'width', 'height', 'resolution', 'originX', 'originY', 'gridData'],
                properties: {
                  name: { type: 'string' },
                  width: { type: 'number' },
                  height: { type: 'number' },
                  resolution: { type: 'number' },
                  originX: { type: 'number' },
                  originY: { type: 'number' },
                  gridData: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Map saved successfully' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/maps/{id}': {
      get: {
        tags: ['Maps System'],
        summary: 'Retrieve map by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Map details returned' },
        },
      },
      put: {
        tags: ['Maps System'],
        summary: 'Update map details (requires ADMIN/OPERATOR)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Map updated' },
        },
      },
      delete: {
        tags: ['Maps System'],
        summary: 'Delete map (requires ADMIN/OPERATOR)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Map deleted' },
        },
      },
    },
    '/markers': {
      get: {
        tags: ['Waypoint Markers'],
        summary: 'List markers with pagination and mapId filters',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'mapId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Markers list returned' },
        },
      },
      post: {
        tags: ['Waypoint Markers'],
        summary: 'Creates a map marker waypoint (requires ADMIN/OPERATOR)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mapId', 'title', 'lat', 'lng'],
                properties: {
                  mapId: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  lat: { type: 'number' },
                  lng: { type: 'number' },
                  color: { type: 'string', example: '#7c3aed' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Marker created successfully' },
        },
      },
    },
    '/markers/map/{mapId}': {
      get: {
        tags: ['Waypoint Markers'],
        summary: 'Gets all markers pinned to a specific map',
        parameters: [{ name: 'mapId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'List of markers returned' },
        },
      },
    },
    '/markers/{id}': {
      get: {
        tags: ['Waypoint Markers'],
        summary: 'Get details for a single marker by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Marker retrieved successfully' },
        },
      },
      put: {
        tags: ['Waypoint Markers'],
        summary: 'Updates a marker waypoint (requires ADMIN/OPERATOR)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  lat: { type: 'number' },
                  lng: { type: 'number' },
                  color: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Marker updated' },
        },
      },
      delete: {
        tags: ['Waypoint Markers'],
        summary: 'Deletes a marker waypoint (requires ADMIN/OPERATOR)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Marker deleted' },
        },
      },
    },
    '/routes': {
      get: {
        tags: ['Planned Routes'],
        summary: 'List planned routes with mapId filters',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'mapId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Routes list returned' },
        },
      },
      post: {
        tags: ['Planned Routes'],
        summary: 'Creates a route path configuration (requires ADMIN/OPERATOR)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mapId', 'name', 'points', 'distance'],
                properties: {
                  mapId: { type: 'string' },
                  name: { type: 'string' },
                  points: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        lat: { type: 'number' },
                        lng: { type: 'number' },
                      },
                    },
                  },
                  distance: { type: 'number' },
                  color: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Route created successfully' },
        },
      },
    },
    '/routes/map/{mapId}': {
      get: {
        tags: ['Planned Routes'],
        summary: 'Gets all routes designed for a specific map',
        parameters: [{ name: 'mapId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'List of routes returned' },
        },
      },
    },
    '/routes/{id}': {
      get: {
        tags: ['Planned Routes'],
        summary: 'Get details for a single route path by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Route retrieved successfully' },
        },
      },
      put: {
        tags: ['Planned Routes'],
        summary: 'Updates a route path configuration (requires ADMIN/OPERATOR)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  points: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        lat: { type: 'number' },
                        lng: { type: 'number' },
                      },
                    },
                  },
                  distance: { type: 'number' },
                  color: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Route updated' },
        },
      },
      delete: {
        tags: ['Planned Routes'],
        summary: 'Deletes a route path configuration (requires ADMIN/OPERATOR)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Route deleted' },
        },
      },
    },
    '/audit-logs': {
      get: {
        tags: ['Security Audit System (Admin Only)'],
        summary: 'List and query audit action records with pagination and filters',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'sort', in: 'query', schema: { type: 'string', example: '-timestamp' } },
          { name: 'action', in: 'query', schema: { type: 'string' } },
          { name: 'userId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Audit list returned' },
          403: { description: 'Forbidden (Not Admin)' },
        },
      },
    },
  },
};
