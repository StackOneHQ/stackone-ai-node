// Generated OpenAPI specification for crm
export const crmSpec = {
  "openapi": "3.1.0",
  "paths": {
    "/unified/crm/contacts": {
      "get": {
        "operationId": "crm_list_contacts",
        "parameters": [
          {
            "name": "x-account-id",
            "in": "header",
            "description": "The account identifier",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "raw",
            "required": false,
            "in": "query",
            "description": "Indicates that the raw request result should be returned in addition to the mapped result (default value is false)",
            "schema": {
              "nullable": true,
              "type": "boolean"
            }
          },
          {
            "name": "proxy",
            "required": false,
            "in": "query",
            "description": "Query parameters that can be used to pass through parameters to the underlying provider request by surrounding them with 'proxy' key",
            "style": "deepObject",
            "explode": true,
            "schema": {
              "additionalProperties": true,
              "nullable": true,
              "type": "object"
            }
          },
          {
            "name": "fields",
            "required": false,
            "in": "query",
            "description": "The comma separated list of fields that will be returned in the response (if empty, all fields are returned)",
            "schema": {
              "nullable": true,
              "example": "id,remote_id,first_name,last_name,company_name,emails,phone_numbers,deal_ids,remote_deal_ids,account_ids,remote_account_ids,custom_fields,created_at,updated_at",
              "type": "string"
            }
          },
          {
            "name": "filter",
            "required": false,
            "in": "query",
            "description": "Filter parameters that allow greater customisation of the list response",
            "explode": true,
            "style": "deepObject",
            "schema": {
              "properties": {
                "updated_after": {
                  "description": "Use a string with a date to only select results updated after that given date",
                  "example": "2020-01-01T00:00:00.000Z",
                  "type": "string",
                  "nullable": true,
                  "additionalProperties": false
                }
              },
              "nullable": true,
              "type": "object"
            }
          },
          {
            "name": "page",
            "required": false,
            "in": "query",
            "description": "The page number of the results to fetch",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "type": "string"
            }
          },
          {
            "name": "page_size",
            "required": false,
            "in": "query",
            "description": "The number of results per page (default value is 25)",
            "schema": {
              "nullable": true,
              "type": "string"
            }
          },
          {
            "name": "next",
            "required": false,
            "in": "query",
            "description": "The unified cursor",
            "schema": {
              "nullable": true,
              "type": "string"
            }
          },
          {
            "name": "updated_after",
            "required": false,
            "in": "query",
            "description": "Use a string with a date to only select results updated after that given date",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "example": "2020-01-01T00:00:00.000Z",
              "type": "string"
            }
          },
          {
            "name": "include",
            "required": false,
            "in": "query",
            "description": "The comma separated list of fields that will be included in the response",
            "schema": {
              "nullable": true,
              "example": "custom_fields",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The list of contacts was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContactsPaginated"
                }
              }
            }
          },
          "400": {
            "description": "Invalid request."
          },
          "403": {
            "description": "Forbidden."
          },
          "408": {
            "description": "The request has timed out.",
            "headers": {
              "Retry-After": {
                "description": "A time in seconds after which the request can be retried.",
                "schema": {
                  "type": "string"
                }
              }
            }
          },
          "412": {
            "description": "Precondition failed: linked account belongs to a disabled integration."
          },
          "429": {
            "description": "Too many requests."
          },
          "500": {
            "description": "Server error while executing the request."
          },
          "501": {
            "description": "This functionality is not implemented."
          }
        },
        "security": [
          {
            "basic": []
          }
        ],
        "summary": "List Contacts",
        "tags": [
          "Contacts"
        ],
        "x-speakeasy-group": "crm",
        "x-speakeasy-name-override": "list_contacts",
        "x-speakeasy-pagination": {
          "type": "cursor",
          "inputs": [
            {
              "name": "next",
              "in": "parameters",
              "type": "cursor"
            }
          ],
          "outputs": {
            "nextCursor": "$.next"
          }
        },
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      },
      "post": {
        "operationId": "crm_create_contact",
        "parameters": [
          {
            "name": "x-account-id",
            "in": "header",
            "description": "The account identifier",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CrmCreateContactRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "The contact was successfully created.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContactResult"
                }
              }
            }
          },
          "400": {
            "description": "Invalid request."
          },
          "403": {
            "description": "Forbidden."
          },
          "408": {
            "description": "The request has timed out.",
            "headers": {
              "Retry-After": {
                "description": "A time in seconds after which the request can be retried.",
                "schema": {
                  "type": "string"
                }
              }
            }
          },
          "412": {
            "description": "Precondition failed: linked account belongs to a disabled integration."
          },
          "429": {
            "description": "Too many requests."
          },
          "500": {
            "description": "Server error while executing the request."
          },
          "501": {
            "description": "This functionality is not implemented."
          }
        },
        "security": [
          {
            "basic": []
          }
        ],
        "summary": "Creates a new Contact",
        "tags": [
          "Contacts"
        ],
        "x-speakeasy-group": "crm",
        "x-speakeasy-name-override": "create_contact",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/crm/contacts/{id}": {
      "get": {
        "operationId": "crm_get_contact",
        "parameters": [
          {
            "name": "x-account-id",
            "in": "header",
            "description": "The account identifier",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "id",
            "required": true,
            "in": "path",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "raw",
            "required": false,
            "in": "query",
            "description": "Indicates that the raw request result should be returned in addition to the mapped result (default value is false)",
            "schema": {
              "nullable": true,
              "type": "boolean"
            }
          },
          {
            "name": "proxy",
            "required": false,
            "in": "query",
            "description": "Query parameters that can be used to pass through parameters to the underlying provider request by surrounding them with 'proxy' key",
            "style": "deepObject",
            "explode": true,
            "schema": {
              "additionalProperties": true,
              "nullable": true,
              "type": "object"
            }
          },
          {
            "name": "fields",
            "required": false,
            "in": "query",
            "description": "The comma separated list of fields that will be returned in the response (if empty, all fields are returned)",
            "schema": {
              "nullable": true,
              "example": "id,remote_id,first_name,last_name,company_name,emails,phone_numbers,deal_ids,remote_deal_ids,account_ids,remote_account_ids,custom_fields,created_at,updated_at",
              "type": "string"
            }
          },
          {
            "name": "include",
            "required": false,
            "in": "query",
            "description": "The comma separated list of fields that will be included in the response",
            "schema": {
              "nullable": true,
              "example": "custom_fields",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The contact with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContactResult"
                }
              }
            }
          },
          "400": {
            "description": "Invalid request."
          },
          "403": {
            "description": "Forbidden."
          },
          "408": {
            "description": "The request has timed out.",
            "headers": {
              "Retry-After": {
                "description": "A time in seconds after which the request can be retried.",
                "schema": {
                  "type": "string"
                }
              }
            }
          },
          "412": {
            "description": "Precondition failed: linked account belongs to a disabled integration."
          },
          "429": {
            "description": "Too many requests."
          },
          "500": {
            "description": "Server error while executing the request."
          },
          "501": {
            "description": "This functionality is not implemented."
          }
        },
        "security": [
          {
            "basic": []
          }
        ],
        "summary": "Get Contact",
        "tags": [
          "Contacts"
        ],
        "x-speakeasy-group": "crm",
        "x-speakeasy-name-override": "get_contact",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      },
      "patch": {
        "operationId": "crm_update_contact",
        "parameters": [
          {
            "name": "x-account-id",
            "in": "header",
            "description": "The account identifier",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "id",
            "required": true,
            "in": "path",
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CrmCreateContactRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "The contact was successfully updated.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContactResult"
                }
              }
            }
          },
          "400": {
            "description": "Invalid request."
          },
          "403": {
            "description": "Forbidden."
          },
          "408": {
            "description": "The request has timed out.",
            "headers": {
              "Retry-After": {
                "description": "A time in seconds after which the request can be retried.",
                "schema": {
                  "type": "string"
                }
              }
            }
          },
          "412": {
            "description": "Precondition failed: linked account belongs to a disabled integration."
          },
          "429": {
            "description": "Too many requests."
          },
          "500": {
            "description": "Server error while executing the request."
          },
          "501": {
            "description": "This functionality is not implemented."
          }
        },
        "security": [
          {
            "basic": []
          }
        ],
        "summary": "Update Contact (early access)",
        "tags": [
          "Contacts"
        ],
        "x-speakeasy-group": "crm",
        "x-speakeasy-name-override": "update_contact",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/crm/accounts": {
      "get": {
        "operationId": "crm_list_accounts",
        "parameters": [
          {
            "name": "x-account-id",
            "in": "header",
            "description": "The account identifier",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "raw",
            "required": false,
            "in": "query",
            "description": "Indicates that the raw request result should be returned in addition to the mapped result (default value is false)",
            "schema": {
              "nullable": true,
              "type": "boolean"
            }
          },
          {
            "name": "proxy",
            "required": false,
            "in": "query",
            "description": "Query parameters that can be used to pass through parameters to the underlying provider request by surrounding them with 'proxy' key",
            "style": "deepObject",
            "explode": true,
            "schema": {
              "additionalProperties": true,
              "nullable": true,
              "type": "object"
            }
          },
          {
            "name": "fields",
            "required": false,
            "in": "query",
            "description": "The comma separated list of fields that will be returned in the response (if empty, all fields are returned)",
            "schema": {
              "nullable": true,
              "example": "id,remote_id,owner_id,remote_owner_id,name,description,industries,annual_revenue,website,addresses,phone_numbers,created_at,updated_at",
              "type": "string"
            }
          },
          {
            "name": "filter",
            "required": false,
            "in": "query",
            "description": "Filter parameters that allow greater customisation of the list response",
            "explode": true,
            "style": "deepObject",
            "schema": {
              "properties": {
                "updated_after": {
                  "description": "Use a string with a date to only select results updated after that given date",
                  "example": "2020-01-01T00:00:00.000Z",
                  "type": "string",
                  "nullable": true,
                  "additionalProperties": false
                }
              },
              "nullable": true,
              "type": "object"
            }
          },
          {
            "name": "page",
            "required": false,
            "in": "query",
            "description": "The page number of the results to fetch",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "type": "string"
            }
          },
          {
            "name": "page_size",
            "required": false,
            "in": "query",
            "description": "The number of results per page (default value is 25)",
            "schema": {
              "nullable": true,
              "type": "string"
            }
          },
          {
            "name": "next",
            "required": false,
            "in": "query",
            "description": "The unified cursor",
            "schema": {
              "nullable": true,
              "type": "string"
            }
          },
          {
            "name": "updated_after",
            "required": false,
            "in": "query",
            "description": "Use a string with a date to only select results updated after that given date",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "example": "2020-01-01T00:00:00.000Z",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The list of accounts was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AccountsPaginated"
                }
              }
            }
          },
          "400": {
            "description": "Invalid request."
          },
          "403": {
            "description": "Forbidden."
          },
          "408": {
            "description": "The request has timed out.",
            "headers": {
              "Retry-After": {
                "description": "A time in seconds after which the request can be retried.",
                "schema": {
                  "type": "string"
                }
              }
            }
          },
          "412": {
            "description": "Precondition failed: linked account belongs to a disabled integration."
          },
          "429": {
            "description": "Too many requests."
          },
          "500": {
            "description": "Server error while executing the request."
          },
          "501": {
            "description": "This functionality is not implemented."
          }
        },
        "security": [
          {
            "basic": []
          }
        ],
        "summary": "List Accounts",
        "tags": [
          "Accounts"
        ],
        "x-speakeasy-group": "crm",
        "x-speakeasy-name-override": "list_accounts",
        "x-speakeasy-pagination": {
          "type": "cursor",
          "inputs": [
            {
              "name": "next",
              "in": "parameters",
              "type": "cursor"
            }
          ],
          "outputs": {
            "nextCursor": "$.next"
          }
        },
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/crm/accounts/{id}": {
      "get": {
        "operationId": "crm_get_account",
        "parameters": [
          {
            "name": "x-account-id",
            "in": "header",
            "description": "The account identifier",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "id",
            "required": true,
            "in": "path",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "raw",
            "required": false,
            "in": "query",
            "description": "Indicates that the raw request result should be returned in addition to the mapped result (default value is false)",
            "schema": {
              "nullable": true,
              "type": "boolean"
            }
          },
          {
            "name": "proxy",
            "required": false,
            "in": "query",
            "description": "Query parameters that can be used to pass through parameters to the underlying provider request by surrounding them with 'proxy' key",
            "style": "deepObject",
            "explode": true,
            "schema": {
              "additionalProperties": true,
              "nullable": true,
              "type": "object"
            }
          },
          {
            "name": "fields",
            "required": false,
            "in": "query",
            "description": "The comma separated list of fields that will be returned in the response (if empty, all fields are returned)",
            "schema": {
              "nullable": true,
              "example": "id,remote_id,owner_id,remote_owner_id,name,description,industries,annual_revenue,website,addresses,phone_numbers,created_at,updated_at",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The account with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AccountResult"
                }
              }
            }
          },
          "400": {
            "description": "Invalid request."
          },
          "403": {
            "description": "Forbidden."
          },
          "408": {
            "description": "The request has timed out.",
            "headers": {
              "Retry-After": {
                "description": "A time in seconds after which the request can be retried.",
                "schema": {
                  "type": "string"
                }
              }
            }
          },
          "412": {
            "description": "Precondition failed: linked account belongs to a disabled integration."
          },
          "429": {
            "description": "Too many requests."
          },
          "500": {
            "description": "Server error while executing the request."
          },
          "501": {
            "description": "This functionality is not implemented."
          }
        },
        "security": [
          {
            "basic": []
          }
        ],
        "summary": "Get Account",
        "tags": [
          "Accounts"
        ],
        "x-speakeasy-group": "crm",
        "x-speakeasy-name-override": "get_account",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/crm/lists": {
      "get": {
        "operationId": "crm_list_lists",
        "parameters": [
          {
            "name": "x-account-id",
            "in": "header",
            "description": "The account identifier",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "raw",
            "required": false,
            "in": "query",
            "description": "Indicates that the raw request result should be returned in addition to the mapped result (default value is false)",
            "schema": {
              "nullable": true,
              "type": "boolean"
            }
          },
          {
            "name": "proxy",
            "required": false,
            "in": "query",
            "description": "Query parameters that can be used to pass through parameters to the underlying provider request by surrounding them with 'proxy' key",
            "style": "deepObject",
            "explode": true,
            "schema": {
              "additionalProperties": true,
              "nullable": true,
              "type": "object"
            }
          },
          {
            "name": "fields",
            "required": false,
            "in": "query",
            "description": "The comma separated list of fields that will be returned in the response (if empty, all fields are returned)",
            "schema": {
              "nullable": true,
              "example": "id,remote_id,name,created_at,updated_at,items,type",
              "type": "string"
            }
          },
          {
            "name": "filter",
            "required": false,
            "in": "query",
            "description": "Filter parameters that allow greater customisation of the list response",
            "explode": true,
            "style": "deepObject",
            "schema": {
              "properties": {
                "updated_after": {
                  "description": "Use a string with a date to only select results updated after that given date",
                  "example": "2020-01-01T00:00:00.000Z",
                  "type": "string",
                  "nullable": true,
                  "additionalProperties": false
                }
              },
              "nullable": true,
              "type": "object"
            }
          },
          {
            "name": "page",
            "required": false,
            "in": "query",
            "description": "The page number of the results to fetch",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "type": "string"
            }
          },
          {
            "name": "page_size",
            "required": false,
            "in": "query",
            "description": "The number of results per page (default value is 25)",
            "schema": {
              "nullable": true,
              "type": "string"
            }
          },
          {
            "name": "next",
            "required": false,
            "in": "query",
            "description": "The unified cursor",
            "schema": {
              "nullable": true,
              "type": "string"
            }
          },
          {
            "name": "updated_after",
            "required": false,
            "in": "query",
            "description": "Use a string with a date to only select results updated after that given date",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "example": "2020-01-01T00:00:00.000Z",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The collection of lists was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListsPaginated"
                }
              }
            }
          },
          "400": {
            "description": "Invalid request."
          },
          "403": {
            "description": "Forbidden."
          },
          "408": {
            "description": "The request has timed out.",
            "headers": {
              "Retry-After": {
                "description": "A time in seconds after which the request can be retried.",
                "schema": {
                  "type": "string"
                }
              }
            }
          },
          "412": {
            "description": "Precondition failed: linked account belongs to a disabled integration."
          },
          "429": {
            "description": "Too many requests."
          },
          "500": {
            "description": "Server error while executing the request."
          },
          "501": {
            "description": "This functionality is not implemented."
          }
        },
        "security": [
          {
            "basic": []
          }
        ],
        "summary": "Get all Lists",
        "tags": [
          "Lists"
        ],
        "x-speakeasy-group": "crm",
        "x-speakeasy-name-override": "list_lists",
        "x-speakeasy-pagination": {
          "type": "cursor",
          "inputs": [
            {
              "name": "next",
              "in": "parameters",
              "type": "cursor"
            }
          ],
          "outputs": {
            "nextCursor": "$.next"
          }
        },
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/crm/lists/{id}": {
      "get": {
        "operationId": "crm_get_list",
        "parameters": [
          {
            "name": "x-account-id",
            "in": "header",
            "description": "The account identifier",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "id",
            "required": true,
            "in": "path",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "raw",
            "required": false,
            "in": "query",
            "description": "Indicates that the raw request result should be returned in addition to the mapped result (default value is false)",
            "schema": {
              "nullable": true,
              "type": "boolean"
            }
          },
          {
            "name": "proxy",
            "required": false,
            "in": "query",
            "description": "Query parameters that can be used to pass through parameters to the underlying provider request by surrounding them with 'proxy' key",
            "style": "deepObject",
            "explode": true,
            "schema": {
              "additionalProperties": true,
              "nullable": true,
              "type": "object"
            }
          },
          {
            "name": "fields",
            "required": false,
            "in": "query",
            "description": "The comma separated list of fields that will be returned in the response (if empty, all fields are returned)",
            "schema": {
              "nullable": true,
              "example": "id,remote_id,name,created_at,updated_at,items,type",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The list with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListResult"
                }
              }
            }
          },
          "400": {
            "description": "Invalid request."
          },
          "403": {
            "description": "Forbidden."
          },
          "408": {
            "description": "The request has timed out.",
            "headers": {
              "Retry-After": {
                "description": "A time in seconds after which the request can be retried.",
                "schema": {
                  "type": "string"
                }
              }
            }
          },
          "412": {
            "description": "Precondition failed: linked account belongs to a disabled integration."
          },
          "429": {
            "description": "Too many requests."
          },
          "500": {
            "description": "Server error while executing the request."
          },
          "501": {
            "description": "This functionality is not implemented."
          }
        },
        "security": [
          {
            "basic": []
          }
        ],
        "summary": "Get List",
        "tags": [
          "Lists"
        ],
        "x-speakeasy-group": "crm",
        "x-speakeasy-name-override": "get_list",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/crm/custom_field_definitions/contacts": {
      "get": {
        "operationId": "crm_list_contact_custom_field_definitions",
        "parameters": [
          {
            "name": "x-account-id",
            "in": "header",
            "description": "The account identifier",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "raw",
            "required": false,
            "in": "query",
            "description": "Indicates that the raw request result should be returned in addition to the mapped result (default value is false)",
            "schema": {
              "nullable": true,
              "type": "boolean"
            }
          },
          {
            "name": "proxy",
            "required": false,
            "in": "query",
            "description": "Query parameters that can be used to pass through parameters to the underlying provider request by surrounding them with 'proxy' key",
            "style": "deepObject",
            "explode": true,
            "schema": {
              "additionalProperties": true,
              "nullable": true,
              "type": "object"
            }
          },
          {
            "name": "fields",
            "required": false,
            "in": "query",
            "description": "The comma separated list of fields that will be returned in the response (if empty, all fields are returned)",
            "schema": {
              "nullable": true,
              "example": "id,remote_id,name,description,type,options",
              "type": "string"
            }
          },
          {
            "name": "filter",
            "required": false,
            "in": "query",
            "description": "Filter parameters that allow greater customisation of the list response",
            "explode": true,
            "style": "deepObject",
            "schema": {
              "properties": {
                "updated_after": {
                  "description": "Use a string with a date to only select results updated after that given date",
                  "example": "2020-01-01T00:00:00.000Z",
                  "type": "string",
                  "nullable": true,
                  "additionalProperties": false
                }
              },
              "nullable": true,
              "type": "object"
            }
          },
          {
            "name": "page",
            "required": false,
            "in": "query",
            "description": "The page number of the results to fetch",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "type": "string"
            }
          },
          {
            "name": "page_size",
            "required": false,
            "in": "query",
            "description": "The number of results per page (default value is 25)",
            "schema": {
              "nullable": true,
              "type": "string"
            }
          },
          {
            "name": "next",
            "required": false,
            "in": "query",
            "description": "The unified cursor",
            "schema": {
              "nullable": true,
              "type": "string"
            }
          },
          {
            "name": "updated_after",
            "required": false,
            "in": "query",
            "description": "Use a string with a date to only select results updated after that given date",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "example": "2020-01-01T00:00:00.000Z",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The list of contacts custom field definitions was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CustomFieldDefinitionsPaginated"
                }
              }
            }
          },
          "400": {
            "description": "Invalid request."
          },
          "403": {
            "description": "Forbidden."
          },
          "408": {
            "description": "The request has timed out.",
            "headers": {
              "Retry-After": {
                "description": "A time in seconds after which the request can be retried.",
                "schema": {
                  "type": "string"
                }
              }
            }
          },
          "412": {
            "description": "Precondition failed: linked account belongs to a disabled integration."
          },
          "429": {
            "description": "Too many requests."
          },
          "500": {
            "description": "Server error while executing the request."
          },
          "501": {
            "description": "This functionality is not implemented."
          }
        },
        "security": [
          {
            "basic": []
          }
        ],
        "summary": "List Contact Custom Field Definitions",
        "tags": [
          "Custom Field Definitions"
        ],
        "x-speakeasy-group": "crm",
        "x-speakeasy-name-override": "list_contact_custom_field_definitions",
        "x-speakeasy-pagination": {
          "type": "cursor",
          "inputs": [
            {
              "name": "next",
              "in": "parameters",
              "type": "cursor"
            }
          ],
          "outputs": {
            "nextCursor": "$.next"
          }
        },
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/crm/custom_field_definitions/contacts/{id}": {
      "get": {
        "operationId": "crm_get_contact_custom_field_definition",
        "parameters": [
          {
            "name": "x-account-id",
            "in": "header",
            "description": "The account identifier",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "id",
            "required": true,
            "in": "path",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "raw",
            "required": false,
            "in": "query",
            "description": "Indicates that the raw request result should be returned in addition to the mapped result (default value is false)",
            "schema": {
              "nullable": true,
              "type": "boolean"
            }
          },
          {
            "name": "proxy",
            "required": false,
            "in": "query",
            "description": "Query parameters that can be used to pass through parameters to the underlying provider request by surrounding them with 'proxy' key",
            "style": "deepObject",
            "explode": true,
            "schema": {
              "additionalProperties": true,
              "nullable": true,
              "type": "object"
            }
          },
          {
            "name": "fields",
            "required": false,
            "in": "query",
            "description": "The comma separated list of fields that will be returned in the response (if empty, all fields are returned)",
            "schema": {
              "nullable": true,
              "example": "id,remote_id,name,description,type,options",
              "type": "string"
            }
          },
          {
            "name": "filter",
            "required": false,
            "in": "query",
            "description": "Filter parameters that allow greater customisation of the list response",
            "explode": true,
            "style": "deepObject",
            "schema": {
              "properties": {
                "updated_after": {
                  "description": "Use a string with a date to only select results updated after that given date",
                  "example": "2020-01-01T00:00:00.000Z",
                  "type": "string",
                  "nullable": true,
                  "additionalProperties": false
                }
              },
              "nullable": true,
              "type": "object"
            }
          },
          {
            "name": "page",
            "required": false,
            "in": "query",
            "description": "The page number of the results to fetch",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "type": "string"
            }
          },
          {
            "name": "page_size",
            "required": false,
            "in": "query",
            "description": "The number of results per page (default value is 25)",
            "schema": {
              "nullable": true,
              "type": "string"
            }
          },
          {
            "name": "next",
            "required": false,
            "in": "query",
            "description": "The unified cursor",
            "schema": {
              "nullable": true,
              "type": "string"
            }
          },
          {
            "name": "updated_after",
            "required": false,
            "in": "query",
            "description": "Use a string with a date to only select results updated after that given date",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "example": "2020-01-01T00:00:00.000Z",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The contact custom field definition was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CustomFieldDefinitionResultApiModel"
                }
              }
            }
          },
          "400": {
            "description": "Invalid request."
          },
          "403": {
            "description": "Forbidden."
          },
          "408": {
            "description": "The request has timed out.",
            "headers": {
              "Retry-After": {
                "description": "A time in seconds after which the request can be retried.",
                "schema": {
                  "type": "string"
                }
              }
            }
          },
          "412": {
            "description": "Precondition failed: linked account belongs to a disabled integration."
          },
          "429": {
            "description": "Too many requests."
          },
          "500": {
            "description": "Server error while executing the request."
          },
          "501": {
            "description": "This functionality is not implemented."
          }
        },
        "security": [
          {
            "basic": []
          }
        ],
        "summary": "Get Contact Custom Field Definition",
        "tags": [
          "Custom Field Definitions"
        ],
        "x-speakeasy-group": "crm",
        "x-speakeasy-name-override": "get_contact_custom_field_definition",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    }
  },
  "info": {
    "title": "CRM",
    "description": "The documentation for the StackOne Unified API - CRM",
    "version": "1.0.0",
    "contact": {}
  },
  "tags": [
    {
      "name": "Accounts",
      "description": ""
    },
    {
      "name": "Contacts",
      "description": ""
    },
    {
      "name": "Custom Field Definitions",
      "description": ""
    },
    {
      "name": "Lists",
      "description": ""
    }
  ],
  "servers": [
    {
      "url": "https://api.stackone.com"
    }
  ],
  "components": {
    "securitySchemes": {
      "basic": {
        "type": "http",
        "scheme": "basic"
      }
    },
    "schemas": {
      "Account": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier",
            "example": "8187e5da-dc77-475e-9949-af0f1fa4e4e3",
            "nullable": true
          },
          "remote_id": {
            "type": "string",
            "description": "Provider's unique identifier",
            "example": "8187e5da-dc77-475e-9949-af0f1fa4e4e3",
            "nullable": true
          },
          "unified_custom_fields": {
            "type": "object",
            "description": "Custom Unified Fields configured in your StackOne project",
            "additionalProperties": true,
            "example": {
              "my_project_custom_field_1": "REF-1236",
              "my_project_custom_field_2": "some other value"
            },
            "nullable": true
          },
          "owner_id": {
            "type": "string",
            "nullable": true
          },
          "remote_owner_id": {
            "type": "string",
            "description": "Provider's unique identifier of the owner",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "name": {
            "type": "string",
            "nullable": true
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "industries": {
            "description": "Values of the industries",
            "example": [
              "Information Technology",
              "Airlines & Airports",
              "Personal Care & Household Products"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "annual_revenue": {
            "type": "string",
            "nullable": true
          },
          "website": {
            "type": "string",
            "nullable": true
          },
          "addresses": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AccountAddress"
            }
          },
          "phone_numbers": {
            "description": "List of account phone numbers",
            "example": [
              "+1123425334"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "created_at": {
            "type": "string",
            "description": "Timestamp when the account was created",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "Timestamp when the account was last updated",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "AccountAddress": {
        "type": "object",
        "properties": {
          "street_1": {
            "type": "string",
            "nullable": true
          },
          "street_2": {
            "type": "string",
            "nullable": true
          },
          "city": {
            "type": "string",
            "nullable": true
          },
          "state": {
            "type": "string",
            "nullable": true
          },
          "zip_code": {
            "type": "string",
            "nullable": true
          },
          "country": {
            "description": "The country code",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/CountryEnum"
              }
            ]
          },
          "location_type": {
            "description": "The location type",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/LocationTypeEnum"
              }
            ]
          }
        }
      },
      "AccountResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/Account"
          },
          "raw": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/RawResponse"
            }
          }
        },
        "required": [
          "data"
        ]
      },
      "AccountsPaginated": {
        "type": "object",
        "properties": {
          "next_page": {
            "type": "string",
            "deprecated": true,
            "nullable": true
          },
          "next": {
            "type": "string",
            "nullable": true
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Account"
            }
          },
          "raw": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/RawResponse"
            }
          }
        },
        "required": [
          "data"
        ]
      },
      "Contact": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier",
            "example": "8187e5da-dc77-475e-9949-af0f1fa4e4e3",
            "nullable": true
          },
          "remote_id": {
            "type": "string",
            "description": "Provider's unique identifier",
            "example": "8187e5da-dc77-475e-9949-af0f1fa4e4e3",
            "nullable": true
          },
          "unified_custom_fields": {
            "type": "object",
            "description": "Custom Unified Fields configured in your StackOne project",
            "additionalProperties": true,
            "example": {
              "my_project_custom_field_1": "REF-1236",
              "my_project_custom_field_2": "some other value"
            },
            "nullable": true
          },
          "first_name": {
            "type": "string",
            "description": "The contact first name",
            "example": "Steve",
            "nullable": true
          },
          "last_name": {
            "type": "string",
            "description": "The contact last name",
            "example": "Wozniak",
            "nullable": true
          },
          "company_name": {
            "type": "string",
            "description": "The contact company name",
            "example": "Apple Inc.",
            "nullable": true
          },
          "emails": {
            "description": "List of contact email addresses",
            "example": [
              "steve@apple.com"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "phone_numbers": {
            "description": "List of contact phone numbers",
            "example": [
              "123-456-7890"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "deal_ids": {
            "description": "List of associated deal IDs",
            "example": [
              "deal-001",
              "deal-002"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "remote_deal_ids": {
            "description": "Provider's list of associated deal IDs",
            "example": [
              "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
              "e3cb75bf-aa84-466e-a6c1-b8322b257a49"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "account_ids": {
            "description": "List of associated account IDs",
            "example": [
              "account-123",
              "account-456"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "remote_account_ids": {
            "description": "Provider's list of associated account IDs",
            "example": [
              "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
              "e3cb75bf-aa84-466e-a6c1-b8322b257a49"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "custom_fields": {
            "description": "Contact custom fields",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CustomFields"
            }
          },
          "created_at": {
            "type": "string",
            "description": "Timestamp when the contact was created",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "Timestamp when the contact was last updated",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "ContactResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/Contact"
          },
          "raw": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/RawResponse"
            }
          }
        },
        "required": [
          "data"
        ]
      },
      "ContactsPaginated": {
        "type": "object",
        "properties": {
          "next_page": {
            "type": "string",
            "deprecated": true,
            "nullable": true
          },
          "next": {
            "type": "string",
            "nullable": true
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Contact"
            }
          },
          "raw": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/RawResponse"
            }
          }
        },
        "required": [
          "data"
        ]
      },
      "CountryEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "AF",
              "AL",
              "DZ",
              "AS",
              "AD",
              "AO",
              "AI",
              "AQ",
              "AG",
              "AR",
              "AM",
              "AW",
              "AU",
              "AT",
              "AZ",
              "BS",
              "BH",
              "BD",
              "BB",
              "BY",
              "BE",
              "BZ",
              "BJ",
              "BM",
              "BT",
              "BO",
              "BQ",
              "BA",
              "BW",
              "BV",
              "BR",
              "IO",
              "BN",
              "BG",
              "BF",
              "BI",
              "KH",
              "CM",
              "CA",
              "CV",
              "KY",
              "CF",
              "TD",
              "CL",
              "CN",
              "CX",
              "CC",
              "CO",
              "KM",
              "CG",
              "CD",
              "CK",
              "CR",
              "HR",
              "CU",
              "CW",
              "CY",
              "CZ",
              "CI",
              "DK",
              "DJ",
              "DM",
              "DO",
              "EC",
              "EG",
              "SV",
              "GQ",
              "ER",
              "EE",
              "ET",
              "FK",
              "FO",
              "FJ",
              "FI",
              "FR",
              "GF",
              "PF",
              "TF",
              "GA",
              "GM",
              "GE",
              "DE",
              "GH",
              "GI",
              "GR",
              "GL",
              "GD",
              "GP",
              "GU",
              "GT",
              "GG",
              "GN",
              "GW",
              "GY",
              "HT",
              "HM",
              "VA",
              "HN",
              "HK",
              "HU",
              "IS",
              "IN",
              "ID",
              "IR",
              "IQ",
              "IE",
              "IM",
              "IL",
              "IT",
              "JM",
              "JP",
              "JE",
              "JO",
              "KZ",
              "KE",
              "KI",
              "KP",
              "KR",
              "KW",
              "KG",
              "LA",
              "LV",
              "LB",
              "LS",
              "LR",
              "LY",
              "LI",
              "LT",
              "LU",
              "MO",
              "MK",
              "MG",
              "MW",
              "MY",
              "MV",
              "ML",
              "MT",
              "MH",
              "MQ",
              "MR",
              "MU",
              "YT",
              "MX",
              "FM",
              "MD",
              "MC",
              "MN",
              "ME",
              "MS",
              "MA",
              "MZ",
              "MM",
              "NA",
              "NR",
              "NP",
              "NL",
              "NC",
              "NZ",
              "NI",
              "NE",
              "NG",
              "NU",
              "NF",
              "MP",
              "NO",
              "OM",
              "PK",
              "PW",
              "PS",
              "PA",
              "PG",
              "PY",
              "PE",
              "PH",
              "PN",
              "PL",
              "PT",
              "PR",
              "QA",
              "RO",
              "RU",
              "RW",
              "RE",
              "BL",
              "SH",
              "KN",
              "LC",
              "MF",
              "PM",
              "VC",
              "WS",
              "SM",
              "ST",
              "SA",
              "SN",
              "RS",
              "SC",
              "SL",
              "SG",
              "SX",
              "SK",
              "SI",
              "SB",
              "SO",
              "ZA",
              "GS",
              "SS",
              "ES",
              "LK",
              "SD",
              "SR",
              "SJ",
              "SZ",
              "SE",
              "CH",
              "SY",
              "TW",
              "TJ",
              "TZ",
              "TH",
              "TL",
              "TG",
              "TK",
              "TO",
              "TT",
              "TN",
              "TR",
              "TM",
              "TC",
              "TV",
              "UG",
              "UA",
              "AE",
              "GB",
              "US",
              "UM",
              "UY",
              "UZ",
              "VU",
              "VE",
              "VN",
              "VG",
              "VI",
              "WF",
              "EH",
              "YE",
              "ZM",
              "ZW",
              null
            ],
            "description": "The ISO 3166-1 alpha-2 code of the country.",
            "example": "GB",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the ISO 3166-1 alpha-2 code of the country.",
            "example": "GB",
            "oneOf": [
              {
                "type": "string"
              },
              {
                "type": "number"
              },
              {
                "type": "boolean"
              },
              {
                "type": "object"
              },
              {
                "type": "array",
                "items": {}
              }
            ],
            "nullable": true
          }
        }
      },
      "CrmCreateContactRequestDto": {
        "type": "object",
        "properties": {
          "first_name": {
            "type": "string",
            "description": "The contact first name",
            "example": "Steve",
            "nullable": true
          },
          "last_name": {
            "type": "string",
            "description": "The contact last name",
            "example": "Wozniak",
            "nullable": true
          },
          "company_name": {
            "type": "string",
            "description": "The contact company name",
            "example": "Apple Inc.",
            "nullable": true
          },
          "emails": {
            "description": "List of contact email addresses",
            "example": [
              "steve@apple.com"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "phone_numbers": {
            "description": "List of contact phone numbers",
            "example": [
              "123-456-7890"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "deal_ids": {
            "description": "List of associated deal IDs",
            "example": [
              "deal-001",
              "deal-002"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "account_ids": {
            "description": "List of associated account IDs",
            "example": [
              "account-123",
              "account-456"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "custom_fields": {
            "description": "Contact custom fields",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CustomFields"
            }
          },
          "passthrough": {
            "type": "object",
            "description": "Value to pass through to the provider",
            "example": {
              "other_known_names": "John Doe"
            },
            "additionalProperties": true,
            "nullable": true
          }
        }
      },
      "CustomFieldDefinition": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier",
            "example": "8187e5da-dc77-475e-9949-af0f1fa4e4e3",
            "nullable": true
          },
          "remote_id": {
            "type": "string",
            "description": "Provider's unique identifier",
            "example": "8187e5da-dc77-475e-9949-af0f1fa4e4e3",
            "nullable": true
          },
          "name": {
            "type": "string",
            "nullable": true
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "type": {
            "description": "The type of the custom field.",
            "example": "Dropdown",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/CustomFieldTypeEnum"
              }
            ]
          },
          "options": {
            "description": "An array of possible options for the custom field.",
            "example": [
              "Not Started",
              "In Progress",
              "Completed",
              "Overdue"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "oneOf": [
                {
                  "type": "string"
                },
                {
                  "type": "number"
                },
                {
                  "type": "boolean"
                },
                {
                  "type": "object"
                },
                {
                  "type": "array",
                  "items": {}
                }
              ]
            }
          }
        }
      },
      "CustomFieldDefinitionResultApiModel": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/CustomFieldDefinition"
          },
          "raw": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/RawResponse"
            }
          }
        },
        "required": [
          "data"
        ]
      },
      "CustomFieldDefinitionsPaginated": {
        "type": "object",
        "properties": {
          "next_page": {
            "type": "string",
            "deprecated": true,
            "nullable": true
          },
          "next": {
            "type": "string",
            "nullable": true
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CustomFieldDefinition"
            }
          },
          "raw": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/RawResponse"
            }
          }
        },
        "required": [
          "data"
        ]
      },
      "CustomFields": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier",
            "example": "8187e5da-dc77-475e-9949-af0f1fa4e4e3",
            "nullable": true
          },
          "remote_id": {
            "type": "string",
            "description": "Provider's unique identifier",
            "example": "8187e5da-dc77-475e-9949-af0f1fa4e4e3",
            "nullable": true
          },
          "name": {
            "type": "string",
            "description": "The name of the custom field.",
            "example": "Training Completion Status",
            "nullable": true
          },
          "value": {
            "description": "The value associated with the custom field.",
            "example": "Completed",
            "oneOf": [
              {
                "type": "string"
              },
              {
                "type": "number"
              },
              {
                "type": "boolean"
              },
              {
                "type": "object"
              },
              {
                "type": "array",
                "items": {}
              }
            ],
            "nullable": true
          },
          "value_id": {
            "type": "string",
            "description": "The unique identifier for the value of the custom field.",
            "example": "value_456",
            "nullable": true
          },
          "remote_value_id": {
            "type": "string",
            "description": "Provider's unique identifier for the value of the custom field.",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          }
        }
      },
      "CustomFieldTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "date",
              "float",
              "integer",
              "list",
              "checkbox",
              "text",
              "boolean",
              "single_select",
              "multi_select",
              "url",
              "other",
              null
            ],
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "oneOf": [
              {
                "type": "string"
              },
              {
                "type": "number"
              },
              {
                "type": "boolean"
              },
              {
                "type": "object"
              },
              {
                "type": "array",
                "items": {}
              }
            ],
            "nullable": true
          }
        }
      },
      "List": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier",
            "example": "8187e5da-dc77-475e-9949-af0f1fa4e4e3",
            "nullable": true
          },
          "remote_id": {
            "type": "string",
            "description": "Provider's unique identifier",
            "example": "8187e5da-dc77-475e-9949-af0f1fa4e4e3",
            "nullable": true
          },
          "unified_custom_fields": {
            "type": "object",
            "description": "Custom Unified Fields configured in your StackOne project",
            "additionalProperties": true,
            "example": {
              "my_project_custom_field_1": "REF-1236",
              "my_project_custom_field_2": "some other value"
            },
            "nullable": true
          },
          "name": {
            "type": "string",
            "nullable": true
          },
          "items": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ListItem"
            }
          },
          "created_at": {
            "type": "string",
            "description": "Timestamp when the list was created",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "Timestamp when the list was last updated",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "type": {
            "description": "The list type",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ListTypeEnum"
              }
            ]
          }
        }
      },
      "ListItem": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier",
            "example": "8187e5da-dc77-475e-9949-af0f1fa4e4e3",
            "nullable": true
          },
          "remote_id": {
            "type": "string",
            "description": "Provider's unique identifier",
            "example": "8187e5da-dc77-475e-9949-af0f1fa4e4e3",
            "nullable": true
          }
        }
      },
      "ListResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/List"
          },
          "raw": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/RawResponse"
            }
          }
        },
        "required": [
          "data"
        ]
      },
      "ListsPaginated": {
        "type": "object",
        "properties": {
          "next_page": {
            "type": "string",
            "deprecated": true,
            "nullable": true
          },
          "next": {
            "type": "string",
            "nullable": true
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/List"
            }
          },
          "raw": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/RawResponse"
            }
          }
        },
        "required": [
          "data"
        ]
      },
      "ListTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "candidates",
              "contacts",
              "companies",
              "unmapped_value",
              null
            ],
            "description": "The type of the list.",
            "example": "contacts",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the list type.",
            "example": "Contacts",
            "oneOf": [
              {
                "type": "string"
              },
              {
                "type": "number"
              },
              {
                "type": "boolean"
              },
              {
                "type": "object"
              },
              {
                "type": "array",
                "items": {}
              }
            ],
            "nullable": true
          }
        }
      },
      "LocationTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "home",
              "work",
              "unmapped_value",
              null
            ],
            "description": "The type of the location.",
            "example": "home",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the location type.",
            "example": "Home",
            "oneOf": [
              {
                "type": "string"
              },
              {
                "type": "number"
              },
              {
                "type": "boolean"
              },
              {
                "type": "object"
              },
              {
                "type": "array",
                "items": {}
              }
            ],
            "nullable": true
          }
        }
      },
      "RawResponse": {
        "type": "object",
        "properties": {
          "method": {
            "type": "string"
          },
          "url": {
            "type": "string"
          },
          "body": {
            "oneOf": [
              {
                "type": "string"
              },
              {
                "type": "object"
              },
              {
                "type": "string",
                "format": "binary"
              },
              {
                "type": "array",
                "items": {
                  "type": "integer",
                  "format": "int32",
                  "minimum": 0,
                  "maximum": 255
                }
              },
              {
                "type": "string",
                "format": "byte"
              }
            ],
            "additionalProperties": true,
            "nullable": true
          },
          "response": {
            "type": "object",
            "additionalProperties": true,
            "nullable": true
          }
        },
        "required": [
          "method",
          "url"
        ]
      }
    }
  }
} as const;
