// Generated OpenAPI specification for stackone
// DO NOT EDIT THIS FILE DIRECTLY
export const stackoneSpec = {
  openapi: '3.1.0',
  paths: {
    '/connect_sessions': {
      post: {
        operationId: 'stackone_create_connect_session',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ConnectSessionCreate',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'The details of the connect session created with token and auth link',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ConnectSessionTokenAuthLink',
                },
              },
            },
          },
          '400': {
            description: 'Invalid request.',
          },
          '403': {
            description: 'Forbidden.',
          },
          '408': {
            description: 'The request has timed out.',
            headers: {
              'Retry-After': {
                description: 'A time in seconds after which the request can be retried.',
                schema: {
                  type: 'string',
                },
              },
            },
          },
          '429': {
            description: 'Too many requests.',
          },
          '500': {
            description: 'Server error while executing the request.',
          },
          '501': {
            description: 'This functionality is not implemented.',
          },
        },
        security: [
          {
            basic: [],
          },
        ],
        summary: 'Create Connect Session',
        tags: ['Connect Sessions'],
        'x-speakeasy-name-override': 'create_connect_session',
        'x-speakeasy-retries': {
          statusCodes: [429, 408],
          strategy: 'backoff',
        },
      },
    },
    '/connect_sessions/authenticate': {
      post: {
        operationId: 'stackone_authenticate_connect_session',
        parameters: [],
        requestBody: {
          required: true,
          description: 'The parameters to authenticate',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ConnectSessionAuthenticate',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'The details of the authenticated connect session.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ConnectSession',
                },
              },
            },
          },
          '400': {
            description: 'Invalid request.',
          },
          '403': {
            description: 'Forbidden.',
          },
          '408': {
            description: 'The request has timed out.',
            headers: {
              'Retry-After': {
                description: 'A time in seconds after which the request can be retried.',
                schema: {
                  type: 'string',
                },
              },
            },
          },
          '429': {
            description: 'Too many requests.',
          },
          '500': {
            description: 'Server error while executing the request.',
          },
          '501': {
            description: 'This functionality is not implemented.',
          },
        },
        security: [
          {
            basic: [],
          },
        ],
        summary: 'Authenticate Connect Session',
        tags: ['Connect Sessions'],
        'x-speakeasy-name-override': 'authenticate_connect_session',
        'x-speakeasy-retries': {
          statusCodes: [429, 408],
          strategy: 'backoff',
        },
      },
    },
    '/accounts': {
      get: {
        operationId: 'stackone_list_linked_accounts',
        parameters: [
          {
            name: 'page',
            required: false,
            in: 'query',
            description: 'The page number of the results to fetch',
            schema: {
              nullable: true,
              type: 'number',
            },
          },
          {
            name: 'page_size',
            required: false,
            in: 'query',
            description: 'The number of results per page',
            schema: {
              nullable: true,
              default: 25,
              type: 'number',
            },
          },
          {
            name: 'provider',
            required: false,
            in: 'query',
            description: 'The provider of the results to fetch',
            deprecated: true,
            schema: {
              nullable: true,
              type: 'string',
            },
          },
          {
            name: 'origin_owner_id',
            required: false,
            in: 'query',
            description: 'The origin owner identifier of the results to fetch',
            schema: {
              nullable: true,
              type: 'string',
            },
          },
          {
            name: 'providers',
            required: false,
            in: 'query',
            description: 'The providers list of the results to fetch',
            schema: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
          {
            name: 'account_ids',
            required: false,
            in: 'query',
            description: 'The providers list of the results to fetch',
            schema: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
          {
            name: 'status',
            required: false,
            in: 'query',
            description: 'The status of the results to fetch',
            schema: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        ],
        responses: {
          '200': {
            description: 'The list of accounts was retrieved.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/LinkedAccount',
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request.',
          },
          '403': {
            description: 'Forbidden.',
          },
          '408': {
            description: 'The request has timed out.',
            headers: {
              'Retry-After': {
                description: 'A time in seconds after which the request can be retried.',
                schema: {
                  type: 'string',
                },
              },
            },
          },
          '429': {
            description: 'Too many requests.',
          },
          '500': {
            description: 'Server error while executing the request.',
          },
          '501': {
            description: 'This functionality is not implemented.',
          },
        },
        security: [
          {
            basic: [],
          },
        ],
        summary: 'List Accounts',
        tags: ['Accounts'],
        'x-speakeasy-name-override': 'list_linked_accounts',
        'x-speakeasy-retries': {
          statusCodes: [429, 408],
          strategy: 'backoff',
        },
      },
    },
    '/accounts/{id}': {
      get: {
        operationId: 'stackone_get_account',
        parameters: [
          {
            name: 'id',
            required: true,
            in: 'path',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'The account with the given identifier was retrieved.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LinkedAccount',
                },
              },
            },
          },
          '400': {
            description: 'Invalid request.',
          },
          '403': {
            description: 'Forbidden.',
          },
          '408': {
            description: 'The request has timed out.',
            headers: {
              'Retry-After': {
                description: 'A time in seconds after which the request can be retried.',
                schema: {
                  type: 'string',
                },
              },
            },
          },
          '429': {
            description: 'Too many requests.',
          },
          '500': {
            description: 'Server error while executing the request.',
          },
          '501': {
            description: 'This functionality is not implemented.',
          },
        },
        security: [
          {
            basic: [],
          },
        ],
        summary: 'Get Account',
        tags: ['Accounts'],
        'x-speakeasy-name-override': 'get_account',
        'x-speakeasy-retries': {
          statusCodes: [429, 408],
          strategy: 'backoff',
        },
      },
      patch: {
        operationId: 'stackone_update_account',
        parameters: [
          {
            name: 'id',
            required: true,
            in: 'path',
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PatchAccountExternalDto',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'The account with the given identifier was updated.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LinkedAccount',
                },
              },
            },
          },
          '400': {
            description: 'Invalid request.',
          },
          '403': {
            description: 'Forbidden.',
          },
          '408': {
            description: 'The request has timed out.',
            headers: {
              'Retry-After': {
                description: 'A time in seconds after which the request can be retried.',
                schema: {
                  type: 'string',
                },
              },
            },
          },
          '429': {
            description: 'Too many requests.',
          },
          '500': {
            description: 'Server error while executing the request.',
          },
          '501': {
            description: 'This functionality is not implemented.',
          },
        },
        security: [
          {
            basic: [],
          },
        ],
        summary: 'Update Account',
        tags: ['Accounts'],
        'x-speakeasy-name-override': 'update_account',
        'x-speakeasy-retries': {
          statusCodes: [429, 408],
          strategy: 'backoff',
        },
      },
      delete: {
        operationId: 'stackone_delete_account',
        parameters: [
          {
            name: 'id',
            required: true,
            in: 'path',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'The account with the given identifier was deleted.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LinkedAccount',
                },
              },
            },
          },
          '400': {
            description: 'Invalid request.',
          },
          '403': {
            description: 'Forbidden.',
          },
          '404': {
            description: 'The account with the given identifier does not exist',
          },
          '408': {
            description: 'The request has timed out.',
            headers: {
              'Retry-After': {
                description: 'A time in seconds after which the request can be retried.',
                schema: {
                  type: 'string',
                },
              },
            },
          },
          '429': {
            description: 'Too many requests.',
          },
          '500': {
            description: 'Server error while executing the request.',
          },
          '501': {
            description: 'This functionality is not implemented.',
          },
        },
        security: [
          {
            basic: [],
          },
        ],
        summary: 'Delete Account',
        tags: ['Accounts'],
        'x-speakeasy-name-override': 'delete_account',
        'x-speakeasy-retries': {
          statusCodes: [429, 408],
          strategy: 'backoff',
        },
      },
    },
    '/accounts/{id}/meta': {
      get: {
        operationId: 'stackone_get_account_meta_info',
        parameters: [
          {
            name: 'id',
            required: true,
            in: 'path',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'The meta information of the account was retrieved',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LinkedAccountMeta',
                },
              },
            },
          },
          '400': {
            description: 'Invalid request.',
          },
          '403': {
            description: 'Forbidden.',
          },
          '404': {
            description: 'The account with the given identifier does not exist',
          },
          '408': {
            description: 'The request has timed out.',
            headers: {
              'Retry-After': {
                description: 'A time in seconds after which the request can be retried.',
                schema: {
                  type: 'string',
                },
              },
            },
          },
          '429': {
            description: 'Too many requests.',
          },
          '500': {
            description: 'Server error while executing the request.',
          },
          '501': {
            description: 'This functionality is not implemented.',
          },
        },
        security: [
          {
            basic: [],
          },
        ],
        summary: 'Get meta information of the account',
        tags: ['Accounts'],
        'x-speakeasy-name-override': 'get_account_meta_info',
        'x-speakeasy-retries': {
          statusCodes: [429, 408],
          strategy: 'backoff',
        },
      },
    },
    '/connectors/meta': {
      get: {
        operationId: 'stackone_list_connectors_meta',
        parameters: [
          {
            name: 'include',
            required: false,
            in: 'query',
            description: 'The comma separated list of data that will be included in the response',
            schema: {
              nullable: true,
              example: 'field_path,unmapped_fields,resources,inactive,webhooks,static_fields',
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'The list of connectors meta information was retrieved.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/ConnectorsMeta',
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request.',
          },
          '403': {
            description: 'Forbidden.',
          },
          '408': {
            description: 'The request has timed out.',
            headers: {
              'Retry-After': {
                description: 'A time in seconds after which the request can be retried.',
                schema: {
                  type: 'string',
                },
              },
            },
          },
          '429': {
            description: 'Too many requests.',
          },
          '500': {
            description: 'Server error while executing the request.',
          },
          '501': {
            description: 'This functionality is not implemented.',
          },
        },
        security: [
          {
            basic: [],
          },
        ],
        summary: 'List Connectors Meta Information for all providers',
        tags: ['Connectors'],
        'x-speakeasy-name-override': 'list_connectors_meta',
        'x-speakeasy-retries': {
          statusCodes: [429, 408],
          strategy: 'backoff',
        },
      },
    },
    '/connectors/meta/{provider}': {
      get: {
        operationId: 'stackone_get_connector_meta',
        parameters: [
          {
            name: 'provider',
            required: true,
            in: 'path',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'include',
            required: false,
            in: 'query',
            description: 'The comma separated list of data that will be included in the response',
            schema: {
              nullable: true,
              example: 'field_path,unmapped_fields,resources,inactive,webhooks,static_fields',
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'The connector meta information was retrieved',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ConnectorsMeta',
                },
              },
            },
          },
          '400': {
            description: 'Invalid request.',
          },
          '403': {
            description: 'Forbidden.',
          },
          '404': {
            description: 'No connector with the given provider key exist',
          },
          '408': {
            description: 'The request has timed out.',
            headers: {
              'Retry-After': {
                description: 'A time in seconds after which the request can be retried.',
                schema: {
                  type: 'string',
                },
              },
            },
          },
          '429': {
            description: 'Too many requests.',
          },
          '500': {
            description: 'Server error while executing the request.',
          },
          '501': {
            description: 'This functionality is not implemented.',
          },
        },
        security: [
          {
            basic: [],
          },
        ],
        summary: 'Get Connector Meta information for the given provider key',
        tags: ['Connectors'],
        'x-speakeasy-name-override': 'get_connector_meta',
        'x-speakeasy-retries': {
          statusCodes: [429, 408],
          strategy: 'backoff',
        },
      },
    },
    '/unified/proxy': {
      post: {
        operationId: 'stackone_proxy_request',
        parameters: [
          {
            name: 'x-account-id',
            in: 'header',
            description: 'The account identifier',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          required: true,
          description: 'The request body',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ProxyRequestBody',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'The proxy request was successful.',
          },
          '400': {
            description: 'Invalid request.',
          },
          '403': {
            description: 'Forbidden.',
          },
          '408': {
            description: 'The request has timed out.',
            headers: {
              'Retry-After': {
                description: 'A time in seconds after which the request can be retried.',
                schema: {
                  type: 'string',
                },
              },
            },
          },
          '412': {
            description: 'Precondition failed: linked account belongs to a disabled integration.',
          },
          '429': {
            description: 'Too many requests.',
          },
          '500': {
            description: 'Server error while executing the request.',
          },
          '501': {
            description: 'This functionality is not implemented.',
          },
        },
        security: [
          {
            basic: [],
          },
        ],
        summary: 'Proxy Request',
        tags: ['Proxy'],
        'x-speakeasy-name-override': 'proxy_request',
        'x-speakeasy-retries': {
          statusCodes: [429, 408],
          strategy: 'backoff',
        },
      },
    },
  },
  info: {
    title: 'StackOne',
    description: 'The documentation for the StackOne API',
    version: '1.0.0',
    contact: {},
  },
  tags: [
    {
      name: 'AI',
      description: '',
    },
    {
      name: 'Accounts',
      description: '',
    },
    {
      name: 'Connect Sessions',
      description: '',
    },
    {
      name: 'Connectors',
      description: '',
    },
    {
      name: 'Proxy',
      description: '',
    },
  ],
  servers: [
    {
      url: 'https://api.stackone.com',
    },
  ],
  components: {
    securitySchemes: {
      basic: {
        type: 'http',
        scheme: 'basic',
      },
    },
    schemas: {
      ConnectorsMeta: {
        type: 'object',
        properties: {
          provider: {
            type: 'string',
            example: 'hibob',
            description: 'The provider key',
          },
          provider_name: {
            type: 'string',
            example: 'Hibob',
            description: 'The provider human-readable label',
          },
          category: {
            type: 'string',
            enum: [
              'ats',
              'hris',
              'hris-legacy',
              'crm',
              'iam',
              'marketing',
              'lms',
              'stackone',
              'documents',
              'ticketing',
              'screening',
            ],
            example: 'hris',
            description: 'The provider service category',
            'x-speakeasy-unknown-values': 'allow',
          },
          active: {
            type: 'boolean',
            example: true,
            description:
              'Whether this provider has been enabled on the integrations page for the current project',
            nullable: true,
          },
          models: {
            type: 'object',
            additionalProperties: true,
            example: {
              employees: {
                create: {
                  apiPath: '/unified/hris/employees/:id',
                  input: {
                    defaultFields: [
                      {
                        name: 'first_name',
                        type: 'string',
                      },
                    ],
                  },
                  output: {
                    defaultFields: [
                      {
                        name: 'id',
                        type: 'string',
                      },
                    ],
                  },
                },
              },
              time_off: {
                get: {
                  apiPath: '/unified/hris/employees/:id/time_off/:id',
                  output: {
                    defaultFields: [
                      {
                        name: 'id',
                        type: 'string',
                      },
                    ],
                  },
                },
              },
            },
          },
          resources: {
            description: 'Resources for this provider, such as image assets',
            example: {
              images: {
                logo_url: 'https://app.stackone.com/assets/logos/hibob.png',
                original_logo_horizontal_url:
                  'https://app.stackone.com/assets/logos/original/hibob_horizontal.png',
              },
            },
            nullable: true,
            allOf: [
              {
                $ref: '#/components/schemas/ConnectorsMetaResources',
              },
            ],
          },
        },
        required: ['provider', 'provider_name', 'category', 'models'],
      },
      ConnectorsMetaResources: {
        type: 'object',
        properties: {
          images: {
            description: 'Image assets for this provider',
            nullable: true,
            allOf: [
              {
                $ref: '#/components/schemas/ConnectorsMetaResourcesImagesApiModel',
              },
            ],
          },
        },
      },
      ConnectorsMetaResourcesImagesApiModel: {
        type: 'object',
        properties: {
          logo_url: {
            type: 'string',
            example: 'https://app.stackone.com/assets/logos/hibob.png',
            description: 'URL of the square logo designed and used by StackOne for this provider',
            nullable: true,
          },
          original_logo_horizontal_url: {
            type: 'string',
            example: 'https://app.stackone.com/assets/logos/source/hibob.png',
            description:
              'URL of the original provider logo (with logo and/or name aligned horizontally)',
            nullable: true,
          },
        },
      },
      ConnectSession: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
          },
          organization_id: {
            type: 'number',
          },
          project_id: {
            type: 'string',
          },
          categories: {
            type: 'array',
            example: [
              'ats',
              'hris',
              'hrisLegacy',
              'crm',
              'iam',
              'marketing',
              'lms',
              'stackOne',
              'documents',
              'ticketing',
              'screening',
            ],
            'x-speakeasy-unknown-values': 'allow',
            nullable: true,
            items: {
              type: 'string',
              enum: [
                'ats',
                'hris',
                'hris-legacy',
                'crm',
                'iam',
                'marketing',
                'lms',
                'stackone',
                'documents',
                'ticketing',
                'screening',
                null,
              ],
            },
          },
          provider: {
            type: 'string',
            nullable: true,
          },
          origin_owner_id: {
            type: 'string',
          },
          origin_owner_name: {
            type: 'string',
          },
          origin_username: {
            type: 'string',
            nullable: true,
          },
          account_id: {
            type: 'string',
            nullable: true,
          },
          label: {
            type: 'string',
            nullable: true,
          },
          created_at: {
            format: 'date-time',
            type: 'string',
          },
          metadata: {
            type: 'object',
            description:
              'Arbitrary set of key and values defined during the session token creation. This can be used to tag an account (eg. based on their pricing plan)',
            nullable: true,
          },
        },
        required: [
          'id',
          'organization_id',
          'project_id',
          'origin_owner_id',
          'origin_owner_name',
          'created_at',
        ],
      },
      ConnectSessionAuthenticate: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            description: 'The token to authenticate with',
          },
        },
        required: ['token'],
      },
      ConnectSessionCreate: {
        type: 'object',
        properties: {
          categories: {
            type: 'array',
            description: 'The categories of the provider to connect to',
            example: [
              'ats',
              'hris',
              'hrisLegacy',
              'crm',
              'iam',
              'marketing',
              'lms',
              'stackOne',
              'documents',
              'ticketing',
              'screening',
            ],
            'x-speakeasy-unknown-values': 'allow',
            nullable: true,
            items: {
              type: 'string',
              enum: [
                'ats',
                'hris',
                'hris-legacy',
                'crm',
                'iam',
                'marketing',
                'lms',
                'stackone',
                'documents',
                'ticketing',
                'screening',
                null,
              ],
            },
          },
          provider: {
            type: 'string',
            description: 'The provider to connect to',
            nullable: true,
          },
          origin_owner_id: {
            type: 'string',
            description: 'The origin owner identifier',
          },
          origin_owner_name: {
            type: 'string',
            description: 'The origin owner name',
          },
          origin_username: {
            type: 'string',
            description: 'The origin username',
            nullable: true,
          },
          account_id: {
            type: 'string',
            description:
              'The unique identifier for the account associated with this connect session. When this field is present, the hub will launch in edit mode using the retrieved token.',
            nullable: true,
          },
          expires_in: {
            type: 'number',
            description: 'How long the session should be valid for in seconds',
            default: 1800,
            nullable: true,
          },
          metadata: {
            type: 'object',
            description: 'The metadata for the connection',
            nullable: true,
          },
          multiple: {
            type: 'boolean',
            description:
              'If set, this connect session will allow creation of multiple accounts with the same origin owner id and provider. Has no effect if account_id is set.',
            default: false,
            nullable: true,
          },
          label: {
            type: 'string',
            description:
              'The label to be applied to the account associated with this connect session.',
            nullable: true,
          },
        },
        required: ['origin_owner_id', 'origin_owner_name'],
      },
      ConnectSessionTokenAuthLink: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
          },
          organization_id: {
            type: 'number',
          },
          project_id: {
            type: 'string',
          },
          categories: {
            type: 'array',
            example: [
              'ats',
              'hris',
              'hrisLegacy',
              'crm',
              'iam',
              'marketing',
              'lms',
              'stackOne',
              'documents',
              'ticketing',
              'screening',
            ],
            'x-speakeasy-unknown-values': 'allow',
            nullable: true,
            items: {
              type: 'string',
              enum: [
                'ats',
                'hris',
                'hris-legacy',
                'crm',
                'iam',
                'marketing',
                'lms',
                'stackone',
                'documents',
                'ticketing',
                'screening',
                null,
              ],
            },
          },
          provider: {
            type: 'string',
            nullable: true,
          },
          origin_owner_id: {
            type: 'string',
          },
          origin_owner_name: {
            type: 'string',
          },
          origin_username: {
            type: 'string',
            nullable: true,
          },
          account_id: {
            type: 'string',
            nullable: true,
          },
          label: {
            type: 'string',
            nullable: true,
          },
          created_at: {
            format: 'date-time',
            type: 'string',
          },
          metadata: {
            type: 'object',
            description:
              'Arbitrary set of key and values defined during the session token creation. This can be used to tag an account (eg. based on their pricing plan)',
            nullable: true,
          },
          token: {
            type: 'string',
          },
          auth_link_url: {
            type: 'string',
          },
        },
        required: [
          'id',
          'organization_id',
          'project_id',
          'origin_owner_id',
          'origin_owner_name',
          'created_at',
          'token',
          'auth_link_url',
        ],
      },
      LinkedAccount: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          provider: {
            type: 'string',
          },
          provider_name: {
            type: 'string',
            nullable: true,
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'error'],
            'x-speakeasy-unknown-values': 'allow',
          },
          status_reasons: {
            nullable: true,
            type: 'array',
            items: {
              $ref: '#/components/schemas/StatusReason',
            },
          },
          origin_owner_id: {
            type: 'string',
          },
          origin_owner_name: {
            type: 'string',
          },
          origin_username: {
            type: 'string',
            nullable: true,
          },
          credentials: {
            type: 'object',
            nullable: true,
          },
          setup_information: {
            type: 'object',
            nullable: true,
          },
          label: {
            type: 'string',
            nullable: true,
          },
          created_at: {
            format: 'date-time',
            type: 'string',
          },
          updated_at: {
            format: 'date-time',
            type: 'string',
          },
        },
        required: [
          'id',
          'provider',
          'status',
          'origin_owner_id',
          'origin_owner_name',
          'created_at',
          'updated_at',
        ],
      },
      LinkedAccountMeta: {
        type: 'object',
        properties: {
          provider: {
            type: 'string',
          },
          category: {
            type: 'string',
            enum: [
              'ats',
              'hris',
              'hris-legacy',
              'crm',
              'iam',
              'marketing',
              'lms',
              'stackone',
              'documents',
              'ticketing',
              'screening',
            ],
            'x-speakeasy-unknown-values': 'allow',
          },
          models: {
            type: 'object',
            additionalProperties: true,
          },
        },
        required: ['provider', 'category', 'models'],
      },
      PatchAccountExternalDto: {
        type: 'object',
        properties: {
          provider: {
            type: 'string',
            nullable: true,
          },
          origin_owner_id: {
            type: 'string',
            nullable: true,
          },
          origin_owner_name: {
            type: 'string',
            nullable: true,
          },
          origin_username: {
            type: 'string',
            nullable: true,
          },
          credentials: {
            type: 'object',
            additionalProperties: false,
            nullable: true,
          },
          setup_information: {
            type: 'object',
            additionalProperties: false,
            nullable: true,
          },
          secrets: {
            type: 'object',
            additionalProperties: false,
            nullable: true,
          },
          authentication_config_key: {
            type: 'string',
            nullable: true,
          },
          environment: {
            type: 'string',
            nullable: true,
          },
          label: {
            type: 'object',
            nullable: true,
          },
          metadata: {
            type: 'object',
            additionalProperties: false,
            nullable: true,
          },
        },
      },
      ProxyRequestBody: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The base url of the request',
            example: 'https://api.sample-integration.com/v1',
            nullable: true,
          },
          method: {
            type: 'string',
            description: 'The method of the request',
            enum: ['get', 'post', 'put', 'delete', 'patch', null],
            default: 'get',
            'x-speakeasy-unknown-values': 'allow',
            nullable: true,
          },
          path: {
            type: 'string',
            description: 'The path of the request including any query paramters',
            example: '/employees/directory',
            nullable: true,
          },
          headers: {
            type: 'object',
            description: 'The headers to send in the request',
            additionalProperties: true,
            example: {
              'Content-Type': 'application/json',
            },
            nullable: true,
          },
          body: {
            type: 'object',
            description: 'The body of the request',
            additionalProperties: true,
            nullable: true,
          },
        },
      },
      StatusReason: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            nullable: true,
          },
          description: {
            type: 'string',
            nullable: true,
          },
          timestamp: {
            format: 'date-time',
            type: 'string',
          },
        },
        required: ['timestamp'],
      },
    },
  },
};
