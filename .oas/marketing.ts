// Generated OpenAPI specification for marketing
export const marketingSpec = {
  "openapi": "3.1.0",
  "paths": {
    "/unified/marketing/templates/email": {
      "get": {
        "operationId": "marketing_list_email_templates",
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
              "example": "id,remote_id,name,messages,created_at,updated_at,tags",
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
            "description": "The list of email templates was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/EmailTemplatesPaginated"
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
        "summary": "List Email Templates",
        "tags": [
          "Templates",
          "Email"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "list_email_templates",
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
        "operationId": "marketing_create_email_template",
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
                "$ref": "#/components/schemas/MarketingCreateEmailTemplateRequestDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Record created successfully.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateResult"
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
        "summary": "Create Email Templates",
        "tags": [
          "Templates",
          "Email"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "create_email_template",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/marketing/templates/email/{id}": {
      "get": {
        "operationId": "marketing_get_email_template",
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
              "example": "id,remote_id,name,messages,created_at,updated_at,tags",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The email template with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/EmailTemplateResult"
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
        "summary": "Get Email Templates",
        "tags": [
          "Templates",
          "Email"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "get_email_template",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      },
      "patch": {
        "operationId": "marketing_update_email_template",
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
                "$ref": "#/components/schemas/MarketingCreateEmailTemplateRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Record updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateResult"
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
        "summary": "Update Email Templates",
        "tags": [
          "Templates",
          "Email"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "update_email_template",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/marketing/templates/in_app": {
      "get": {
        "operationId": "marketing_list_in_app_templates",
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
              "example": "id,remote_id,name,messages,created_at,updated_at,tags",
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
            "description": "The list of in-app templates was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/InAppTemplatesPaginated"
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
        "summary": "List In-App Templates",
        "tags": [
          "Templates",
          "In App"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "list_in_app_templates",
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
        "operationId": "marketing_create_in_app_template",
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
                "$ref": "#/components/schemas/MarketingCreateInAppTemplateRequestDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Record created successfully.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateResult"
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
        "summary": "Create In-App Template",
        "tags": [
          "Templates",
          "In App"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "create_in_app_template",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/marketing/templates/in_app/{id}": {
      "get": {
        "operationId": "marketing_get_in_app_template",
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
              "example": "id,remote_id,name,messages,created_at,updated_at,tags",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The in-app template with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/InAppTemplateResult"
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
        "summary": "Get In-App Template",
        "tags": [
          "Templates",
          "In App"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "get_in_app_template",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      },
      "patch": {
        "operationId": "marketing_update_in_app_template",
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
                "$ref": "#/components/schemas/MarketingCreateInAppTemplateRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Record updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateResult"
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
        "summary": "Update In-App Template",
        "tags": [
          "Templates",
          "In App"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "update_in_app_template",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/marketing/templates/sms": {
      "get": {
        "operationId": "marketing_list_sms_templates",
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
              "example": "id,remote_id,name,messages,created_at,updated_at,tags",
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
            "description": "The list of SMS templates was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/SmsTemplatesPaginated"
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
        "summary": "List SMS Templates",
        "tags": [
          "Templates",
          "SMS"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "list_sms_templates",
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
        "operationId": "marketing_create_sms_template",
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
                "$ref": "#/components/schemas/MarketingCreateSmsTemplateRequestDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Record created successfully.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateResult"
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
        "summary": "Create SMS Template",
        "tags": [
          "Templates",
          "SMS"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "create_sms_template",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/marketing/templates/sms/{id}": {
      "get": {
        "operationId": "marketing_get_sms_template",
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
              "example": "id,remote_id,name,messages,created_at,updated_at,tags",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The SMS template with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/SmsTemplateResult"
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
        "summary": "Get SMS Template",
        "tags": [
          "Templates",
          "SMS"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "get_sms_template",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      },
      "patch": {
        "operationId": "marketing_update_sms_template",
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
                "$ref": "#/components/schemas/MarketingCreateSmsTemplateRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Record updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateResult"
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
        "summary": "Update SMS Template",
        "tags": [
          "Templates",
          "SMS"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "update_sms_template",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/marketing/templates/omni_channel": {
      "get": {
        "deprecated": true,
        "operationId": "marketing_list_omni_channel_templates",
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
              "example": "id,remote_id,name,messages,created_at,updated_at,tags",
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
            "description": "The list of omni-channel templates was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/TemplatesPaginated"
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
        "summary": "List Omni-Channel Templates",
        "tags": [
          "Templates",
          "Omni-Channel"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "list_omni_channel_templates",
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
        "deprecated": true,
        "operationId": "marketing_create_omni_channel_template",
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
                "$ref": "#/components/schemas/MarketingCreateTemplateRequestDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Record created successfully.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateResult"
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
        "summary": "Create Omni-Channel Template",
        "tags": [
          "Templates",
          "Omni-Channel"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "create_omni_channel_template",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/marketing/templates/omni_channel/{id}": {
      "get": {
        "deprecated": true,
        "operationId": "marketing_get_omni_channel_template",
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
              "example": "id,remote_id,name,messages,created_at,updated_at,tags",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The omni-channel template with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/TemplateResult"
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
        "summary": "Get Omni-Channel Template",
        "tags": [
          "Templates",
          "Omni-Channel"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "get_omni_channel_template",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      },
      "patch": {
        "deprecated": true,
        "operationId": "marketing_update_omni_channel_template",
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
                "$ref": "#/components/schemas/MarketingCreateTemplateRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Record updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateResult"
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
        "summary": "Update Omni-Channel Template",
        "tags": [
          "Templates",
          "Omni-Channel"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "update_omni_channel_template",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/marketing/templates/push": {
      "get": {
        "operationId": "marketing_list_push_templates",
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
              "example": "id,remote_id,name,messages,created_at,updated_at,tags",
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
            "description": "The list of push templates was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/PushTemplatesPaginated"
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
        "summary": "List Push Templates",
        "tags": [
          "Templates",
          "Push"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "list_push_templates",
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
        "operationId": "marketing_create_push_template",
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
                "$ref": "#/components/schemas/MarketingCreatePushTemplateRequestDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Record created successfully.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateResult"
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
        "summary": "Create Push Template",
        "tags": [
          "Templates",
          "Push"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "create_push_template",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/marketing/templates/push/{id}": {
      "get": {
        "operationId": "marketing_get_push_template",
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
              "example": "id,remote_id,name,messages,created_at,updated_at,tags",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The push template with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/PushTemplateResult"
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
        "summary": "Get Push Template",
        "tags": [
          "Templates",
          "Push"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "get_push_template",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      },
      "patch": {
        "operationId": "marketing_update_push_template",
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
                "$ref": "#/components/schemas/MarketingCreatePushTemplateRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Record updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateResult"
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
        "summary": "Update Push Template",
        "tags": [
          "Templates",
          "Push"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "update_push_template",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/marketing/campaigns": {
      "get": {
        "operationId": "marketing_list_campaigns",
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
              "example": "id,remote_id,name,created_at,updated_at,description,schedule_type,status,channels,first_sent_at,last_sent_at,tags,messages",
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
            "description": "The list of campaigns was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CampaignsPaginated"
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
        "summary": "List campaigns",
        "tags": [
          "Campaigns"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "list_campaigns",
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
    "/unified/marketing/campaigns/{id}": {
      "get": {
        "operationId": "marketing_get_campaign",
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
              "example": "id,remote_id,name,created_at,updated_at,description,schedule_type,status,channels,first_sent_at,last_sent_at,tags,messages",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The campaign with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CampaignResult"
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
        "summary": "Get campaign",
        "tags": [
          "Campaigns"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "get_campaign",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/marketing/content_blocks": {
      "get": {
        "operationId": "marketing_list_content_blocks",
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
              "example": "id,remote_id,name,type,content,status,tags,created_at,updated_at",
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
            "description": "The list of Content Blocks was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContentBlocksPaginated"
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
        "summary": "List Content Blocks",
        "tags": [
          "Content Blocks"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "list_content_blocks",
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
        "operationId": "marketing_create_content_block",
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
                "$ref": "#/components/schemas/MarketingCreateContentBlocksRequestDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Record created successfully.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateResult"
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
        "summary": "Create Content Block",
        "tags": [
          "Content Blocks"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "create_content_block",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/marketing/content_blocks/{id}": {
      "get": {
        "operationId": "marketing_get_content_block",
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
              "example": "id,remote_id,name,type,content,status,tags,created_at,updated_at",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The Content Block with the given identifier was retrieved",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContentBlockResult"
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
        "summary": "Get Content Blocks",
        "tags": [
          "Content Blocks"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "get_content_block",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      },
      "patch": {
        "operationId": "marketing_update_content_block",
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
                "$ref": "#/components/schemas/MarketingCreateContentBlocksRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Record updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateResult"
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
        "summary": "Update Content Block",
        "tags": [
          "Content Blocks"
        ],
        "x-speakeasy-group": "marketing",
        "x-speakeasy-name-override": "update_content_block",
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
    "title": "Marketing",
    "description": "The documentation for the StackOne Unified API - MARKETING",
    "version": "1.0.0",
    "contact": {}
  },
  "tags": [
    {
      "name": "Campaigns",
      "description": ""
    },
    {
      "name": "Content Blocks",
      "description": ""
    },
    {
      "name": "Email",
      "description": ""
    },
    {
      "name": "In App",
      "description": ""
    },
    {
      "name": "Omni-Channel",
      "description": ""
    },
    {
      "name": "Push",
      "description": ""
    },
    {
      "name": "SMS",
      "description": ""
    },
    {
      "name": "Templates",
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
      "Campaign": {
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
          "created_at": {
            "type": "string",
            "description": "The created_at date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "The updated_at date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "schedule_type": {
            "description": "The schedule type",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ScheduleTypeEnum"
              }
            ]
          },
          "status": {
            "description": "Status of the Campaign",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/StatusEnum"
              }
            ]
          },
          "archived": {
            "oneOf": [
              {
                "type": "boolean"
              },
              {
                "type": "string",
                "enum": [
                  "true",
                  "false"
                ]
              }
            ],
            "nullable": true
          },
          "draft": {
            "oneOf": [
              {
                "type": "boolean"
              },
              {
                "type": "string",
                "enum": [
                  "true",
                  "false"
                ]
              }
            ],
            "nullable": true
          },
          "channels": {
            "description": "channels of the Campaign",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ChannelsEnum"
            }
          },
          "first_sent_at": {
            "type": "string",
            "description": "The first_sent_at date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "last_sent_at": {
            "type": "string",
            "description": "The last_sent_at date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "tags": {
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "messages": {
            "example": [
              {
                "id": "message-id-1",
                "name": "SMS Message",
                "message_type": {
                  "value": "sms",
                  "sourceValue": "sms-message"
                },
                "message_content": {
                  "body": "This is an example SMS body.",
                  "from": "1-555-123-4567"
                }
              },
              {
                "id": "message-id-2",
                "name": "Email Message",
                "message_type": {
                  "value": "email",
                  "sourceValue": "email-message"
                },
                "message_content": {
                  "subject": "Example Email Subject",
                  "body": "<h1>This is an example</h1>\n            <p>email body</p>",
                  "from": "Jane Smith",
                  "reply-to": "reply@example.com",
                  "preheader": "This is the preheader of the email."
                }
              },
              {
                "id": "message-id-3",
                "name": "iOS Push Message",
                "message_type": {
                  "value": "ios_push",
                  "sourceValue": "ios-push"
                },
                "message_content": {
                  "body": "This is an example push notification body."
                }
              }
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Message"
            }
          }
        }
      },
      "CampaignResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/Campaign"
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
      "CampaignsPaginated": {
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
              "$ref": "#/components/schemas/Campaign"
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
      "ChannelsEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "email",
              "sms",
              "web_push",
              "ios_push",
              "android_push",
              "unknown",
              "unmapped_value",
              null
            ],
            "description": "The Channels of the campaign.",
            "example": "sms",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the Channels.",
            "example": "SMS",
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
      "ContentBlock": {
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
          "tags": {
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "content": {
            "type": "string",
            "nullable": true
          },
          "type": {
            "description": "Stackone enum identifying the type of content block.",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ContentBlockTypeEnumApiModel"
              }
            ]
          },
          "status": {
            "description": "Stackone enum identifying the status of content block.",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ContentBlockStatusEnumApiModel"
              }
            ]
          },
          "created_at": {
            "type": "string",
            "description": "Date of creation",
            "example": "2021-01-01T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "Date of last update",
            "example": "2021-01-01T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "ContentBlockResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/ContentBlock"
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
      "ContentBlocksPaginated": {
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
              "$ref": "#/components/schemas/ContentBlock"
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
      "ContentBlockStatusEnumApiModel": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "draft",
              "live",
              "archived",
              null
            ],
            "description": "The Status of the content blocks.",
            "example": "live",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the status.",
            "example": "active",
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
      "ContentBlockTypeEnumApiModel": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "text",
              "html",
              "image",
              "code-snippet",
              null
            ],
            "description": "The type of the content blocks.",
            "example": "html",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the type.",
            "example": "text",
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
      "CreateMessage": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier",
            "example": "8187e5da-dc77-475e-9949-af0f1fa4e4e3",
            "nullable": true
          },
          "name": {
            "type": "string",
            "nullable": true
          },
          "message_type": {
            "description": "Stackone enum identifying the type of message associated with the content.",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/MessageTypeEnum"
              }
            ]
          },
          "message_content": {
            "oneOf": [
              {
                "$ref": "#/components/schemas/SmsMessageContents"
              },
              {
                "$ref": "#/components/schemas/EmailMessageContents"
              },
              {
                "$ref": "#/components/schemas/PushMessageContents"
              }
            ],
            "nullable": true
          }
        }
      },
      "CreateResult": {
        "type": "object",
        "properties": {
          "statusCode": {
            "type": "number",
            "example": 201
          },
          "message": {
            "type": "string",
            "example": "Record created successfully."
          },
          "timestamp": {
            "type": "string",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time"
          },
          "data": {
            "$ref": "#/components/schemas/CreateResultDataApiModel"
          }
        },
        "required": [
          "statusCode",
          "message",
          "timestamp",
          "data"
        ]
      },
      "CreateResultDataApiModel": {
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
      "EmailMessageContents": {
        "type": "object",
        "properties": {
          "subject": {
            "type": "string",
            "nullable": true
          },
          "body": {
            "type": "string",
            "nullable": true
          },
          "from": {
            "type": "string",
            "nullable": true
          },
          "reply-to": {
            "type": "string",
            "nullable": true
          },
          "preheader": {
            "type": "string",
            "nullable": true
          }
        }
      },
      "EmailMessages": {
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
          "message_type": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/MessageTypeEnum"
              }
            ]
          },
          "message_content": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmailMessageContents"
              }
            ]
          }
        }
      },
      "EmailTemplate": {
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
          "tags": {
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "created_at": {
            "type": "string",
            "description": "Date of creation",
            "example": "2021-01-01T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "Date of last update",
            "example": "2021-01-01T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "messages": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/EmailMessages"
            }
          }
        }
      },
      "EmailTemplateResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/EmailTemplate"
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
      "EmailTemplatesPaginated": {
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
              "$ref": "#/components/schemas/EmailTemplate"
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
      "InAppMessageContents": {
        "type": "object",
        "properties": {
          "body": {
            "type": "string",
            "nullable": true
          }
        }
      },
      "InAppMessages": {
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
          "message_type": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/MessageTypeEnum"
              }
            ]
          },
          "message_content": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/InAppMessageContents"
              }
            ]
          }
        }
      },
      "InAppTemplate": {
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
          "tags": {
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "created_at": {
            "type": "string",
            "description": "Date of creation",
            "example": "2021-01-01T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "Date of last update",
            "example": "2021-01-01T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "messages": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/InAppMessages"
            }
          }
        }
      },
      "InAppTemplateResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/InAppTemplate"
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
      "InAppTemplatesPaginated": {
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
              "$ref": "#/components/schemas/InAppTemplate"
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
      "MarketingCreateContentBlocksRequestDto": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "nullable": true
          },
          "tags": {
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "content": {
            "type": "string",
            "nullable": true
          },
          "type": {
            "description": "Stackone enum identifying the type of content block.",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ContentBlockTypeEnumApiModel"
              }
            ]
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
      "MarketingCreateEmailTemplateRequestDto": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "nullable": true
          },
          "tags": {
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "messages": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/EmailMessages"
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
      "MarketingCreateInAppTemplateRequestDto": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "nullable": true
          },
          "tags": {
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "messages": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/InAppMessages"
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
      "MarketingCreatePushTemplateRequestDto": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "nullable": true
          },
          "tags": {
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "messages": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PushMessages"
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
      "MarketingCreateSmsTemplateRequestDto": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "nullable": true
          },
          "tags": {
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "messages": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/SmsMessages"
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
      "MarketingCreateTemplateRequestDto": {
        "type": "object",
        "properties": {
          "messages": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CreateMessage"
            }
          },
          "name": {
            "type": "string",
            "nullable": true
          },
          "tags": {
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
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
      "Message": {
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
          "message_type": {
            "description": "Stackone enum identifying the type of message associated with the content.",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/MessageTypeEnum"
              }
            ]
          },
          "message_content": {
            "oneOf": [
              {
                "$ref": "#/components/schemas/SmsMessageContents"
              },
              {
                "$ref": "#/components/schemas/EmailMessageContents"
              },
              {
                "$ref": "#/components/schemas/PushMessageContents"
              }
            ],
            "nullable": true
          }
        }
      },
      "MessageTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "email",
              "sms",
              "push",
              "web_push",
              "ios_push",
              "android_push",
              "app_push",
              "omni_channel",
              "content_block",
              "in_app",
              "unknown",
              "unmapped_value",
              null
            ],
            "description": "The unified message type.",
            "example": "email",
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
            "description": "The original value from the provider used to derive the unified message type.",
            "example": "Email",
            "nullable": true
          }
        }
      },
      "PushMessageContents": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "nullable": true
          },
          "subtitle": {
            "type": "string",
            "nullable": true
          },
          "body": {
            "type": "string",
            "nullable": true
          }
        }
      },
      "PushMessages": {
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
          "message_type": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/MessageTypeEnum"
              }
            ]
          },
          "message_content": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/PushMessageContents"
              }
            ]
          }
        }
      },
      "PushTemplate": {
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
          "tags": {
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "created_at": {
            "type": "string",
            "description": "Date of creation",
            "example": "2021-01-01T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "Date of last update",
            "example": "2021-01-01T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "messages": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PushMessages"
            }
          }
        }
      },
      "PushTemplateResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/PushTemplate"
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
      "PushTemplatesPaginated": {
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
              "$ref": "#/components/schemas/PushTemplate"
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
      },
      "ScheduleTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "immediate",
              "scheduled",
              "recurring",
              "custom",
              "triggered",
              null
            ],
            "description": "The schedule type of the campaign.",
            "example": "immediate",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the schedule type.",
            "example": "Immediate",
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
      "SmsMessageContents": {
        "type": "object",
        "properties": {
          "body": {
            "type": "string",
            "nullable": true
          },
          "from": {
            "type": "string",
            "nullable": true
          }
        }
      },
      "SmsMessages": {
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
          "message_type": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/MessageTypeEnum"
              }
            ]
          },
          "message_content": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/SmsMessageContents"
              }
            ]
          }
        }
      },
      "SmsTemplate": {
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
          "tags": {
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "created_at": {
            "type": "string",
            "description": "Date of creation",
            "example": "2021-01-01T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "Date of last update",
            "example": "2021-01-01T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "messages": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/SmsMessages"
            }
          }
        }
      },
      "SmsTemplateResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/SmsTemplate"
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
      "SmsTemplatesPaginated": {
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
              "$ref": "#/components/schemas/SmsTemplate"
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
      "StatusEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "draft",
              "archived",
              "live",
              null
            ],
            "description": "The Status of the campaign.",
            "example": "email",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the Status.",
            "example": "Email",
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
      "Template": {
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
          "tags": {
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "created_at": {
            "type": "string",
            "description": "Date of creation",
            "example": "2021-01-01T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "Date of last update",
            "example": "2021-01-01T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "TemplateResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/Template"
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
      "TemplatesPaginated": {
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
              "$ref": "#/components/schemas/Template"
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
      }
    }
  }
} as const;
