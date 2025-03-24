// Generated OpenAPI specification for hris
export const hrisSpec = {
  "openapi": "3.1.0",
  "paths": {
    "/unified/hris/companies": {
      "get": {
        "operationId": "hris_list_companies",
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
              "example": "id,remote_id,name,full_name,display_name,created_at,updated_at",
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
            "description": "The list of Companies was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CompaniesPaginated"
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
        "summary": "List Companies",
        "tags": [
          "Companies"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_companies",
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
    "/unified/hris/companies/{id}": {
      "get": {
        "operationId": "hris_get_company",
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
              "example": "id,remote_id,name,full_name,display_name,created_at,updated_at",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The Company with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CompanyResult"
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
        "summary": "Get Company",
        "tags": [
          "Companies"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_company",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/custom_field_definitions/employees": {
      "get": {
        "operationId": "hris_list_employee_custom_field_definitions",
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
            "description": "The list of employee custom field definitions was retrieved.",
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
        "summary": "List employee Custom Field Definitions",
        "tags": [
          "Custom Field Definitions"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_employee_custom_field_definitions",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/custom_field_definitions/employees/{id}": {
      "get": {
        "operationId": "hris_get_employee_custom_field_definition",
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
            "description": "The employee custom field definition was retrieved.",
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
        "summary": "Get employee Custom Field Definition",
        "tags": [
          "Custom Field Definitions"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_employee_custom_field_definition",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/employees": {
      "get": {
        "operationId": "hris_list_employees",
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
              "example": "id,remote_id,first_name,last_name,name,display_name,gender,ethnicity,date_of_birth,birthday,marital_status,avatar_url,avatar,personal_email,personal_phone_number,work_email,work_phone_number,job_id,remote_job_id,job_title,job_description,department_id,remote_department_id,department,cost_centers,benefits,company,manager_id,remote_manager_id,hire_date,start_date,tenure,work_anniversary,employment_type,employment_contract_type,employment_status,termination_date,company_name,company_id,remote_company_id,preferred_language,citizenships,home_location,work_location,employments,custom_fields,documents,created_at,updated_at,employee_number,national_identity_number,national_identity_numbers,skills",
              "type": "string"
            }
          },
          {
            "name": "filter",
            "required": false,
            "in": "query",
            "description": "HRIS Employees filters",
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
                },
                "email": {
                  "description": "Filter to select employees by email",
                  "type": "string",
                  "nullable": true
                },
                "employee_number": {
                  "description": "Filter to select employees by employee_number",
                  "type": "string",
                  "nullable": true
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
            "name": "expand",
            "required": false,
            "in": "query",
            "description": "The comma separated list of fields that will be expanded in the response",
            "schema": {
              "nullable": true,
              "example": "company,employments,work_location,home_location,groups,skills",
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
              "example": "avatar_url,avatar,custom_fields,job_description,benefits",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The list of employees was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/EmployeesPaginated"
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
        "summary": "List Employees",
        "tags": [
          "Employees"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_employees",
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
        },
        "x-speakeasy-usage-example": {
          "title": "List Employees",
          "position": 1
        }
      },
      "post": {
        "operationId": "hris_create_employee",
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
                "$ref": "#/components/schemas/HrisCreateEmployeeRequestDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "The employee was created successfully.",
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
        "summary": "Creates an employee",
        "tags": [
          "Employees"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "create_employee",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/employees/{id}": {
      "get": {
        "operationId": "hris_get_employee",
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
              "example": "id,remote_id,first_name,last_name,name,display_name,gender,ethnicity,date_of_birth,birthday,marital_status,avatar_url,avatar,personal_email,personal_phone_number,work_email,work_phone_number,job_id,remote_job_id,job_title,job_description,department_id,remote_department_id,department,cost_centers,benefits,company,manager_id,remote_manager_id,hire_date,start_date,tenure,work_anniversary,employment_type,employment_contract_type,employment_status,termination_date,company_name,company_id,remote_company_id,preferred_language,citizenships,home_location,work_location,employments,custom_fields,documents,created_at,updated_at,employee_number,national_identity_number,national_identity_numbers,skills",
              "type": "string"
            }
          },
          {
            "name": "expand",
            "required": false,
            "in": "query",
            "description": "The comma separated list of fields that will be expanded in the response",
            "schema": {
              "nullable": true,
              "example": "company,employments,work_location,home_location,groups,skills",
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
              "example": "avatar_url,avatar,custom_fields,job_description,benefits",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The employee with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/EmployeeResult"
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
        "summary": "Get Employee",
        "tags": [
          "Employees"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_employee",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      },
      "patch": {
        "operationId": "hris_update_employee",
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
                "$ref": "#/components/schemas/HrisUpdateEmployeeRequestDto"
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
                  "$ref": "#/components/schemas/UpdateEmployeeApiModel"
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
        "summary": "Updates an employee",
        "tags": [
          "Employees"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "update_employee",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/employees/{id}/invite": {
      "post": {
        "operationId": "hris_invite_employee",
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
                "$ref": "#/components/schemas/HrisInviteEmployeeRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Record invited successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/InviteEmployeeResult"
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
        "summary": "Invite Employee",
        "tags": [
          "Employees"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "invite_employee",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/employees/{id}/time_off": {
      "get": {
        "operationId": "hris_list_employee_time_off_requests",
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
              "example": "id,remote_id,employee_id,remote_employee_id,approver_id,remote_approver_id,status,type,start_date,end_date,start_half_day,end_half_day,duration,time_off_policy_id,remote_time_off_policy_id,reason,created_at,updated_at",
              "type": "string"
            }
          },
          {
            "name": "filter",
            "required": false,
            "in": "query",
            "description": "HRIS Time Off filters",
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
                },
                "type_ids": {
                  "description": "List of time off type ids to filter by.",
                  "nullable": true,
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
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
            "description": "The time off requests related to the employee with the given identifier were retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/TimeOffPaginated"
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
        "summary": "List Employee Time Off Requests",
        "tags": [
          "Employees",
          "Time Off"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_employee_time_off_requests",
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
        "operationId": "hris_create_employee_time_off_request",
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
                "$ref": "#/components/schemas/HrisCreateTimeOffRequestDto"
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
        "summary": "Create Employee Time Off Request",
        "tags": [
          "Employees",
          "Time Off"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "create_employee_time_off_request",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/employees/{id}/time_off/{subResourceId}": {
      "get": {
        "operationId": "hris_get_employees_time_off_request",
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
            "name": "subResourceId",
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
              "example": "id,remote_id,employee_id,remote_employee_id,approver_id,remote_approver_id,status,type,start_date,end_date,start_half_day,end_half_day,duration,time_off_policy_id,remote_time_off_policy_id,reason,created_at,updated_at",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The time off request related to the employee with the given identifiers was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/TimeOffResult"
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
        "summary": "Get Employees Time Off Request",
        "tags": [
          "Employees",
          "Time Off"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_employees_time_off_request",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      },
      "patch": {
        "operationId": "hris_update_employee_time_off_request",
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
            "name": "subResourceId",
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
                "$ref": "#/components/schemas/HrisCreateTimeOffRequestDto"
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
        "summary": "Update Employee Time Off Request",
        "tags": [
          "Employees",
          "Time Off"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "update_employee_time_off_request",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/employees/{id}/documents/upload/batch": {
      "post": {
        "operationId": "hris_batch_upload_employee_document",
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
                "$ref": "#/components/schemas/HrisBatchDocumentUploadRequestDto"
              }
            }
          }
        },
        "responses": {
          "202": {
            "description": "Batch operation accepted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/BatchResultApiModel"
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
        "summary": "Batch Upload Employee Document",
        "tags": [
          "Employees",
          "Documents"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "batch_upload_employee_document",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/employees/{id}/documents/upload": {
      "post": {
        "operationId": "hris_upload_employee_document",
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
                "$ref": "#/components/schemas/HrisDocumentsUploadRequestDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "The document related to the employee with the given identifier was uploaded.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/WriteResultApiModel"
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
        "summary": "Upload Employee Document",
        "tags": [
          "Employees",
          "Documents"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "upload_employee_document",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/employees/{id}/documents/{subResourceId}/download": {
      "get": {
        "operationId": "hris_download_employee_document",
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
            "name": "subResourceId",
            "required": true,
            "in": "path",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "format",
            "required": false,
            "in": "query",
            "description": "The format to download the file in",
            "schema": {
              "nullable": true,
              "example": "base64",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The document related to the employee with the given identifiers was retrieved.",
            "content": {
              "application/octet-stream": {
                "schema": {
                  "type": "string",
                  "format": "binary"
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
        "summary": "Download Employee Document",
        "tags": [
          "Employees",
          "Documents"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "download_employee_document",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/employees/{id}/documents": {
      "get": {
        "operationId": "hris_list_employee_documents",
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
              "example": "id,remote_id,name,path,type,category,category_id,remote_category_id,contents,created_at,updated_at,remote_url,file_format",
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
            "description": "The documents related to the employee with the given identifier were retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HrisDocumentsPaginated"
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
        "summary": "List Employee Documents",
        "tags": [
          "Employees",
          "Documents"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_employee_documents",
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
    "/unified/hris/employees/{id}/documents/{subResourceId}": {
      "get": {
        "operationId": "hris_get_employee_document",
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
            "name": "subResourceId",
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
              "example": "id,remote_id,name,path,type,category,category_id,remote_category_id,contents,created_at,updated_at,remote_url,file_format",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The document related to the employee with the given identifiers was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HrisDocumentResult"
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
        "summary": "Get Employee Document",
        "tags": [
          "Employees",
          "Documents"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_employee_document",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/documents/employee_categories": {
      "get": {
        "operationId": "hris_list_employee_categories",
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
              "example": "id,remote_id,name,active",
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
            "description": "The list of employee document categories were retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ReferencePaginated"
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
        "summary": "List Employee Document Categories",
        "tags": [
          "Documents"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_employee_categories",
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
    "/unified/hris/documents/employee_categories/{id}": {
      "get": {
        "operationId": "hris_get_employee_document_category",
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
              "example": "id,remote_id,name,active",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The employee document category with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ReferenceResult"
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
        "summary": "Get Employee Document Category",
        "tags": [
          "Documents"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_employee_document_category",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/employees/{id}/work_eligibility": {
      "get": {
        "operationId": "hris_list_employee_work_eligibility",
        "parameters": [
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
              "example": "id,remote_id,type,sub_type,document,valid_from,valid_to,issued_by,number",
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
            "name": "x-account-id",
            "in": "header",
            "description": "The account identifier",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The work eligibility of the employee with the given identifier were retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/WorkEligibilityPaginated"
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
        "summary": "List Employee Work Eligibility",
        "tags": [
          "Employees",
          "Work Eligibility"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_employee_work_eligibility",
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
        "operationId": "hris_create_employee_work_eligibility_request",
        "parameters": [
          {
            "name": "id",
            "required": true,
            "in": "path",
            "schema": {
              "type": "string"
            }
          },
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
                "$ref": "#/components/schemas/HrisCreateWorkEligibilityRequestDto"
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
        "summary": "Create Employee Work Eligibility Request",
        "tags": [
          "Employees",
          "Work Eligibility"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "create_employee_work_eligibility_request",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/employees/{id}/work_eligibility/{subResourceId}": {
      "get": {
        "operationId": "hris_get_employees_work_eligibility",
        "parameters": [
          {
            "name": "id",
            "required": true,
            "in": "path",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "subResourceId",
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
              "example": "id,remote_id,type,sub_type,document,valid_from,valid_to,issued_by,number",
              "type": "string"
            }
          },
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
        "responses": {
          "200": {
            "description": "The work eligibility of the employee with the given identifiers was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/WorkEligibilityResult"
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
        "summary": "Get Employees Work Eligibility",
        "tags": [
          "Employees",
          "Work Eligibility"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_employees_work_eligibility",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      },
      "patch": {
        "operationId": "hris_update_employee_work_eligibility_request",
        "parameters": [
          {
            "name": "id",
            "required": true,
            "in": "path",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "subResourceId",
            "required": true,
            "in": "path",
            "schema": {
              "type": "string"
            }
          },
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
                "$ref": "#/components/schemas/HrisCreateWorkEligibilityRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": ""
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
        "summary": "Update Employee Work Eligibility Request",
        "tags": [
          "Employees",
          "Work Eligibility"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "update_employee_work_eligibility_request",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/employees/{id}/time_off_balances": {
      "get": {
        "operationId": "hris_list_employee_time_off_balances",
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
              "example": "id,remote_id,employee_id,remote_employee_id,policy_id,remote_policy_id,policy,current_balance,initial_balance,balance_unit,balance_start_date,balance_expiry_date,updated_at",
              "type": "string"
            }
          },
          {
            "name": "filter",
            "required": false,
            "in": "query",
            "description": "HRIS Time Off Balance filters",
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
                },
                "policy_ids": {
                  "description": "List of policy ids to filter time off balances by.",
                  "type": "array",
                  "nullable": true,
                  "items": {
                    "type": "string"
                  },
                  "additionalProperties": false,
                  "required": false
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
            "name": "expand",
            "required": false,
            "in": "query",
            "description": "The comma separated list of fields that will be expanded in the response",
            "schema": {
              "nullable": true,
              "example": "policy",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The list of time off balances of the employee with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/TimeOffBalancesPaginated"
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
        "summary": "List Employee Time Off Balances",
        "tags": [
          "Employees",
          "Time Off Balances"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_employee_time_off_balances",
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
    "/unified/hris/employees/{id}/time_off_balances/{subResourceId}": {
      "get": {
        "operationId": "hris_get_employee_time_off_balance",
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
            "name": "subResourceId",
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
              "example": "id,remote_id,employee_id,remote_employee_id,policy_id,remote_policy_id,policy,current_balance,initial_balance,balance_unit,balance_start_date,balance_expiry_date,updated_at",
              "type": "string"
            }
          },
          {
            "name": "expand",
            "required": false,
            "in": "query",
            "description": "The comma separated list of fields that will be expanded in the response",
            "schema": {
              "nullable": true,
              "example": "policy",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The time off balance of the employee with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/TimeOffBalanceResult"
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
        "summary": "Get Employee Time Off Balance",
        "tags": [
          "Employees",
          "Time Off Balances"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_employee_time_off_balance",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/employments": {
      "get": {
        "operationId": "hris_list_employments",
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
              "example": "id,remote_id,employee_id,remote_employee_id,job_title,pay_rate,pay_period,pay_frequency,pay_currency,effective_date,employment_type,employment_contract_type,time_worked,created_at,updated_at,start_date,end_date,active,department,team,cost_center,cost_centers,division,job,type,contract_type,manager",
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
            "name": "expand",
            "required": false,
            "in": "query",
            "description": "The comma separated list of fields that will be expanded in the response",
            "schema": {
              "nullable": true,
              "example": "groups",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The list of Employments was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/EmploymentsPaginated"
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
        "summary": "List Employments",
        "tags": [
          "Employments"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_employments",
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
    "/unified/hris/employments/{id}": {
      "get": {
        "operationId": "hris_get_employment",
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
              "example": "id,remote_id,employee_id,remote_employee_id,job_title,pay_rate,pay_period,pay_frequency,pay_currency,effective_date,employment_type,employment_contract_type,time_worked,created_at,updated_at,start_date,end_date,active,department,team,cost_center,cost_centers,division,job,type,contract_type,manager",
              "type": "string"
            }
          },
          {
            "name": "expand",
            "required": false,
            "in": "query",
            "description": "The comma separated list of fields that will be expanded in the response",
            "schema": {
              "nullable": true,
              "example": "groups",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The Employment with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/EmploymentResult"
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
        "summary": "Get Employment",
        "tags": [
          "Employments"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_employment",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/employees/{id}/employments": {
      "get": {
        "operationId": "hris_list_employee_employments",
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
              "example": "id,remote_id,employee_id,remote_employee_id,job_title,pay_rate,pay_period,pay_frequency,pay_currency,effective_date,employment_type,employment_contract_type,time_worked,created_at,updated_at,start_date,end_date,active,department,team,cost_center,cost_centers,division,job,type,contract_type,manager",
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
            "name": "expand",
            "required": false,
            "in": "query",
            "description": "The comma separated list of fields that will be expanded in the response",
            "schema": {
              "nullable": true,
              "example": "groups",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The list of Employee Employments was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/EmploymentsPaginated"
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
        "summary": "List Employee Employments",
        "tags": [
          "Employees",
          "Employments"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_employee_employments",
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
        "operationId": "hris_create_employee_employment",
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
                "$ref": "#/components/schemas/HrisCreateEmploymentRequestDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "The employee employment was created successfully.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/EmploymentResult"
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
        "summary": "Create Employee Employment",
        "tags": [
          "Employees",
          "Employments"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "create_employee_employment",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/employees/{id}/employments/{subResourceId}": {
      "get": {
        "operationId": "hris_get_employee_employment",
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
            "name": "subResourceId",
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
              "example": "id,remote_id,employee_id,remote_employee_id,job_title,pay_rate,pay_period,pay_frequency,pay_currency,effective_date,employment_type,employment_contract_type,time_worked,created_at,updated_at,start_date,end_date,active,department,team,cost_center,cost_centers,division,job,type,contract_type,manager",
              "type": "string"
            }
          },
          {
            "name": "expand",
            "required": false,
            "in": "query",
            "description": "The comma separated list of fields that will be expanded in the response",
            "schema": {
              "nullable": true,
              "example": "groups",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The Employee Employment with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/EmploymentResult"
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
        "summary": "Get Employee Employment",
        "tags": [
          "Employees",
          "Employments"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_employee_employment",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      },
      "patch": {
        "operationId": "hris_update_employee_employment",
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
            "name": "subResourceId",
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
                "$ref": "#/components/schemas/HrisCreateEmploymentRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "The employee employment was updated successfully.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/EmploymentResult"
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
        "summary": "Update Employee Employment",
        "tags": [
          "Employees",
          "Employments"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "update_employee_employment",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/locations": {
      "get": {
        "operationId": "hris_list_locations",
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
              "example": "id,remote_id,employee_id,remote_employee_id,name,phone_number,street_1,street_2,city,state,zip_code,country,location_type,created_at,updated_at",
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
            "description": "The list of work locations was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HRISLocationsPaginated"
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
        "summary": "List Work Locations",
        "tags": [
          "Locations"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_locations",
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
    "/unified/hris/locations/{id}": {
      "get": {
        "operationId": "hris_get_location",
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
              "example": "id,remote_id,employee_id,remote_employee_id,name,phone_number,street_1,street_2,city,state,zip_code,country,location_type,created_at,updated_at",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The work location with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HRISLocationResult"
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
        "summary": "Get Work Location",
        "tags": [
          "Locations"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_location",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/time_off": {
      "get": {
        "operationId": "hris_list_time_off_requests",
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
              "example": "id,remote_id,employee_id,remote_employee_id,approver_id,remote_approver_id,status,type,start_date,end_date,start_half_day,end_half_day,duration,time_off_policy_id,remote_time_off_policy_id,reason,created_at,updated_at",
              "type": "string"
            }
          },
          {
            "name": "filter",
            "required": false,
            "in": "query",
            "description": "HRIS Time Off filters",
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
                },
                "type_ids": {
                  "description": "List of time off type ids to filter by.",
                  "nullable": true,
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
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
            "description": "The list of time off requests was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/TimeOffPaginated"
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
        "summary": "List time off requests",
        "tags": [
          "Time Off"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_time_off_requests",
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
        "operationId": "hris_create_time_off_request",
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
                "$ref": "#/components/schemas/HrisCreateTimeOffRequestDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "The time off request was created successfully.",
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
        "summary": "Creates a time off request",
        "tags": [
          "Time Off"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "create_time_off_request",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/time_off/{id}": {
      "get": {
        "operationId": "hris_get_time_off_request",
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
              "example": "id,remote_id,employee_id,remote_employee_id,approver_id,remote_approver_id,status,type,start_date,end_date,start_half_day,end_half_day,duration,time_off_policy_id,remote_time_off_policy_id,reason,created_at,updated_at",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The time off request with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/TimeOffResult"
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
        "summary": "Get time off request",
        "tags": [
          "Time Off"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_time_off_request",
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
        "operationId": "hris_update_time_off_request",
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
                "$ref": "#/components/schemas/HrisCreateTimeOffRequestDto"
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
        "summary": "Update time off request",
        "tags": [
          "Time Off"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "update_time_off_request",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/time_off_types": {
      "get": {
        "deprecated": true,
        "operationId": "hris_list_time_off_types",
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
              "example": "id,remote_id,name,active",
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
            "description": "The list of time off types was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ReferencePaginated"
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
        "summary": "List time off types",
        "tags": [
          "Time Off"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_time_off_types",
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
    "/unified/hris/time_off_types/{id}": {
      "get": {
        "deprecated": true,
        "operationId": "hris_get_time_off_type",
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
              "example": "id,remote_id,name,active",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The time off type with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ReferenceResult"
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
        "summary": "Get time off type",
        "tags": [
          "Time Off"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_time_off_type",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/time_entries": {
      "get": {
        "operationId": "hris_list_time_entries",
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
              "example": "id,remote_id,employee_id,remote_employee_id,start_time,end_time,hours_worked,break_duration,labor_type,location,status,created_at,updated_at",
              "type": "string"
            }
          },
          {
            "name": "filter",
            "required": false,
            "in": "query",
            "description": "HRIS Time Entries filters",
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
                },
                "employee_id": {
                  "description": "Filter to select time entries by employee_id",
                  "type": "string",
                  "nullable": true,
                  "additionalProperties": false
                },
                "start_time": {
                  "description": "Filter to select time entries after a given time",
                  "example": "2020-01-01T00:00:00.000Z",
                  "type": "string",
                  "nullable": true,
                  "additionalProperties": false
                },
                "end_time": {
                  "description": "Filter to select time entries before a given time",
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
            "description": "The list of time entries was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/TimeEntriesPaginated"
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
        "summary": "List Time Entries",
        "tags": [
          "Time Entries"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_time_entries",
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
    "/unified/hris/time_entries/{id}": {
      "get": {
        "operationId": "hris_get_time_entries",
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
              "example": "id,remote_id,employee_id,remote_employee_id,start_time,end_time,hours_worked,break_duration,labor_type,location,status,created_at,updated_at",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The time entry with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/TimeEntriesResult"
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
        "summary": "Get Time Entry",
        "tags": [
          "Time Entries"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_time_entries",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/benefits": {
      "get": {
        "operationId": "hris_list_benefits",
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
              "example": "id,remote_id,name,benefit_type,provider,description,created_at,updated_at",
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
            "description": "The list of Benefits was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HRISBenefitsPaginated"
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
        "summary": "List benefits",
        "tags": [
          "Benefits"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_benefits",
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
    "/unified/hris/benefits/{id}": {
      "get": {
        "operationId": "hris_get_benefit",
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
              "example": "id,remote_id,name,benefit_type,provider,description,created_at,updated_at",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The Benefit with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HRISBenefitResult"
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
        "summary": "Get Benefit",
        "tags": [
          "Benefits"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_benefit",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/groups": {
      "get": {
        "operationId": "hris_list_groups",
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
              "example": "id,remote_id,name,type,parent_ids,remote_parent_ids,owner_ids,remote_owner_ids",
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
            "description": "The list of groups was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HRISGroupsPaginated"
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
        "summary": "List Groups",
        "tags": [
          "Groups"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_groups",
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
    "/unified/hris/groups/departments": {
      "get": {
        "operationId": "hris_list_department_groups",
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
              "example": "id,remote_id,name",
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
            "description": "The list of department groups was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HRISDepartmentsPaginated"
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
        "summary": "List Department Groups",
        "tags": [
          "Groups"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_department_groups",
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
    "/unified/hris/groups/cost_centers": {
      "get": {
        "operationId": "hris_list_cost_center_groups",
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
              "example": "id,remote_id,name,type,distribution_percentage,parent_ids,remote_parent_ids,owner_ids,remote_owner_ids",
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
            "description": "The list of cost center groups was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HRISCostCenterPaginated"
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
        "summary": "List Cost Center Groups",
        "tags": [
          "Groups"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_cost_center_groups",
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
    "/unified/hris/groups/teams": {
      "get": {
        "operationId": "hris_list_team_groups",
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
              "example": "id,remote_id,name,type,parent_ids,remote_parent_ids,owner_ids,remote_owner_ids",
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
            "description": "The list of team groups was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HRISTeamsPaginated"
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
        "summary": "List Team Groups",
        "tags": [
          "Groups"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_team_groups",
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
    "/unified/hris/groups/{id}": {
      "get": {
        "operationId": "hris_get_group",
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
              "example": "id,remote_id,name,type,parent_ids,remote_parent_ids,owner_ids,remote_owner_ids",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The group with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HRISGroupsResult"
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
        "summary": "Get Group",
        "tags": [
          "Groups"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_group",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/groups/departments/{id}": {
      "get": {
        "operationId": "hris_get_department_group",
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
              "example": "id,remote_id,name",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The department group with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HRISDepartmentsResult"
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
        "summary": "Get Department Group",
        "tags": [
          "Groups"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_department_group",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/groups/cost_centers/{id}": {
      "get": {
        "operationId": "hris_get_cost_center_group",
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
              "example": "id,remote_id,name,type,distribution_percentage,parent_ids,remote_parent_ids,owner_ids,remote_owner_ids",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The cost center group with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HRISCostCenterResult"
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
        "summary": "Get Cost Center Group",
        "tags": [
          "Groups"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_cost_center_group",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/groups/teams/{id}": {
      "get": {
        "operationId": "hris_get_team_group",
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
              "example": "id,remote_id,name,type,parent_ids,remote_parent_ids,owner_ids,remote_owner_ids",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The team group with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HRISTeamsResult"
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
        "summary": "Get Team Group",
        "tags": [
          "Groups"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_team_group",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/jobs": {
      "get": {
        "operationId": "hris_list_jobs",
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
              "example": "id,remote_id,name,type,parent_ids,remote_parent_ids,owner_ids,remote_owner_ids",
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
            "description": "The list of jobs was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/JobsPaginated"
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
        "summary": "List Jobs",
        "tags": [
          "Jobs"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_jobs",
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
    "/unified/hris/jobs/{id}": {
      "get": {
        "operationId": "hris_get_job",
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
              "example": "id,remote_id,name,type,parent_ids,remote_parent_ids,owner_ids,remote_owner_ids",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The job with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/JobResult"
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
        "summary": "Get Job",
        "tags": [
          "Jobs"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_job",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/employees/{id}/skills": {
      "get": {
        "operationId": "hris_list_employee_skills",
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
              "example": "id,remote_id,name,active,language,maximum_proficiency,minimum_proficiency",
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
            "description": "The skills related to the employee with the given identifier were retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/EntitySkillsPaginated"
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
        "summary": "List Employee Skills",
        "tags": [
          "Employees",
          "Skills"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_employee_skills",
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
        "operationId": "hris_create_employee_skill",
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
                "$ref": "#/components/schemas/EntitySkillsCreateRequestDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "The skill was created successfully.",
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
        "summary": "Create Employee Skill",
        "tags": [
          "Employees",
          "Skills"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "create_employee_skill",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/employees/{id}/skills/{subResourceId}": {
      "get": {
        "operationId": "hris_get_employee_skill",
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
            "name": "subResourceId",
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
              "example": "id,remote_id,name,active,language,maximum_proficiency,minimum_proficiency",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The skill related to the employee with the given identifiers was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/EntitySkillResult"
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
        "summary": "Get Employee Skill",
        "tags": [
          "Employees",
          "Skills"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_employee_skill",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/hris/time_off_policies": {
      "get": {
        "operationId": "hris_list_time_off_policies",
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
              "example": "id,remote_id,name,description,type,duration_unit,reasons,updated_at,created_at",
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
            "description": "The list of time off policies was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/TimeOffPoliciesPaginated"
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
        "summary": "List Time Off Policies",
        "tags": [
          "Time Off Policies"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "list_time_off_policies",
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
    "/unified/hris/time_off_policies/{id}": {
      "get": {
        "operationId": "hris_get_time_off_policy",
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
              "example": "id,remote_id,name,description,type,duration_unit,reasons,updated_at,created_at",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The time off policy with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/TimeOffPolicyResult"
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
        "summary": "Get Time Off Policy",
        "tags": [
          "Time Off Policies"
        ],
        "x-speakeasy-group": "hris",
        "x-speakeasy-name-override": "get_time_off_policy",
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
    "title": "HRIS",
    "description": "The documentation for the StackOne Unified API - HRIS",
    "version": "1.0.0",
    "contact": {}
  },
  "tags": [
    {
      "name": "Benefits",
      "description": ""
    },
    {
      "name": "Companies",
      "description": ""
    },
    {
      "name": "Custom Field Definitions",
      "description": ""
    },
    {
      "name": "Documents",
      "description": ""
    },
    {
      "name": "Employees",
      "description": ""
    },
    {
      "name": "Employments",
      "description": ""
    },
    {
      "name": "Groups",
      "description": ""
    },
    {
      "name": "Jobs",
      "description": ""
    },
    {
      "name": "Locations",
      "description": ""
    },
    {
      "name": "Skills",
      "description": ""
    },
    {
      "name": "Time Entries",
      "description": ""
    },
    {
      "name": "Time Off",
      "description": ""
    },
    {
      "name": "Time Off Balances",
      "description": ""
    },
    {
      "name": "Time Off Policies",
      "description": ""
    },
    {
      "name": "Work Eligibility",
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
      "BatchResultApiModel": {
        "type": "object",
        "properties": {
          "statusCode": {
            "type": "number",
            "example": 202,
            "nullable": true
          },
          "message": {
            "type": "string",
            "example": "Batch operation accepted",
            "nullable": true
          },
          "timestamp": {
            "type": "string",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "errors": {
            "type": "array",
            "example": [
              [
                "Missing field: name"
              ],
              [],
              []
            ],
            "items": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "nullable": true
          }
        }
      },
      "BenefitsTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "description": "The type of the benefit",
            "enum": [
              "retirement_savings",
              "health_savings",
              "other",
              "health_insurance",
              "insurance",
              "unmapped_value",
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
      "CompaniesPaginated": {
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
              "$ref": "#/components/schemas/Company"
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
      "Company": {
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
            "description": "The name of the company",
            "example": "StackOne Technologies PLC",
            "nullable": true
          },
          "full_name": {
            "type": "string",
            "description": "The full name of the company",
            "example": "American Express Company",
            "nullable": true
          },
          "display_name": {
            "type": "string",
            "description": "The display name of the company",
            "example": "StackOne",
            "nullable": true
          },
          "created_at": {
            "type": "string",
            "description": "The created_at date",
            "example": "2023-02-23T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "The updated_at date",
            "example": "2024-02-23T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "CompanyResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/Company"
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
      "ConfidentialEnumApiModel": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "description": "Whether the file is confidential or not",
            "enum": [
              "true",
              "false",
              null
            ],
            "example": "true",
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
            "example": "public",
            "nullable": true
          }
        }
      },
      "Content": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string",
            "description": "URL where the file content is located",
            "example": "https://example.com/file.pdf",
            "nullable": true
          },
          "unified_url": {
            "type": "string",
            "description": "Unified download URL for retrieving file content.",
            "example": "https://api.stackone.com/unified/hris/employees/12345/documents/67890/download",
            "nullable": true
          },
          "file_format": {
            "description": "The file format of the file",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/FileFormatEnum"
              }
            ]
          }
        }
      },
      "ContractTypeApiModel": {
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
          "label": {
            "type": "string",
            "description": "The label of the employment type",
            "example": "Full-Time",
            "nullable": true
          },
          "contract_type": {
            "description": "The employment work schedule type (e.g., full-time, part-time)",
            "example": "full_time",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ContractTypeEnum"
              }
            ]
          }
        }
      },
      "ContractTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "full_time",
              "shifts",
              "part_time",
              "unmapped_value",
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
      "CostCenters": {
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
            "example": "R&D",
            "nullable": true
          },
          "distribution_percentage": {
            "type": "number",
            "example": 100,
            "nullable": true
          }
        }
      },
      "CountryCodeEnum": {
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
              "unmapped_value",
              null
            ],
            "description": "The ISO3166-1 Alpha2 Code of the Country",
            "example": "US",
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
      "CreateCostCenterApiModel": {
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
            "example": "R&D",
            "nullable": true
          },
          "distribution_percentage": {
            "type": "number",
            "example": 100,
            "nullable": true
          }
        }
      },
      "CreateEmployeeLocationApiModel": {
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
            "description": "The name of the location",
            "example": "Woolsthorpe Manor",
            "nullable": true
          },
          "phone_number": {
            "type": "string",
            "description": "The phone number of the location",
            "example": "+44 1476 860 364",
            "nullable": true
          },
          "street_1": {
            "type": "string",
            "description": "The first line of the address",
            "example": "Water Lane",
            "nullable": true
          },
          "street_2": {
            "type": "string",
            "description": "The second line of the address",
            "example": "Woolsthorpe by Colsterworth",
            "nullable": true
          },
          "city": {
            "type": "string",
            "description": "The city where the location is situated",
            "example": "Grantham",
            "nullable": true
          },
          "zip_code": {
            "type": "string",
            "description": "The ZIP code/Postal code of the location",
            "example": "NG33 5NR",
            "nullable": true
          },
          "country": {
            "description": "The country code",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/CountryCodeEnum"
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
          },
          "state": {
            "description": "The ISO3166-2 sub division where the location is situated",
            "example": "GB-LIN",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ISO3166_2SubDivisionEnum"
              }
            ]
          }
        }
      },
      "CreateEmploymentApiModel": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier",
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
          "job_title": {
            "type": "string",
            "description": "The job title of the employee",
            "example": "Software Engineer",
            "nullable": true
          },
          "pay_rate": {
            "type": "string",
            "description": "The pay rate for the employee",
            "example": "40.00",
            "nullable": true
          },
          "pay_period": {
            "description": "The pay period",
            "example": "monthly",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/PayPeriodEnum"
              }
            ]
          },
          "pay_frequency": {
            "description": "The pay frequency",
            "example": "hourly",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/PayFrequencyEnum"
              }
            ]
          },
          "pay_currency": {
            "type": "string",
            "description": "The currency used for pay",
            "example": "USD",
            "nullable": true
          },
          "effective_date": {
            "type": "string",
            "description": "The effective date of the employment contract",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "deprecated": true,
            "nullable": true
          },
          "employment_type": {
            "description": "The type of employment (e.g., contractor, permanent)",
            "example": "permanent",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmploymentTypeEnum"
              }
            ]
          },
          "employment_contract_type": {
            "description": "The employment work schedule type (e.g., full-time, part-time)",
            "example": "full_time",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmploymentScheduleTypeEnum"
              }
            ]
          },
          "time_worked": {
            "type": "string",
            "description": "The time worked for the employee in ISO 8601 duration format",
            "example": "P0Y0M0DT8H0M0S",
            "format": "duration",
            "nullable": true
          }
        }
      },
      "CreateHRISBenefit": {
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
            "description": "The name of the benefit",
            "example": "Health Insurance",
            "nullable": true
          },
          "benefit_type": {
            "description": "The type of the benefit",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/BenefitsTypeEnum"
              }
            ]
          },
          "provider": {
            "type": "string",
            "description": "The provider of the benefit",
            "example": "Aetna",
            "nullable": true
          },
          "description": {
            "type": "string",
            "description": "The description of the benefit",
            "example": "Health insurance for employees",
            "nullable": true
          },
          "created_at": {
            "type": "string",
            "description": "The date and time the benefit was created",
            "example": "2021-01-01T00:00:00Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "The date and time the benefit was last updated",
            "example": "2021-01-01T00:00:00Z",
            "format": "date-time",
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
      "DepartmentTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "department",
              "company",
              "division",
              "group",
              "project",
              "team",
              null
            ],
            "example": "department",
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
      "Employee": {
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
            "description": "The employee first name",
            "example": "Isaac",
            "nullable": true
          },
          "last_name": {
            "type": "string",
            "description": "The employee last name",
            "example": "Newton",
            "nullable": true
          },
          "name": {
            "type": "string",
            "description": "The employee name",
            "example": "Isaac Newton",
            "nullable": true
          },
          "display_name": {
            "type": "string",
            "description": "The employee display name",
            "example": "Sir Isaac Newton",
            "nullable": true
          },
          "avatar_url": {
            "type": "string",
            "description": "The employee avatar Url",
            "example": "https://example.com/avatar.png",
            "nullable": true
          },
          "personal_email": {
            "type": "string",
            "description": "The employee personal email",
            "example": "isaac.newton@example.com",
            "nullable": true
          },
          "personal_phone_number": {
            "type": "string",
            "description": "The employee personal phone number",
            "example": "+1234567890",
            "nullable": true
          },
          "work_email": {
            "type": "string",
            "description": "The employee work email",
            "example": "newton@example.com",
            "nullable": true
          },
          "work_phone_number": {
            "type": "string",
            "description": "The employee work phone number",
            "example": "+1234567890",
            "nullable": true
          },
          "job_id": {
            "type": "string",
            "description": "The employee job id",
            "example": "5290",
            "deprecated": true,
            "nullable": true
          },
          "job_title": {
            "type": "string",
            "description": "The employee job title",
            "example": "Physicist",
            "deprecated": true,
            "nullable": true
          },
          "job_description": {
            "description": "The employee job description",
            "example": "Testing the laws of motion",
            "deprecated": true,
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/JobDescriptionApiModel"
              }
            ]
          },
          "department_id": {
            "type": "string",
            "description": "The employee department id",
            "example": "3093",
            "deprecated": true,
            "nullable": true
          },
          "department": {
            "type": "string",
            "description": "The employee department",
            "example": "Physics",
            "deprecated": true,
            "nullable": true
          },
          "groups": {
            "description": "The employee groups",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/HRISGroup"
            }
          },
          "cost_centers": {
            "description": "The employee cost centers",
            "deprecated": true,
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CostCenters"
            }
          },
          "manager_id": {
            "type": "string",
            "description": "The employee manager ID",
            "example": "67890",
            "deprecated": true,
            "nullable": true
          },
          "remote_manager_id": {
            "type": "string",
            "description": "Provider's unique identifier of the manager",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "gender": {
            "description": "The employee gender",
            "example": "male",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/GenderEnum"
              }
            ]
          },
          "preferred_language": {
            "description": "The employee preferred language",
            "example": "en_US",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/PreferredLanguageEnum"
              }
            ]
          },
          "ethnicity": {
            "description": "The employee ethnicity",
            "example": "white",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EthnicityEnum"
              }
            ]
          },
          "date_of_birth": {
            "type": "string",
            "description": "The employee date_of_birth",
            "example": "1990-01-01T00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "birthday": {
            "type": "string",
            "description": "The employee birthday",
            "example": "2021-01-01T00:00:00Z",
            "format": "date-time",
            "nullable": true
          },
          "marital_status": {
            "description": "The employee marital status",
            "example": "single",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/MaritalStatusEnum"
              }
            ]
          },
          "avatar": {
            "description": "The employee avatar",
            "example": "https://example.com/avatar.png",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/Image"
              }
            ]
          },
          "hire_date": {
            "type": "string",
            "description": "The employee hire date",
            "example": "2021-01-01T00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "start_date": {
            "type": "string",
            "description": "The employee start date",
            "example": "2021-01-01T00:00.000Z",
            "format": "date-time",
            "deprecated": true,
            "nullable": true
          },
          "tenure": {
            "type": "number",
            "description": "The employee tenure",
            "example": 2,
            "nullable": true
          },
          "work_anniversary": {
            "type": "string",
            "description": "The employee work anniversary",
            "example": "2021-01-01T00:00:00Z",
            "format": "date-time",
            "nullable": true
          },
          "employment_type": {
            "description": "The employee employment type",
            "example": "full_time",
            "deprecated": true,
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmploymentTypeEnum"
              }
            ]
          },
          "employment_contract_type": {
            "description": "The employment work schedule type (e.g., full-time, part-time)",
            "example": "full_time",
            "deprecated": true,
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmploymentScheduleTypeEnum"
              }
            ]
          },
          "employment_status": {
            "description": "The employee employment status",
            "example": "active",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmploymentStatusEnum"
              }
            ]
          },
          "termination_date": {
            "type": "string",
            "description": "The employee termination date",
            "example": "2021-01-01T00:00:00Z",
            "format": "date-time",
            "nullable": true
          },
          "company_name": {
            "type": "string",
            "description": "The employee company name",
            "example": "Example Corp",
            "deprecated": true,
            "nullable": true
          },
          "company_id": {
            "type": "string",
            "description": "The employee company id",
            "example": "1234567890",
            "nullable": true
          },
          "citizenships": {
            "description": "The citizenships of the Employee",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CountryCodeEnum"
            }
          },
          "home_location": {
            "description": "The employee home location",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/HRISLocation"
              }
            ]
          },
          "work_location": {
            "description": "The employee work location",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/HRISLocation"
              }
            ]
          },
          "company": {
            "description": "The employee company",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/Company"
              }
            ]
          },
          "employments": {
            "description": "The employee employments",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Employment"
            }
          },
          "custom_fields": {
            "description": "The employee custom fields",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CustomFields"
            }
          },
          "benefits": {
            "description": "Current benefits of the employee",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/HRISBenefit"
            }
          },
          "employee_number": {
            "type": "string",
            "description": "The assigned employee number",
            "example": "125",
            "nullable": true
          },
          "national_identity_number": {
            "description": "The national identity number",
            "deprecated": true,
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/NationalIdentityNumberApiModel"
              }
            ]
          },
          "national_identity_numbers": {
            "description": "The national identity numbers",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/NationalIdentityNumberApiModel"
            }
          },
          "skills": {
            "description": "The employee skills",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/EntitySkills"
            }
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
          }
        }
      },
      "EmployeeResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/Employee"
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
      "EmployeesPaginated": {
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
              "$ref": "#/components/schemas/Employee"
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
      "Employment": {
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
          "employee_id": {
            "type": "string",
            "description": "The employee ID associated with this employment",
            "example": "1687-3",
            "nullable": true
          },
          "remote_employee_id": {
            "type": "string",
            "description": "Provider's unique identifier of the employee associated with this employment",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "job_title": {
            "type": "string",
            "description": "The job title of the employee",
            "example": "Software Engineer",
            "deprecated": true,
            "nullable": true
          },
          "pay_rate": {
            "type": "string",
            "description": "The pay rate for the employee",
            "example": "40.00",
            "nullable": true
          },
          "pay_period": {
            "description": "The pay period",
            "example": "monthly",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/PayPeriodEnum"
              }
            ]
          },
          "pay_frequency": {
            "description": "The pay frequency",
            "example": "hourly",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/PayFrequencyEnum"
              }
            ]
          },
          "pay_currency": {
            "type": "string",
            "description": "The currency used for pay",
            "example": "USD",
            "nullable": true
          },
          "effective_date": {
            "type": "string",
            "description": "The effective date of the employment contract",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "employment_type": {
            "description": "The type of employment (e.g., contractor, permanent)",
            "example": "permanent",
            "deprecated": true,
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmploymentTypeEnum"
              }
            ]
          },
          "employment_contract_type": {
            "description": "The employment work schedule type (e.g., full-time, part-time)",
            "example": "full_time",
            "deprecated": true,
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmploymentScheduleTypeEnum"
              }
            ]
          },
          "time_worked": {
            "type": "string",
            "description": "The time worked for the employee in ISO 8601 duration format",
            "example": "P0Y0M0DT8H0M0S",
            "format": "duration",
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
          "start_date": {
            "type": "string",
            "description": "The start_date of employment",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "end_date": {
            "type": "string",
            "description": "The end_date of employment",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "active": {
            "type": "boolean",
            "description": "The employment active status",
            "example": true,
            "nullable": true
          },
          "department": {
            "description": "The employee department",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/HRISGroup"
              }
            ]
          },
          "cost_center": {
            "description": "The employee cost_center",
            "deprecated": true,
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/HRISGroup"
              }
            ]
          },
          "cost_centers": {
            "description": "The employee cost_centers",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/HRISCostCenter"
            }
          },
          "division": {
            "description": "The employee division",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/HRISGroup"
              }
            ]
          },
          "job": {
            "description": "The job of employee",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmploymentJobApiModel"
              }
            ]
          },
          "type": {
            "description": "The type of employment",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/TypeApiModel"
              }
            ]
          },
          "contract_type": {
            "description": "The employment work schedule type",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ContractTypeApiModel"
              }
            ]
          },
          "manager": {
            "description": "The employee manager",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/EmploymentManagerApiModel"
            }
          }
        }
      },
      "EmploymentJobApiModel": {
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
          "title": {
            "type": "string",
            "description": "Title of the job",
            "example": "Software Engineer",
            "nullable": true
          },
          "description": {
            "description": "The employee job description",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/JobDescriptionApiModel"
              }
            ]
          },
          "owner_id": {
            "type": "string",
            "description": "The owner_id of the job",
            "example": "5356",
            "nullable": true
          },
          "parent_id": {
            "type": "string",
            "description": "The parent_id of the job",
            "example": "7577",
            "nullable": true
          }
        }
      },
      "EmploymentManagerApiModel": {
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
          "role": {
            "description": "The role of manager",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ManagerRoleApiModel"
              }
            ]
          }
        }
      },
      "EmploymentResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/Employment"
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
      "EmploymentScheduleTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "full_time",
              "shifts",
              "part_time",
              "unmapped_value",
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
      "EmploymentsPaginated": {
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
              "$ref": "#/components/schemas/Employment"
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
      "EmploymentStatusEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "active",
              "pending",
              "terminated",
              "leave",
              "inactive",
              "unknown",
              "unmapped_value",
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
      "EmploymentTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "contractor",
              "intern",
              "permanent",
              "apprentice",
              "freelance",
              "terminated",
              "temporary",
              "seasonal",
              "volunteer",
              "probation",
              "internal",
              "external",
              "expatriate",
              "employer_of_record",
              "casual",
              "Programme",
              "unmapped_value",
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
      "EntitySkillResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/EntitySkills"
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
      "EntitySkills": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "The ID associated with this skill",
            "example": "16873-IT345",
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
            "description": "The name associated with this skill",
            "example": "Information-Technology",
            "nullable": true
          },
          "active": {
            "type": "boolean",
            "description": "Whether the skill is active and therefore available for use",
            "example": true,
            "nullable": true
          },
          "language": {
            "description": "The language associated with this skill",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/LanguageEnum"
              }
            ]
          },
          "maximum_proficiency": {
            "description": "The proficiency level of the skill",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/Proficiency"
              }
            ]
          },
          "minimum_proficiency": {
            "description": "The proficiency level of the skill",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/Proficiency"
              }
            ]
          }
        }
      },
      "EntitySkillsCreateRequestDto": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "The ID associated with this skill",
            "example": "16873-IT345",
            "nullable": true
          },
          "name": {
            "type": "string",
            "description": "The name associated with this skill",
            "example": "Information-Technology",
            "nullable": true
          },
          "maximum_proficiency": {
            "description": "The proficiency level of the skill",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/Proficiency"
              }
            ]
          },
          "minimum_proficiency": {
            "description": "The proficiency level of the skill",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/Proficiency"
              }
            ]
          }
        }
      },
      "EntitySkillsPaginated": {
        "type": "object",
        "properties": {
          "next": {
            "type": "string",
            "nullable": true
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/EntitySkills"
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
      "EthnicityEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "white",
              "black_or_african_american",
              "asian",
              "hispanic_or_latino",
              "american_indian_or_alaska_native",
              "native_hawaiian_or_pacific_islander",
              "two_or_more_races",
              "not_disclosed",
              "other",
              "unmapped_value",
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
      "File": {
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
            "description": "The name of the file",
            "example": "My Document",
            "nullable": true
          },
          "path": {
            "type": "string",
            "description": "The path where the file is stored",
            "example": "/path/to/file",
            "nullable": true
          },
          "category": {
            "description": "The category of the file",
            "example": "templates, forms, backups, etc.",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/FileCategoryEnumApiModel"
              }
            ]
          },
          "contents": {
            "description": "The content of the file. Deprecated, use `url` and `file_format` one level up instead",
            "deprecated": true,
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Content"
            }
          },
          "category_id": {
            "type": "string",
            "description": "The categoryId of the documents",
            "example": "6530",
            "nullable": true
          },
          "created_at": {
            "type": "string",
            "description": "The creation date of the file",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "The update date of the file",
            "example": "2021-01-02T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "remote_url": {
            "type": "string",
            "description": "URL where the file content is located",
            "example": "https://example.com/file.pdf",
            "nullable": true
          },
          "file_format": {
            "description": "The file format of the file",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/FileFormatEnum"
              }
            ]
          }
        }
      },
      "FileCategoryEnumApiModel": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "description": "The category of the file",
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
      "FileFormatEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "description": "The file format of the file, expressed as a file extension",
            "enum": [
              "unmapped_value",
              "ez",
              "aw",
              "atom",
              "atomcat",
              "atomdeleted",
              "atomsvc",
              "dwd",
              "held",
              "rsat",
              "bdoc",
              "xcs",
              "ccxml",
              "cdfx",
              "cdmia",
              "cdmic",
              "cdmid",
              "cdmio",
              "cdmiq",
              "cu",
              "mpd",
              "davmount",
              "dbk",
              "dssc",
              "xdssc",
              "es",
              "ecma",
              "emma",
              "emotionml",
              "epub",
              "exi",
              "exp",
              "fdt",
              "pfr",
              "geojson",
              "gml",
              "gpx",
              "gxf",
              "gz",
              "hjson",
              "stk",
              "ink",
              "inkml",
              "ipfix",
              "its",
              "jar",
              "war",
              "ear",
              "ser",
              "class",
              "js",
              "mjs",
              "json",
              "map",
              "json5",
              "jsonml",
              "jsonld",
              "lgr",
              "lostxml",
              "hqx",
              "cpt",
              "mads",
              "webmanifest",
              "mrc",
              "mrcx",
              "ma",
              "nb",
              "mb",
              "mathml",
              "mbox",
              "mscml",
              "metalink",
              "meta4",
              "mets",
              "maei",
              "musd",
              "mods",
              "m21",
              "mp21",
              "mp4s",
              "m4p",
              "doc",
              "dot",
              "mxf",
              "nq",
              "nt",
              "cjs",
              "bin",
              "dms",
              "lrf",
              "mar",
              "so",
              "dist",
              "distz",
              "pkg",
              "bpk",
              "dump",
              "elc",
              "deploy",
              "exe",
              "dll",
              "deb",
              "dmg",
              "iso",
              "img",
              "msi",
              "msp",
              "msm",
              "buffer",
              "oda",
              "opf",
              "ogx",
              "omdoc",
              "onetoc",
              "onetoc2",
              "onetmp",
              "onepkg",
              "oxps",
              "relo",
              "xer",
              "pdf",
              "pgp",
              "asc",
              "sig",
              "prf",
              "p10",
              "p7m",
              "p7c",
              "p7s",
              "p8",
              "ac",
              "cer",
              "crl",
              "pkipath",
              "pki",
              "pls",
              "ai",
              "eps",
              "ps",
              "provx",
              "pskcxml",
              "raml",
              "rdf",
              "owl",
              "rif",
              "rnc",
              "rl",
              "rld",
              "rs",
              "rapd",
              "sls",
              "rusd",
              "gbr",
              "mft",
              "roa",
              "rsd",
              "rss",
              "rtf",
              "sbml",
              "scq",
              "scs",
              "spq",
              "spp",
              "sdp",
              "senmlx",
              "sensmlx",
              "setpay",
              "setreg",
              "shf",
              "siv",
              "sieve",
              "smi",
              "smil",
              "rq",
              "srx",
              "gram",
              "grxml",
              "sru",
              "ssdl",
              "ssml",
              "swidtag",
              "tei",
              "teicorpus",
              "tfi",
              "tsd",
              "toml",
              "trig",
              "ttml",
              "ubj",
              "rsheet",
              "td",
              "vxml",
              "wasm",
              "wgt",
              "hlp",
              "wsdl",
              "wspolicy",
              "xaml",
              "xav",
              "xca",
              "xdf",
              "xel",
              "xns",
              "xenc",
              "xhtml",
              "xht",
              "xlf",
              "xml",
              "xsl",
              "xsd",
              "rng",
              "dtd",
              "xop",
              "xpl",
              "*xsl",
              "xslt",
              "xspf",
              "mxml",
              "xhvml",
              "xvml",
              "xvm",
              "yang",
              "yin",
              "zip",
              "*3gpp",
              "adp",
              "amr",
              "au",
              "snd",
              "mid",
              "midi",
              "kar",
              "rmi",
              "mxmf",
              "*mp3",
              "m4a",
              "mp4a",
              "mpga",
              "mp2",
              "mp2a",
              "mp3",
              "m2a",
              "m3a",
              "oga",
              "ogg",
              "spx",
              "opus",
              "s3m",
              "sil",
              "wav",
              "*wav",
              "weba",
              "xm",
              "ttc",
              "otf",
              "ttf",
              "woff",
              "woff2",
              "exr",
              "apng",
              "avif",
              "bmp",
              "cgm",
              "drle",
              "emf",
              "fits",
              "g3",
              "gif",
              "heic",
              "heics",
              "heif",
              "heifs",
              "hej2",
              "hsj2",
              "ief",
              "jls",
              "jp2",
              "jpg2",
              "jpeg",
              "jpg",
              "jpe",
              "jph",
              "jhc",
              "jpm",
              "jpx",
              "jpf",
              "jxr",
              "jxra",
              "jxrs",
              "jxs",
              "jxsc",
              "jxsi",
              "jxss",
              "ktx",
              "ktx2",
              "png",
              "sgi",
              "svg",
              "svgz",
              "t38",
              "tif",
              "tiff",
              "tfx",
              "webp",
              "wmf",
              "disposition-notification",
              "u8msg",
              "u8dsn",
              "u8mdn",
              "u8hdr",
              "eml",
              "mime",
              "3mf",
              "gltf",
              "glb",
              "igs",
              "iges",
              "msh",
              "mesh",
              "silo",
              "mtl",
              "obj",
              "stpx",
              "stpz",
              "stpxz",
              "stl",
              "wrl",
              "vrml",
              "*x3db",
              "x3dbz",
              "x3db",
              "*x3dv",
              "x3dvz",
              "x3d",
              "x3dz",
              "x3dv",
              "appcache",
              "manifest",
              "ics",
              "ifb",
              "coffee",
              "litcoffee",
              "css",
              "csv",
              "html",
              "htm",
              "shtml",
              "jade",
              "jsx",
              "less",
              "markdown",
              "md",
              "mml",
              "mdx",
              "n3",
              "txt",
              "text",
              "conf",
              "def",
              "list",
              "log",
              "in",
              "ini",
              "rtx",
              "*rtf",
              "sgml",
              "sgm",
              "shex",
              "slim",
              "slm",
              "spdx",
              "stylus",
              "styl",
              "tsv",
              "t",
              "tr",
              "roff",
              "man",
              "me",
              "ms",
              "ttl",
              "uri",
              "uris",
              "urls",
              "vcard",
              "vtt",
              "*xml",
              "yaml",
              "yml",
              "3gp",
              "3gpp",
              "3g2",
              "h261",
              "h263",
              "h264",
              "m4s",
              "jpgv",
              "*jpm",
              "jpgm",
              "mj2",
              "mjp2",
              "ts",
              "mp4",
              "mp4v",
              "mpg4",
              "mpeg",
              "mpg",
              "mpe",
              "m1v",
              "m2v",
              "ogv",
              "qt",
              "mov",
              "webm",
              "cww",
              "1km",
              "plb",
              "psb",
              "pvb",
              "tcap",
              "pwn",
              "aso",
              "imp",
              "acu",
              "atc",
              "acutc",
              "air",
              "fcdt",
              "fxp",
              "fxpl",
              "xdp",
              "xfdf",
              "ahead",
              "azf",
              "azs",
              "azw",
              "acc",
              "ami",
              "apk",
              "cii",
              "fti",
              "atx",
              "mpkg",
              "key",
              "m3u8",
              "numbers",
              "pages",
              "pkpass",
              "swi",
              "iota",
              "aep",
              "bmml",
              "mpm",
              "bmi",
              "rep",
              "cdxml",
              "mmd",
              "cdy",
              "csl",
              "cla",
              "rp9",
              "c4g",
              "c4d",
              "c4f",
              "c4p",
              "c4u",
              "c11amc",
              "c11amz",
              "csp",
              "cdbcmsg",
              "cmc",
              "clkx",
              "clkk",
              "clkp",
              "clkt",
              "clkw",
              "wbs",
              "pml",
              "ppd",
              "car",
              "pcurl",
              "dart",
              "rdz",
              "dbf",
              "uvf",
              "uvvf",
              "uvd",
              "uvvd",
              "uvt",
              "uvvt",
              "uvx",
              "uvvx",
              "uvz",
              "uvvz",
              "fe_launch",
              "dna",
              "mlp",
              "mle",
              "dpg",
              "dfac",
              "kpxx",
              "ait",
              "svc",
              "geo",
              "mag",
              "nml",
              "esf",
              "msf",
              "qam",
              "slt",
              "ssf",
              "es3",
              "et3",
              "ez2",
              "ez3",
              "fdf",
              "mseed",
              "seed",
              "dataless",
              "gph",
              "ftc",
              "fm",
              "frame",
              "maker",
              "book",
              "fnc",
              "ltf",
              "fsc",
              "oas",
              "oa2",
              "oa3",
              "fg5",
              "bh2",
              "ddd",
              "xdw",
              "xbd",
              "fzs",
              "txd",
              "ggb",
              "ggt",
              "gex",
              "gre",
              "gxt",
              "g2w",
              "g3w",
              "gmx",
              "gdoc",
              "gslides",
              "gsheet",
              "kml",
              "kmz",
              "gqf",
              "gqs",
              "gac",
              "ghf",
              "gim",
              "grv",
              "gtm",
              "tpl",
              "vcg",
              "hal",
              "zmm",
              "hbci",
              "les",
              "hpgl",
              "hpid",
              "hps",
              "jlt",
              "pcl",
              "pclxl",
              "sfd-hdstx",
              "mpy",
              "afp",
              "listafp",
              "list3820",
              "irm",
              "sc",
              "icc",
              "icm",
              "igl",
              "ivp",
              "ivu",
              "igm",
              "xpw",
              "xpx",
              "i2g",
              "qbo",
              "qfx",
              "rcprofile",
              "irp",
              "xpr",
              "fcs",
              "jam",
              "rms",
              "jisp",
              "joda",
              "ktz",
              "ktr",
              "karbon",
              "chrt",
              "kfo",
              "flw",
              "kon",
              "kpr",
              "kpt",
              "ksp",
              "kwd",
              "kwt",
              "htke",
              "kia",
              "kne",
              "knp",
              "skp",
              "skd",
              "skt",
              "skm",
              "sse",
              "lasxml",
              "lbd",
              "lbe",
              "apr",
              "pre",
              "nsf",
              "org",
              "scm",
              "lwp",
              "portpkg",
              "mvt",
              "mcd",
              "mc1",
              "cdkey",
              "mwf",
              "mfm",
              "flo",
              "igx",
              "mif",
              "daf",
              "dis",
              "mbk",
              "mqy",
              "msl",
              "plc",
              "txf",
              "mpn",
              "mpc",
              "xul",
              "cil",
              "cab",
              "xls",
              "xlm",
              "xla",
              "xlc",
              "xlt",
              "xlw",
              "xlam",
              "xlsb",
              "xlsm",
              "xltm",
              "eot",
              "chm",
              "ims",
              "lrm",
              "thmx",
              "msg",
              "cat",
              "*stl",
              "ppt",
              "pps",
              "pot",
              "ppam",
              "pptm",
              "sldm",
              "ppsm",
              "potm",
              "mpp",
              "mpt",
              "docm",
              "dotm",
              "wps",
              "wks",
              "wcm",
              "wdb",
              "wpl",
              "xps",
              "mseq",
              "mus",
              "msty",
              "taglet",
              "nlu",
              "ntf",
              "nitf",
              "nnd",
              "nns",
              "nnw",
              "*ac",
              "ngdat",
              "n-gage",
              "rpst",
              "rpss",
              "edm",
              "edx",
              "ext",
              "odc",
              "otc",
              "odb",
              "odf",
              "odft",
              "odg",
              "otg",
              "odi",
              "oti",
              "odp",
              "otp",
              "ods",
              "ots",
              "odt",
              "odm",
              "ott",
              "oth",
              "xo",
              "dd2",
              "obgx",
              "oxt",
              "osm",
              "pptx",
              "sldx",
              "ppsx",
              "potx",
              "xlsx",
              "xltx",
              "docx",
              "dotx",
              "mgp",
              "dp",
              "esa",
              "pdb",
              "pqa",
              "oprc",
              "paw",
              "str",
              "ei6",
              "efif",
              "wg",
              "plf",
              "pbd",
              "box",
              "mgz",
              "qps",
              "ptid",
              "qxd",
              "qxt",
              "qwd",
              "qwt",
              "qxl",
              "qxb",
              "rar",
              "bed",
              "mxl",
              "musicxml",
              "cryptonote",
              "cod",
              "rm",
              "rmvb",
              "link66",
              "st",
              "see",
              "sema",
              "semd",
              "semf",
              "ifm",
              "itp",
              "iif",
              "ipk",
              "twd",
              "twds",
              "mmf",
              "teacher",
              "fo",
              "sdkm",
              "sdkd",
              "dxp",
              "sfs",
              "sdc",
              "sda",
              "sdd",
              "smf",
              "sdw",
              "vor",
              "sgl",
              "smzip",
              "sm",
              "wadl",
              "sxc",
              "stc",
              "sxd",
              "std",
              "sxi",
              "sti",
              "sxm",
              "sxw",
              "sxg",
              "stw",
              "sus",
              "susp",
              "svd",
              "sis",
              "sisx",
              "xsm",
              "bdm",
              "xdm",
              "ddf",
              "tao",
              "pcap",
              "cap",
              "dmp",
              "tmo",
              "tpt",
              "mxs",
              "tra",
              "ufd",
              "ufdl",
              "utz",
              "umj",
              "unityweb",
              "uoml",
              "vcx",
              "vsd",
              "vst",
              "vss",
              "vsw",
              "vis",
              "vsf",
              "wbxml",
              "wmlc",
              "wmlsc",
              "wtb",
              "nbp",
              "wpd",
              "wqd",
              "stf",
              "xar",
              "xfdl",
              "hvd",
              "hvs",
              "hvp",
              "osf",
              "osfpvg",
              "saf",
              "spf",
              "cmp",
              "zir",
              "zirz",
              "zaz",
              "7z",
              "abw",
              "ace",
              "*dmg",
              "arj",
              "aab",
              "x32",
              "u32",
              "vox",
              "aam",
              "aas",
              "bcpio",
              "*bdoc",
              "torrent",
              "blb",
              "blorb",
              "bz",
              "bz2",
              "boz",
              "cbr",
              "cba",
              "cbt",
              "cbz",
              "cb7",
              "vcd",
              "cfs",
              "chat",
              "pgn",
              "crx",
              "cco",
              "nsc",
              "cpio",
              "csh",
              "*deb",
              "udeb",
              "dgc",
              "dir",
              "dcr",
              "dxr",
              "cst",
              "cct",
              "cxt",
              "w3d",
              "fgd",
              "swa",
              "wad",
              "ncx",
              "dtb",
              "res",
              "dvi",
              "evy",
              "eva",
              "bdf",
              "gsf",
              "psf",
              "pcf",
              "snf",
              "pfa",
              "pfb",
              "pfm",
              "afm",
              "arc",
              "spl",
              "gca",
              "ulx",
              "gnumeric",
              "gramps",
              "gtar",
              "hdf",
              "php",
              "install",
              "*iso",
              "*key",
              "*numbers",
              "*pages",
              "jardiff",
              "jnlp",
              "kdbx",
              "latex",
              "luac",
              "lzh",
              "lha",
              "run",
              "mie",
              "prc",
              "mobi",
              "application",
              "lnk",
              "wmd",
              "wmz",
              "xbap",
              "mdb",
              "obd",
              "crd",
              "clp",
              "*exe",
              "*dll",
              "com",
              "bat",
              "*msi",
              "mvb",
              "m13",
              "m14",
              "*wmf",
              "*wmz",
              "*emf",
              "emz",
              "mny",
              "pub",
              "scd",
              "trm",
              "wri",
              "nc",
              "cdf",
              "pac",
              "nzb",
              "pl",
              "pm",
              "*prc",
              "*pdb",
              "p12",
              "pfx",
              "p7b",
              "spc",
              "p7r",
              "*rar",
              "rpm",
              "ris",
              "sea",
              "sh",
              "shar",
              "swf",
              "xap",
              "sql",
              "sit",
              "sitx",
              "srt",
              "sv4cpio",
              "sv4crc",
              "t3",
              "gam",
              "tar",
              "tcl",
              "tk",
              "tex",
              "tfm",
              "texinfo",
              "texi",
              "*obj",
              "ustar",
              "hdd",
              "ova",
              "ovf",
              "vbox",
              "vbox-extpack",
              "vdi",
              "vhd",
              "vmdk",
              "src",
              "webapp",
              "der",
              "crt",
              "pem",
              "fig",
              "*xlf",
              "xpi",
              "xz",
              "z1",
              "z2",
              "z3",
              "z4",
              "z5",
              "z6",
              "z7",
              "z8",
              "uva",
              "uvva",
              "eol",
              "dra",
              "dts",
              "dtshd",
              "lvp",
              "pya",
              "ecelp4800",
              "ecelp7470",
              "ecelp9600",
              "rip",
              "aac",
              "aif",
              "aiff",
              "aifc",
              "caf",
              "flac",
              "*m4a",
              "mka",
              "m3u",
              "wax",
              "wma",
              "ram",
              "ra",
              "rmp",
              "*ra",
              "cdx",
              "cif",
              "cmdf",
              "cml",
              "csml",
              "xyz",
              "btif",
              "pti",
              "psd",
              "azv",
              "uvi",
              "uvvi",
              "uvg",
              "uvvg",
              "djvu",
              "djv",
              "*sub",
              "dwg",
              "dxf",
              "fbs",
              "fpx",
              "fst",
              "mmr",
              "rlc",
              "ico",
              "dds",
              "mdi",
              "wdp",
              "npx",
              "b16",
              "tap",
              "vtf",
              "wbmp",
              "xif",
              "pcx",
              "3ds",
              "ras",
              "cmx",
              "fh",
              "fhc",
              "fh4",
              "fh5",
              "fh7",
              "*ico",
              "jng",
              "sid",
              "*bmp",
              "*pcx",
              "pic",
              "pct",
              "pnm",
              "pbm",
              "pgm",
              "ppm",
              "rgb",
              "tga",
              "xbm",
              "xpm",
              "xwd",
              "wsc",
              "dae",
              "dwf",
              "gdl",
              "gtw",
              "mts",
              "ogex",
              "x_b",
              "x_t",
              "vds",
              "usdz",
              "bsp",
              "vtu",
              "dsc",
              "curl",
              "dcurl",
              "mcurl",
              "scurl",
              "sub",
              "fly",
              "flx",
              "gv",
              "3dml",
              "spot",
              "jad",
              "wml",
              "wmls",
              "s",
              "asm",
              "c",
              "cc",
              "cxx",
              "cpp",
              "h",
              "hh",
              "dic",
              "htc",
              "f",
              "for",
              "f77",
              "f90",
              "hbs",
              "java",
              "lua",
              "mkd",
              "nfo",
              "opml",
              "*org",
              "p",
              "pas",
              "pde",
              "sass",
              "scss",
              "etx",
              "sfv",
              "ymp",
              "uu",
              "vcs",
              "vcf",
              "uvh",
              "uvvh",
              "uvm",
              "uvvm",
              "uvp",
              "uvvp",
              "uvs",
              "uvvs",
              "uvv",
              "uvvv",
              "dvb",
              "fvt",
              "mxu",
              "m4u",
              "pyv",
              "uvu",
              "uvvu",
              "viv",
              "f4v",
              "fli",
              "flv",
              "m4v",
              "mkv",
              "mk3d",
              "mks",
              "mng",
              "asf",
              "asx",
              "vob",
              "wm",
              "wmv",
              "wmx",
              "wvx",
              "avi",
              "movie",
              "smv",
              "ice",
              "mht",
              null
            ],
            "example": "pdf",
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
            "example": "abc",
            "nullable": true
          }
        }
      },
      "GenderEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "male",
              "female",
              "non_binary",
              "other",
              "not_disclosed",
              "diverse",
              "unmapped_value",
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
      "GroupTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "workspace",
              "team",
              "department",
              "group",
              "organization",
              "unmapped_value",
              "cost_center",
              null
            ],
            "example": "team",
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
      "HrisBatchDocumentUploadRequestDto": {
        "type": "object",
        "properties": {
          "items": {
            "description": "The batch of items to create",
            "nullable": false,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/HrisDocumentsUploadRequestDto"
            }
          }
        },
        "required": [
          "items"
        ]
      },
      "HRISBenefit": {
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
            "description": "The name of the benefit",
            "example": "Health Insurance",
            "nullable": true
          },
          "benefit_type": {
            "description": "The type of the benefit",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/BenefitsTypeEnum"
              }
            ]
          },
          "provider": {
            "type": "string",
            "description": "The provider of the benefit",
            "example": "Aetna",
            "nullable": true
          },
          "description": {
            "type": "string",
            "description": "The description of the benefit",
            "example": "Health insurance for employees",
            "nullable": true
          },
          "created_at": {
            "type": "string",
            "description": "The date and time the benefit was created",
            "example": "2021-01-01T00:00:00Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "The date and time the benefit was last updated",
            "example": "2021-01-01T00:00:00Z",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "HRISBenefitResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/HRISBenefit"
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
      "HRISBenefitsPaginated": {
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
              "$ref": "#/components/schemas/HRISBenefit"
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
      "HRISCostCenter": {
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
            "description": "The name of the group",
            "example": "Engineering",
            "nullable": true
          },
          "parent_ids": {
            "description": "The list of parent group ids of the given group",
            "example": [
              "cxIQNjUyNDM0",
              "cxIQNjQzNzI0MQ"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "remote_parent_ids": {
            "description": "Provider's list of parent group remote ids of the given group",
            "example": [
              "652434",
              "6437241"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "owner_ids": {
            "description": "The list of group owner ids of the given group",
            "example": [
              "cxIQNjUyEDM0",
              "cxIQNjQzNzA0MQ"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "remote_owner_ids": {
            "description": "The list of remote group owner ids of the given group",
            "example": [
              "475364",
              "4327652"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "distribution_percentage": {
            "type": "number",
            "example": 85,
            "description": "The distribution percentage for cost_center",
            "nullable": true
          },
          "type": {
            "description": "The type of the group",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/GroupTypeEnum"
              }
            ]
          }
        }
      },
      "HRISCostCenterPaginated": {
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
              "$ref": "#/components/schemas/HRISCostCenter"
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
      "HRISCostCenterResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/HRISCostCenter"
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
      "HrisCreateEmployeeRequestDto": {
        "type": "object",
        "properties": {
          "first_name": {
            "type": "string",
            "description": "The employee first name",
            "example": "Isaac",
            "nullable": true
          },
          "last_name": {
            "type": "string",
            "description": "The employee last name",
            "example": "Newton",
            "nullable": true
          },
          "name": {
            "type": "string",
            "description": "The employee name",
            "example": "Isaac Newton",
            "nullable": true
          },
          "display_name": {
            "type": "string",
            "description": "The employee display name",
            "example": "Sir Isaac Newton",
            "nullable": true
          },
          "avatar_url": {
            "type": "string",
            "description": "The employee avatar Url",
            "example": "https://example.com/avatar.png",
            "nullable": true
          },
          "personal_email": {
            "type": "string",
            "description": "The employee personal email",
            "example": "isaac.newton@example.com",
            "nullable": true
          },
          "personal_phone_number": {
            "type": "string",
            "description": "The employee personal phone number",
            "example": "+1234567890",
            "nullable": true
          },
          "work_email": {
            "type": "string",
            "description": "The employee work email",
            "example": "newton@example.com",
            "nullable": true
          },
          "work_phone_number": {
            "type": "string",
            "description": "The employee work phone number",
            "example": "+1234567890",
            "nullable": true
          },
          "job_id": {
            "type": "string",
            "description": "The employee job id",
            "example": "R-6789",
            "nullable": true
          },
          "job_title": {
            "type": "string",
            "description": "The employee job title",
            "example": "Physicist",
            "nullable": true
          },
          "department_id": {
            "type": "string",
            "description": "The employee department id",
            "example": "3093",
            "nullable": true
          },
          "team_id": {
            "type": "string",
            "description": "The employee team id",
            "example": "2913",
            "nullable": true
          },
          "department": {
            "type": "string",
            "description": "The employee department",
            "example": "Physics",
            "nullable": true
          },
          "manager_id": {
            "type": "string",
            "description": "The employee manager ID",
            "example": "67890",
            "nullable": true
          },
          "gender": {
            "description": "The employee gender",
            "example": "male",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/GenderEnum"
              }
            ]
          },
          "preferred_language": {
            "description": "The employee preferred language",
            "example": "en_US",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/PreferredLanguageEnum"
              }
            ]
          },
          "ethnicity": {
            "description": "The employee ethnicity",
            "example": "white",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EthnicityEnum"
              }
            ]
          },
          "date_of_birth": {
            "type": "string",
            "description": "The employee date_of_birth",
            "example": "1990-01-01T00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "birthday": {
            "type": "string",
            "description": "The employee birthday",
            "example": "2021-01-01T00:00:00Z",
            "format": "date-time",
            "nullable": true
          },
          "marital_status": {
            "description": "The employee marital status",
            "example": "single",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/MaritalStatusEnum"
              }
            ]
          },
          "avatar": {
            "description": "The employee avatar",
            "example": "https://example.com/avatar.png",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/Image"
              }
            ]
          },
          "hire_date": {
            "type": "string",
            "description": "The employee hire date",
            "example": "2021-01-01T00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "start_date": {
            "type": "string",
            "description": "The employee start date",
            "example": "2021-01-01T00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "employment_type": {
            "description": "The employee employment type",
            "example": "full_time",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmploymentTypeEnum"
              }
            ]
          },
          "employment_contract_type": {
            "description": "The employment work schedule type (e.g., full-time, part-time)",
            "example": "full_time",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmploymentScheduleTypeEnum"
              }
            ]
          },
          "employment_status": {
            "description": "The employee employment status",
            "example": "active",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmploymentStatusEnum"
              }
            ]
          },
          "termination_date": {
            "type": "string",
            "description": "The employee termination date",
            "example": "2021-01-01T00:00:00Z",
            "format": "date-time",
            "nullable": true
          },
          "company_name": {
            "type": "string",
            "description": "The employee company name",
            "example": "Example Corp",
            "deprecated": true,
            "nullable": true
          },
          "company_id": {
            "type": "string",
            "description": "The employee company id",
            "example": "1234567890",
            "nullable": true
          },
          "citizenships": {
            "description": "The citizenships of the Employee",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CountryCodeEnum"
            }
          },
          "employments": {
            "description": "The employee employments",
            "deprecated": true,
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CreateEmploymentApiModel"
            }
          },
          "employment": {
            "description": "The employee employment",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/CreateEmploymentApiModel"
              }
            ]
          },
          "custom_fields": {
            "description": "The employee custom fields",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CustomFields"
            }
          },
          "benefits": {
            "description": "Current benefits of the employee",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CreateHRISBenefit"
            }
          },
          "employee_number": {
            "type": "string",
            "description": "The assigned employee number",
            "example": "125",
            "nullable": true
          },
          "national_identity_number": {
            "description": "The national identity number",
            "deprecated": true,
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/NationalIdentityNumberApiModel"
              }
            ]
          },
          "national_identity_numbers": {
            "description": "The national identity numbers",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/NationalIdentityNumberApiModel"
            }
          },
          "home_location": {
            "description": "The employee home location",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/CreateEmployeeLocationApiModel"
              }
            ]
          },
          "work_location": {
            "description": "The employee work location",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/CreateEmployeeLocationApiModel"
              }
            ]
          },
          "cost_centers": {
            "description": "The employee cost centers",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CreateCostCenterApiModel"
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
      "HrisCreateEmploymentRequestDto": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier",
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
          "job_title": {
            "type": "string",
            "description": "The job title of the employee",
            "example": "Software Engineer",
            "nullable": true
          },
          "pay_rate": {
            "type": "string",
            "description": "The pay rate for the employee",
            "example": "40.00",
            "nullable": true
          },
          "pay_period": {
            "description": "The pay period",
            "example": "monthly",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/PayPeriodEnum"
              }
            ]
          },
          "pay_frequency": {
            "description": "The pay frequency",
            "example": "hourly",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/PayFrequencyEnum"
              }
            ]
          },
          "pay_currency": {
            "type": "string",
            "description": "The currency used for pay",
            "example": "USD",
            "nullable": true
          },
          "effective_date": {
            "type": "string",
            "description": "The effective date of the employment contract",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "deprecated": true,
            "nullable": true
          },
          "employment_type": {
            "description": "The type of employment (e.g., contractor, permanent)",
            "example": "permanent",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmploymentTypeEnum"
              }
            ]
          },
          "employment_contract_type": {
            "description": "The employment work schedule type (e.g., full-time, part-time)",
            "example": "full_time",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmploymentScheduleTypeEnum"
              }
            ]
          },
          "time_worked": {
            "type": "string",
            "description": "The time worked for the employee in ISO 8601 duration format",
            "example": "P0Y0M0DT8H0M0S",
            "format": "duration",
            "nullable": true
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
      "HrisCreateTimeOffRequestDto": {
        "type": "object",
        "properties": {
          "employee_id": {
            "type": "string",
            "description": "The employee ID",
            "example": "1687-3",
            "nullable": true
          },
          "approver_id": {
            "type": "string",
            "description": "The approver ID",
            "example": "1687-4",
            "nullable": true
          },
          "status": {
            "description": "The status of the time off request",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/TimeOffStatusEnum"
              }
            ]
          },
          "type": {
            "description": "The type of the time off request",
            "deprecated": true,
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/TimeOffTypeEnum"
              }
            ]
          },
          "start_date": {
            "type": "string",
            "description": "The start date of the time off request",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "end_date": {
            "type": "string",
            "description": "The end date of the time off request",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "start_half_day": {
            "description": "True if the start of the time off request begins half way through the day",
            "example": true,
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
          "end_half_day": {
            "description": "True if the end of the time off request ends half way through the day",
            "example": true,
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
          "time_off_policy_id": {
            "type": "string",
            "description": "The time off policy id associated with this time off request",
            "example": "cx280928933",
            "nullable": true
          },
          "reason": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/Reason"
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
      "HrisCreateWorkEligibilityRequestDto": {
        "type": "object",
        "properties": {
          "document": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/File"
              }
            ]
          },
          "issued_by": {
            "description": "The country code of the issued by authority",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/CountryCodeEnum"
              }
            ]
          },
          "number": {
            "type": "string",
            "example": "1234567890",
            "nullable": true
          },
          "sub_type": {
            "type": "string",
            "example": "H1B",
            "nullable": true
          },
          "type": {
            "example": "visa",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/WorkEligibilityTypeEnum"
              }
            ]
          },
          "valid_from": {
            "type": "string",
            "example": "2021-01-01T00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "valid_to": {
            "type": "string",
            "example": "2021-01-01T00:00.000Z",
            "format": "date-time",
            "nullable": true
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
      "HRISDepartment": {
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
            "description": "The name of the group",
            "example": "Engineering",
            "nullable": true
          },
          "parent_ids": {
            "description": "The list of parent group ids of the given group",
            "example": [
              "cxIQNjUyNDM0",
              "cxIQNjQzNzI0MQ"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "remote_parent_ids": {
            "description": "Provider's list of parent group remote ids of the given group",
            "example": [
              "652434",
              "6437241"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "owner_ids": {
            "description": "The list of group owner ids of the given group",
            "example": [
              "cxIQNjUyEDM0",
              "cxIQNjQzNzA0MQ"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "remote_owner_ids": {
            "description": "The list of remote group owner ids of the given group",
            "example": [
              "475364",
              "4327652"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "type": {
            "description": "The type of the department group",
            "example": "department",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/DepartmentTypeEnum"
              }
            ]
          }
        }
      },
      "HRISDepartmentsPaginated": {
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
              "$ref": "#/components/schemas/HRISDepartment"
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
      "HRISDepartmentsResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/HRISDepartment"
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
      "HrisDocumentApiModel": {
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
            "description": "The name of the file",
            "example": "My Document",
            "nullable": true
          },
          "path": {
            "type": "string",
            "description": "The path where the file is stored",
            "example": "/path/to/file",
            "nullable": true
          },
          "category": {
            "description": "The category of the the document",
            "example": "templates, forms, backups, etc.",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/HrisDocumentTypeEnum"
              }
            ]
          },
          "contents": {
            "description": "The content of the file. Deprecated, use `url` and `file_format` one level up instead",
            "deprecated": true,
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Content"
            }
          },
          "category_id": {
            "type": "string",
            "description": "The categoryId of the documents",
            "example": "6530",
            "nullable": true
          },
          "created_at": {
            "type": "string",
            "description": "The creation date of the file",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "The update date of the file",
            "example": "2021-01-02T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "remote_url": {
            "type": "string",
            "description": "URL where the file content is located",
            "example": "https://example.com/file.pdf",
            "nullable": true
          },
          "file_format": {
            "description": "The file format of the file",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/FileFormatEnum"
              }
            ]
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
          "type": {
            "description": "The content type of the document",
            "deprecated": true,
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/HrisDocumentTypeEnum"
              }
            ]
          }
        }
      },
      "HrisDocumentResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/HrisDocumentApiModel"
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
      "HrisDocumentsPaginated": {
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
              "$ref": "#/components/schemas/HrisDocumentApiModel"
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
      "HrisDocumentsUploadCategoryEnumApiModel": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "description": "The category name to associate with the file",
            "example": "reports",
            "nullable": true,
            "enum": [
              "application",
              "academic",
              "contract",
              "certificates",
              "visa",
              "passport",
              "driver_license",
              "payslip",
              "payroll",
              "appraisal",
              "resume",
              "policy",
              "cover_letter",
              "offer_letter",
              "policy_agreement",
              "home_address",
              "national_id",
              "confidential",
              "signed",
              "shared",
              "other",
              "benefit",
              "id_verification",
              "background_check",
              "unmapped_value",
              null
            ],
            "x-speakeasy-unknown-values": "allow"
          },
          "source_value": {
            "type": "string",
            "description": "The provider specific category for associating uploaded files, if provided, the value will be ignored.",
            "example": "550e8400-e29b-41d4-a716-446655440000",
            "nullable": true
          }
        }
      },
      "HrisDocumentsUploadRequestDto": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "The filename of the file to upload",
            "example": "weather-forecast",
            "nullable": true
          },
          "file_format": {
            "description": "The file format of the file",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/FileFormatEnum"
              }
            ]
          },
          "content": {
            "type": "string",
            "description": "The base64 encoded content of the file to upload",
            "example": "VGhpcyBpc24ndCByZWFsbHkgYSBzYW1wbGUgZmlsZSwgYnV0IG5vIG9uZSB3aWxsIGV2ZXIga25vdyE",
            "nullable": true
          },
          "category_id": {
            "type": "string",
            "description": "The categoryId of the documents",
            "example": "6530",
            "nullable": true
          },
          "path": {
            "type": "string",
            "description": "The path for the file to be uploaded to",
            "example": "/path/to/file",
            "nullable": true
          },
          "category": {
            "description": "The category to be associated with the file to be uploaded. Id will take precedence over name.",
            "nullable": true,
            "example": {
              "name": "reports",
              "id": "550e8400-e29b-41d4-a716-446655440000"
            },
            "allOf": [
              {
                "$ref": "#/components/schemas/HrisDocumentsUploadCategoryEnumApiModel"
              }
            ]
          },
          "confidential": {
            "description": "The confidentiality level of the file to be uploaded",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ConfidentialEnumApiModel"
              }
            ]
          }
        }
      },
      "HrisDocumentTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "description": "The category of the file",
            "nullable": true,
            "enum": [
              "application",
              "academic",
              "contract",
              "certificates",
              "visa",
              "passport",
              "driver_license",
              "payslip",
              "payroll",
              "appraisal",
              "resume",
              "policy",
              "cover_letter",
              "offer_letter",
              "policy_agreement",
              "home_address",
              "national_id",
              "confidential",
              "signed",
              "shared",
              "other",
              "benefit",
              "id_verification",
              "background_check",
              "unmapped_value",
              null
            ],
            "x-speakeasy-unknown-values": "allow"
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
      "HRISGroup": {
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
            "description": "The name of the group",
            "example": "Engineering",
            "nullable": true
          },
          "parent_ids": {
            "description": "The list of parent group ids of the given group",
            "example": [
              "cxIQNjUyNDM0",
              "cxIQNjQzNzI0MQ"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "remote_parent_ids": {
            "description": "Provider's list of parent group remote ids of the given group",
            "example": [
              "652434",
              "6437241"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "owner_ids": {
            "description": "The list of group owner ids of the given group",
            "example": [
              "cxIQNjUyEDM0",
              "cxIQNjQzNzA0MQ"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "remote_owner_ids": {
            "description": "The list of remote group owner ids of the given group",
            "example": [
              "475364",
              "4327652"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "type": {
            "description": "The type of the group",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/GroupTypeEnum"
              }
            ]
          }
        }
      },
      "HRISGroupsPaginated": {
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
              "$ref": "#/components/schemas/HRISGroup"
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
      "HRISGroupsResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/HRISGroup"
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
      "HrisInviteEmployeeRequestDto": {
        "type": "object",
        "properties": {
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
      "HRISLocation": {
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
          "employee_id": {
            "type": "string",
            "description": "The employee ID",
            "example": "1687-3",
            "nullable": true
          },
          "remote_employee_id": {
            "type": "string",
            "description": "Provider's unique identifier of the employee",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "name": {
            "type": "string",
            "description": "The name of the location",
            "example": "Woolsthorpe Manor",
            "nullable": true
          },
          "phone_number": {
            "type": "string",
            "description": "The phone number of the location",
            "example": "+44 1476 860 364",
            "nullable": true
          },
          "street_1": {
            "type": "string",
            "description": "The first line of the address",
            "example": "Water Lane",
            "nullable": true
          },
          "street_2": {
            "type": "string",
            "description": "The second line of the address",
            "example": "Woolsthorpe by Colsterworth",
            "nullable": true
          },
          "city": {
            "type": "string",
            "description": "The city where the location is situated",
            "example": "Grantham",
            "nullable": true
          },
          "state": {
            "type": "string",
            "description": "The state where the location is situated",
            "example": "Lincolnshire",
            "nullable": true
          },
          "zip_code": {
            "type": "string",
            "description": "The ZIP code/Postal code of the location",
            "example": "NG33 5NR",
            "nullable": true
          },
          "country": {
            "description": "The country code",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/CountryCodeEnum"
              }
            ]
          },
          "location_type": {
            "description": "The location type",
            "example": "work",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/LocationTypeEnum"
              }
            ]
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
          }
        }
      },
      "HRISLocationResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/HRISLocation"
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
      "HRISLocationsPaginated": {
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
              "$ref": "#/components/schemas/HRISLocation"
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
      "HRISTeam": {
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
            "description": "The name of the group",
            "example": "Engineering",
            "nullable": true
          },
          "parent_ids": {
            "description": "The list of parent group ids of the given group",
            "example": [
              "cxIQNjUyNDM0",
              "cxIQNjQzNzI0MQ"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "remote_parent_ids": {
            "description": "Provider's list of parent group remote ids of the given group",
            "example": [
              "652434",
              "6437241"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "owner_ids": {
            "description": "The list of group owner ids of the given group",
            "example": [
              "cxIQNjUyEDM0",
              "cxIQNjQzNzA0MQ"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "remote_owner_ids": {
            "description": "The list of remote group owner ids of the given group",
            "example": [
              "475364",
              "4327652"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "type": {
            "description": "The type of the team group",
            "example": "team",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/TeamTypeEnum"
              }
            ]
          }
        }
      },
      "HRISTeamsPaginated": {
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
              "$ref": "#/components/schemas/HRISTeam"
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
      "HRISTeamsResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/HRISTeam"
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
      "HrisUpdateEmployeeRequestDto": {
        "type": "object",
        "properties": {
          "first_name": {
            "type": "string",
            "description": "The employee first name",
            "example": "Isaac",
            "nullable": true
          },
          "last_name": {
            "type": "string",
            "description": "The employee last name",
            "example": "Newton",
            "nullable": true
          },
          "name": {
            "type": "string",
            "description": "The employee name",
            "example": "Isaac Newton",
            "nullable": true
          },
          "display_name": {
            "type": "string",
            "description": "The employee display name",
            "example": "Sir Isaac Newton",
            "nullable": true
          },
          "avatar_url": {
            "type": "string",
            "description": "The employee avatar Url",
            "example": "https://example.com/avatar.png",
            "nullable": true
          },
          "personal_email": {
            "type": "string",
            "description": "The employee personal email",
            "example": "isaac.newton@example.com",
            "nullable": true
          },
          "personal_phone_number": {
            "type": "string",
            "description": "The employee personal phone number",
            "example": "+1234567890",
            "nullable": true
          },
          "work_email": {
            "type": "string",
            "description": "The employee work email",
            "example": "newton@example.com",
            "nullable": true
          },
          "work_phone_number": {
            "type": "string",
            "description": "The employee work phone number",
            "example": "+1234567890",
            "nullable": true
          },
          "job_id": {
            "type": "string",
            "description": "The employee job id",
            "example": "R-6789",
            "nullable": true
          },
          "job_title": {
            "type": "string",
            "description": "The employee job title",
            "example": "Physicist",
            "nullable": true
          },
          "department_id": {
            "type": "string",
            "description": "The employee department id",
            "example": "3093",
            "nullable": true
          },
          "team_id": {
            "type": "string",
            "description": "The employee team id",
            "example": "2913",
            "nullable": true
          },
          "department": {
            "type": "string",
            "description": "The employee department",
            "example": "Physics",
            "nullable": true
          },
          "manager_id": {
            "type": "string",
            "description": "The employee manager ID",
            "example": "67890",
            "nullable": true
          },
          "gender": {
            "description": "The employee gender",
            "example": "male",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/GenderEnum"
              }
            ]
          },
          "preferred_language": {
            "description": "The employee preferred language",
            "example": "en_US",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/PreferredLanguageEnum"
              }
            ]
          },
          "ethnicity": {
            "description": "The employee ethnicity",
            "example": "white",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EthnicityEnum"
              }
            ]
          },
          "date_of_birth": {
            "type": "string",
            "description": "The employee date_of_birth",
            "example": "1990-01-01T00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "birthday": {
            "type": "string",
            "description": "The employee birthday",
            "example": "2021-01-01T00:00:00Z",
            "format": "date-time",
            "nullable": true
          },
          "marital_status": {
            "description": "The employee marital status",
            "example": "single",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/MaritalStatusEnum"
              }
            ]
          },
          "avatar": {
            "description": "The employee avatar",
            "example": "https://example.com/avatar.png",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/Image"
              }
            ]
          },
          "hire_date": {
            "type": "string",
            "description": "The employee hire date",
            "example": "2021-01-01T00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "start_date": {
            "type": "string",
            "description": "The employee start date",
            "example": "2021-01-01T00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "employment_type": {
            "description": "The employee employment type",
            "example": "full_time",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmploymentTypeEnum"
              }
            ]
          },
          "employment_contract_type": {
            "description": "The employment work schedule type (e.g., full-time, part-time)",
            "example": "full_time",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmploymentScheduleTypeEnum"
              }
            ]
          },
          "employment_status": {
            "description": "The employee employment status",
            "example": "active",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmploymentStatusEnum"
              }
            ]
          },
          "termination_date": {
            "type": "string",
            "description": "The employee termination date",
            "example": "2021-01-01T00:00:00Z",
            "format": "date-time",
            "nullable": true
          },
          "company_name": {
            "type": "string",
            "description": "The employee company name",
            "example": "Example Corp",
            "deprecated": true,
            "nullable": true
          },
          "company_id": {
            "type": "string",
            "description": "The employee company id",
            "example": "1234567890",
            "nullable": true
          },
          "citizenships": {
            "description": "The citizenships of the Employee",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CountryCodeEnum"
            }
          },
          "employment": {
            "description": "The employee employment",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/CreateEmploymentApiModel"
              }
            ]
          },
          "custom_fields": {
            "description": "The employee custom fields",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CustomFields"
            }
          },
          "benefits": {
            "description": "Current benefits of the employee",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CreateHRISBenefit"
            }
          },
          "employee_number": {
            "type": "string",
            "description": "The assigned employee number",
            "example": "125",
            "nullable": true
          },
          "national_identity_number": {
            "description": "The national identity number",
            "deprecated": true,
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/NationalIdentityNumberApiModel"
              }
            ]
          },
          "national_identity_numbers": {
            "description": "The national identity numbers",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/NationalIdentityNumberApiModel"
            }
          },
          "home_location": {
            "description": "The employee home location",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/CreateEmployeeLocationApiModel"
              }
            ]
          },
          "work_location": {
            "description": "The employee work location",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/CreateEmployeeLocationApiModel"
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
      "Image": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string",
            "nullable": true
          },
          "base64": {
            "type": "string",
            "nullable": true
          }
        }
      },
      "InviteEmployeeResult": {
        "type": "object",
        "properties": {
          "statusCode": {
            "type": "number",
            "example": 200
          },
          "message": {
            "type": "string",
            "example": "Record invited successfully"
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
      "ISO3166_2SubDivisionEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "description": "state (ISO3166-2 Sub Division Code) - value must be a valid enum value",
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
      "Job": {
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
          "code": {
            "type": "string",
            "description": "Code of the job",
            "example": "184919",
            "nullable": true
          },
          "title": {
            "type": "string",
            "description": "Title of the job",
            "example": "Software Engineer",
            "nullable": true
          },
          "description": {
            "type": "string",
            "description": "Description of the job",
            "example": "Responsible for identifying business requirements",
            "nullable": true
          },
          "status": {
            "description": "Status of the job",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/JobStatusEnum"
              }
            ]
          },
          "created_at": {
            "type": "string",
            "description": "Date of creation",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "Date of last update",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "JobDescriptionApiModel": {
        "type": "object",
        "properties": {
          "text": {
            "type": "string",
            "example": "Testing the laws of motion",
            "nullable": true
          }
        }
      },
      "JobResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/Job"
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
      "JobsPaginated": {
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
              "$ref": "#/components/schemas/Job"
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
      "JobStatusEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "draft",
              "pending",
              "archived",
              "closed",
              "open",
              "deleted",
              null
            ],
            "description": "The status of the job.",
            "example": "active",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the job status.",
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
      "LaborTypeApiModel": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "example": "ABC123",
            "nullable": true
          }
        }
      },
      "LanguageEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "ar_AR",
              "aa_ER",
              "af_NA",
              "af_ZA",
              "am_ET",
              "ar_AE",
              "ar_BH",
              "ar_DJ",
              "ar_DZ",
              "ar_EG",
              "ar_ER",
              "ar_IQ",
              "ar_JO",
              "ar_KM",
              "ar_KW",
              "ar_LB",
              "ar_LY",
              "ar_MA",
              "ar_MR",
              "ar_OM",
              "ar_PS",
              "ar_QA",
              "ar_SA",
              "ar_SD",
              "ar_SY",
              "ar_TD",
              "ar_TN",
              "ar_YE",
              "ay_BO",
              "ay_PE",
              "az_AZ",
              "az_IR",
              "be_BY",
              "bg_BG",
              "bi_VU",
              "bn_BD",
              "bn_IN",
              "bs_BA",
              "bs-ME",
              "byn_ER",
              "ca_AD",
              "ca_ES",
              "ca_FR",
              "ca_IT",
              "ch_GU",
              "cs_CZ",
              "da_DK",
              "de_AT",
              "de_BE",
              "de_CH",
              "de_DE",
              "de_LI",
              "de_LU",
              "de_VA",
              "de_MV",
              "dv_MV",
              "dz_BT",
              "el_CY",
              "el_GR",
              "en_AG",
              "en_AI",
              "en_AS",
              "en_AU",
              "en_BB",
              "en_BE",
              "en_BM",
              "en_BS",
              "en_BW",
              "en_BZ",
              "en_CA",
              "en_CC",
              "en_CK",
              "en_CM",
              "en_CW",
              "en_CX",
              "en_DG",
              "en_DM",
              "en_ER",
              "en_FJ",
              "en_FK",
              "en_FM",
              "en_GB",
              "en_GD",
              "en_GG",
              "en_GH",
              "en_GI",
              "en_GM",
              "en_GS",
              "en_GU",
              "en_GY",
              "en_HK",
              "en_IE",
              "en_IM",
              "en_IN",
              "en_IO",
              "en_JE",
              "en_JM",
              "en_KE",
              "en_KI",
              "en_KN",
              "en_KY",
              "en_LC",
              "en_LR",
              "en_LS",
              "en_MF",
              "en_MG",
              "en_MH",
              "en_MO",
              "en_MP",
              "en_MS",
              "en_MT",
              "en_MU",
              "en_MW",
              "en_MY",
              "en_NA",
              "en_NF",
              "en_NG",
              "en_NL",
              "en_NR",
              "en_NU",
              "en_NZ",
              "en_PG",
              "en_PH",
              "en_PK",
              "en_PN",
              "en_PR",
              "en_PW",
              "en_RW",
              "en_SB",
              "en_SC",
              "en_SD",
              "en_SG",
              "en_SH",
              "en_SL",
              "en_SS",
              "en_SX",
              "en_SZ",
              "en_TC",
              "en_TK",
              "en_TO",
              "en_TT",
              "en_TV",
              "en_TZ",
              "en_UG",
              "en_UM",
              "en_US",
              "en_VC",
              "en_VG",
              "en_VI",
              "en_VU",
              "en_WS",
              "en_ZA",
              "en_ZM",
              "en_ZW",
              "es_AR",
              "es_BO",
              "es_BZ",
              "es_CL",
              "es_CO",
              "es_CR",
              "es_CU",
              "es_DO",
              "es_EA",
              "es_EC",
              "es_EH",
              "es_ES",
              "es_GQ",
              "es_GT",
              "es_HN",
              "es_IC",
              "es_LA",
              "es_MX",
              "es_NI",
              "es_PA",
              "es_PE",
              "es_PH",
              "es_PR",
              "es_PY",
              "es_SV",
              "es_US",
              "es_UY",
              "es_VE",
              "et_EE",
              "fa_AF",
              "fa_IR",
              "fan_GA",
              "ff_CM",
              "ff_GN",
              "ff_MR",
              "ff_SN",
              "ff_BF",
              "fi_FI",
              "fj_FJ",
              "fo_FO",
              "fr_BE",
              "fr_BF",
              "fr_BI",
              "fr_BJ",
              "fr_BL",
              "fr_CA",
              "fr_CD",
              "fr_CF",
              "fr_CG",
              "fr_CH",
              "fr_CI",
              "fr_CM",
              "fr_DJ",
              "fr_DZ",
              "fr_FR",
              "fr_GA",
              "fr_GF",
              "fr_GG",
              "fr_GN",
              "fr_GP",
              "fr_GQ",
              "fr_HT",
              "fr_KM",
              "fr_JE",
              "fr_LU",
              "fr_LB",
              "fr_MA",
              "fr_MC",
              "fr_MF",
              "fr_MG",
              "fr_ML",
              "fr_MQ",
              "fr_MR",
              "fr_MU",
              "fr_NC",
              "fr_NE",
              "fr_PF",
              "fr_PM",
              "fr_RE",
              "fr_RW",
              "fr_SC",
              "fr_SN",
              "fr_SY",
              "fr_TD",
              "fr_TF",
              "fr_TG",
              "fr_TN",
              "fr_VU",
              "fr_VA",
              "fr_WF",
              "fr_YT",
              "ga_IE",
              "gn_PY",
              "gn_AR",
              "gu_IN",
              "gv_IM",
              "he_IL",
              "hi_IN",
              "hr_BA",
              "hr_HR",
              "hr_ME",
              "ht_HT",
              "hu_HU",
              "hy_AM",
              "hy_CY",
              "id_ID",
              "is_IS",
              "it_CH",
              "it_IT",
              "it_SM",
              "it_VA",
              "ja_JP",
              "ka_GE",
              "kg_CD",
              "kk_KZ",
              "kl_GL",
              "km_KH",
              "ko_KP",
              "ko_KR",
              "ku_IQ",
              "ky_KG",
              "la_VA",
              "lb_LU",
              "ln_AO",
              "ln_CD",
              "ln_CF",
              "ln_CG",
              "lo_LA",
              "lt_LT",
              "lu_CD",
              "lv_LV",
              "mg_MG",
              "mh_MH",
              "mi_NZ",
              "mk_MK",
              "mn_MN",
              "mr_IN",
              "ms_BN",
              "ms_MY",
              "ms_SG",
              "mt_MT",
              "my_MM",
              "nb_NO",
              "nb_BV",
              "nb_ZW",
              "ne_NP",
              "nl_AW",
              "nl_BE",
              "nl_BQ",
              "nl_CW",
              "nl_NL",
              "nl_SR",
              "nl_SX",
              "nl_MF",
              "nn_NO",
              "nn_BV",
              "no_NO",
              "no_BV",
              "no_SJ",
              "nr_ZA",
              "ny_MW",
              "pa_IN",
              "pa_PK",
              "pl_PL",
              "ps_AF",
              "pt_AO",
              "pt_BR",
              "pt_CH",
              "pt_CV",
              "pt_GQ",
              "pt_GW",
              "pt_LU",
              "pt_MO",
              "pt_MZ",
              "pt_PT",
              "pt_ST",
              "pt_TL",
              "qu_BO",
              "qu_EC",
              "qu_PE",
              "rar_CK",
              "rm_CH",
              "rup_MK",
              "ro_MD",
              "ro_RO",
              "ru_BY",
              "ru_KG",
              "ru_KZ",
              "ru_MD",
              "ru_RU",
              "ru_UA",
              "ru_AQ",
              "ru_TJ",
              "ru_TM",
              "ru_UZ",
              "rw_RW",
              "se_SE",
              "sg_CF",
              "si_LK",
              "sk_SK",
              "sl_SI",
              "sm_AS",
              "sm_WS",
              "sn_ZW",
              "so_DJ",
              "so_ET",
              "so_KE",
              "so_SO",
              "sq_AL",
              "sq_ME",
              "sq_XK",
              "sr_BA",
              "sr_ME",
              "sr_RS",
              "sr_XK",
              "ss_SZ",
              "ss_ZA",
              "sv_AX",
              "sv_FI",
              "sv_SE",
              "sw_KE",
              "sw_TZ",
              "sw_UG",
              "sw_CD",
              "ta_IN",
              "ta_MY",
              "ta_SG",
              "ta_LK",
              "te_IN",
              "tg_TJ",
              "th_TH",
              "ti_ER",
              "ti_ET",
              "tig_ER",
              "tk_TM",
              "tk_AF",
              "tn_BW",
              "tn_ZA",
              "to_TO",
              "tr_CY",
              "tr_TR",
              "ts_ZA",
              "uk_UA",
              "ur_IN",
              "ur_PK",
              "uz_AF",
              "uz_UZ",
              "ve_ZA",
              "vi_VN",
              "xh_ZA",
              "zh_CN",
              "zh_HK",
              "zh_MO",
              "zh_SG",
              "zh_TW",
              "zu_ZA",
              null
            ],
            "description": "The Locale Code of the language",
            "example": "en_GB",
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
      "ManagerRoleApiModel": {
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
          "label": {
            "type": "string",
            "description": "The label of the role type",
            "example": "Admin",
            "nullable": true
          },
          "role_type": {
            "description": "The manager role type (e.g., admin, viewer)",
            "example": "admin",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/RoleTypeEnum"
              }
            ]
          }
        }
      },
      "MaritalStatusEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "single",
              "married",
              "common_law",
              "divorced",
              "widowed",
              "domestic_partnership",
              "separated",
              "other",
              "not_disclosed",
              "unmapped_value",
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
      "NationalIdentityNumberApiModel": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "example": "123456789",
            "nullable": true
          },
          "type": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/NationalIdentityNumberTypeEnumApiModel"
              }
            ]
          },
          "country": {
            "description": "The country code",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/CountryCodeEnum"
              }
            ]
          }
        }
      },
      "NationalIdentityNumberTypeEnumApiModel": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "ssn",
              "nin",
              "sin",
              "nid",
              "pin",
              "pn",
              "umcn",
              "pic",
              "ric",
              "idnum",
              "cid",
              "nidnr",
              "pan",
              "aadhaar",
              "epic",
              "ptn",
              "itin",
              "tin",
              "uprc",
              "pcode",
              "ssi",
              "cedula",
              "passport",
              "voterid",
              "ntin",
              "bn",
              "fnr",
              "mva",
              "civil_id",
              "cnic",
              "nric",
              "fin",
              "uen",
              "registrationnumber",
              "nic",
              "personnummer",
              "ahv",
              "id",
              "eid",
              "va",
              "pid",
              "nrt",
              "nipt",
              "cbu",
              "cuit",
              "dni",
              "businessid",
              "vnr",
              "abn",
              "acn",
              "tfn",
              "jmbg",
              "bis",
              "insz",
              "nn",
              "egn",
              "pnf",
              "vat",
              "cnpj",
              "unp",
              "gst",
              "pst",
              "qst",
              "ni",
              "dic",
              "rc",
              "uid",
              "rut",
              "uscc",
              "cpf",
              "cpj",
              "cr",
              "stnr",
              "svnr",
              "ncf",
              "rnc",
              "nif",
              "ci",
              "ik",
              "kmkr",
              "registrikood",
              "tn",
              "ruc",
              "nit",
              "alv",
              "hetu",
              "ytunnus",
              "vn",
              "utr",
              "nifp",
              "amka",
              "cui",
              "nir",
              "siren",
              "siret",
              "tva",
              "oib",
              "hkid",
              "anum",
              "kennitala",
              "vsk",
              "npwp",
              "pps",
              "gstin",
              "idnr",
              "hr",
              "aic",
              "codicefiscale",
              "iva",
              "peid",
              "asmens",
              "pvm",
              "ctps",
              "vrn",
              "vtk",
              "int",
              "tk",
              "pas",
              "rne",
              "rg",
              "nci",
              "crnm",
              "pis",
              "insee",
              "tax",
              "mpf",
              "epfo",
              "esi",
              "pran",
              "uan",
              "idk",
              "bsn",
              "mid",
              "sss",
              "nie",
              "nss",
              "arc",
              "curp",
              "imss",
              "rfc",
              "ein",
              "other",
              "unknown",
              null
            ],
            "description": "The type of the national identity number",
            "example": "ssn",
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
      "PayFrequencyEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "hourly",
              "weekly",
              "bi_weekly",
              "four_weekly",
              "semi_monthly",
              "monthly",
              "bi_monthly",
              "quarterly",
              "semi_annually",
              "yearly",
              "thirteen_monthly",
              "pro_rata",
              "unmapped_value",
              "half_yearly",
              "daily",
              "fixed",
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
      "PayPeriodEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "hour",
              "day",
              "week",
              "every_two_weeks",
              "month",
              "quarter",
              "every_six_months",
              "year",
              "unmapped_value",
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
      "PreferredLanguageEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "aar",
              "afr",
              "amh",
              "ara",
              "aym",
              "aze",
              "bel",
              "bul",
              "bis",
              "ben",
              "bos",
              "byn",
              "cat",
              "cha",
              "ces",
              "deu",
              "div",
              "dzo",
              "ell",
              "eng",
              "spa",
              "est",
              "fas",
              "fan",
              "ful",
              "fin",
              "fij",
              "fao",
              "fra",
              "gle",
              "grn",
              "glv",
              "heb",
              "hin",
              "hrv",
              "hat",
              "hun",
              "hye",
              "ind",
              "isl",
              "ita",
              "jpn",
              "kat",
              "kon",
              "kaz",
              "kal",
              "khm",
              "kor",
              "kur",
              "kir",
              "lat",
              "ltz",
              "lin",
              "lao",
              "lit",
              "lub",
              "lav",
              "mlg",
              "mah",
              "mri",
              "mkd",
              "msa",
              "mlt",
              "mya",
              "nob",
              "nep",
              "nld",
              "nno",
              "nor",
              "nbl",
              "nya",
              "pan",
              "pol",
              "pus",
              "por",
              "rar",
              "roh",
              "rup",
              "ron",
              "rus",
              "kin",
              "sag",
              "sin",
              "slk",
              "smo",
              "sna",
              "som",
              "sqi",
              "srp",
              "ssw",
              "swe",
              "swa",
              "tam",
              "tgk",
              "tha",
              "tir",
              "tig",
              "zho",
              "unmapped_value",
              null
            ],
            "description": "The ISO639-2 Code of the language",
            "example": "eng",
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
      "Proficiency": {
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
            "description": "The name associated with this proficiency",
            "example": "Expert",
            "nullable": true
          },
          "value": {
            "type": "string",
            "enum": [
              "1",
              "2",
              "3",
              "4",
              "5",
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
      "ProviderErrorApiModel": {
        "type": "object",
        "properties": {
          "status": {
            "type": "number",
            "example": 400,
            "nullable": true
          },
          "url": {
            "type": "string",
            "example": "https://api.someprovider.com/v1/endpoint",
            "nullable": true
          },
          "raw": {
            "type": "object",
            "nullable": true
          },
          "headers": {
            "type": "object",
            "example": {
              "date": "Tue, 02 Apr 2024 13:52:01 GMT",
              "content-type": "application/json; charset=utf-8",
              "transfer-encoding": "chunked",
              "connection": "close"
            },
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
      },
      "Reason": {
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
          }
        }
      },
      "Reference": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "The reference id",
            "example": "1687-3",
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
            "description": "The reference name",
            "example": "1687-4",
            "nullable": true
          },
          "active": {
            "description": "The reference status",
            "example": true,
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
          }
        }
      },
      "ReferencePaginated": {
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
              "$ref": "#/components/schemas/Reference"
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
      "ReferenceResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/Reference"
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
      "RoleTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "admin",
              "viewer",
              "editor",
              "basic",
              "guest",
              "unassigned",
              "restricted",
              "unmapped_value",
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
      "TeamTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "team",
              null
            ],
            "example": "team",
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
      "TimeEntries": {
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
          "employee_id": {
            "type": "string",
            "description": "The employee ID associated with this time entry",
            "example": "1687-3",
            "nullable": true
          },
          "remote_employee_id": {
            "type": "string",
            "description": "Provider's unique identifier of the employee associated with this time entry",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "start_time": {
            "type": "string",
            "description": "The start time of the time entry",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "end_time": {
            "type": "string",
            "description": "The end time of the time entry",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "hours_worked": {
            "type": "number",
            "description": "The hours worked in the time entry",
            "example": 8,
            "nullable": true
          },
          "break_duration": {
            "type": "number",
            "description": "The duration of the break taken during time entry in hours",
            "example": 0.5,
            "nullable": true
          },
          "status": {
            "description": "The status of the time entry",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/TimeEntryStatusEnum"
              }
            ]
          },
          "labor_type": {
            "description": "The labor type associated with this time entry",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/LaborTypeApiModel"
              }
            ]
          },
          "location": {
            "description": "The location of the time entry",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/Reference"
              }
            ]
          },
          "created_at": {
            "type": "string",
            "description": "The created_at date",
            "example": "2023-02-23T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "The updated_at date",
            "example": "2024-02-23T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "TimeEntriesPaginated": {
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
              "$ref": "#/components/schemas/TimeEntries"
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
      "TimeEntriesResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/TimeEntries"
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
      "TimeEntryStatusEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "approved",
              "unmapped_value",
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
      "TimeOff": {
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
          "employee_id": {
            "type": "string",
            "description": "The employee ID",
            "example": "1687-3",
            "nullable": true
          },
          "remote_employee_id": {
            "type": "string",
            "description": "Provider's unique identifier of the employee",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "approver_id": {
            "type": "string",
            "description": "The approver ID",
            "example": "1687-4",
            "nullable": true
          },
          "remote_approver_id": {
            "type": "string",
            "description": "Provider's unique identifier of the approver",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "status": {
            "description": "The status of the time off request",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/TimeOffStatusEnum"
              }
            ]
          },
          "type": {
            "description": "The type of the time off request",
            "deprecated": true,
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/TimeOffTypeEnum"
              }
            ]
          },
          "start_date": {
            "type": "string",
            "description": "The start date of the time off request",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "end_date": {
            "type": "string",
            "description": "The end date of the time off request",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "start_half_day": {
            "description": "True if the start of the time off request begins half way through the day",
            "example": true,
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
          "end_half_day": {
            "description": "True if the end of the time off request ends half way through the day",
            "example": true,
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
          "duration": {
            "type": "string",
            "description": "The duration of the time off request",
            "example": "P3Y6M4DT12H30M5S",
            "format": "duration",
            "nullable": true
          },
          "time_off_policy_id": {
            "type": "string",
            "description": "The time off policy id associated with this time off request",
            "example": "cx280928933",
            "nullable": true
          },
          "remote_time_off_policy_id": {
            "type": "string",
            "description": "Provider's unique identifier of the time off policy id associated with this time off request",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "reason": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/Reason"
              }
            ]
          },
          "created_date": {
            "type": "string",
            "description": "The created date of the time off request",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_date": {
            "type": "string",
            "description": "The updated date of the time off request",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "TimeOffBalanceResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/TimeOffBalances"
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
      "TimeOffBalances": {
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
          "employee_id": {
            "type": "string",
            "description": "The employee id associated with this balance",
            "example": "cx280928937",
            "nullable": true
          },
          "remote_employee_id": {
            "type": "string",
            "description": "Provider's unique identifier of the employee associated with this balance",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "policy_id": {
            "type": "string",
            "description": "The time off policy id associated with this balance",
            "example": "cx280928937",
            "nullable": true
          },
          "remote_policy_id": {
            "type": "string",
            "description": "Provider's unique identifier of the time off policy id associated with this balance",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "policy": {
            "description": "The time off policy associated with this balance",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/TimeOffPolicies"
              }
            ]
          },
          "current_balance": {
            "type": "number",
            "description": "The current numeric balance for the associated employee and time off policy",
            "example": 8,
            "nullable": true
          },
          "initial_balance": {
            "type": "number",
            "description": "The initial numeric balance for the associated employee and time off policy as of the balance start date",
            "example": 8,
            "nullable": true
          },
          "balance_unit": {
            "description": "The duration unit of the current balance",
            "example": "hours",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/TimeOffBalanceUnitEnum"
              }
            ]
          },
          "balance_start_date": {
            "type": "string",
            "description": "The date of when the initial balance quantity was set",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "balance_expiry_date": {
            "type": "string",
            "description": "The date of when the current balance expires",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "The updated_at date of this time off balance",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "TimeOffBalancesPaginated": {
        "type": "object",
        "properties": {
          "next": {
            "type": "string",
            "nullable": true
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/TimeOffBalances"
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
      "TimeOffBalanceUnitEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "minutes",
              "hours",
              "days",
              "weeks",
              "months",
              "years",
              "unknown",
              null
            ],
            "description": "The unified value for the duration unit. If the provider does not specify this unit, the value will be set to unknown",
            "example": "hours",
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
      "TimeOffPaginated": {
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
              "$ref": "#/components/schemas/TimeOff"
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
      "TimeOffPolicies": {
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
            "description": "The name of this policy",
            "example": "Holidays",
            "nullable": true
          },
          "description": {
            "type": "string",
            "description": "The description of this policy",
            "example": "Usable for regional and national holidays of employees.",
            "nullable": true
          },
          "type": {
            "description": "The type of this policy",
            "example": "holiday",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/TimeOffPolicyTypeEnum"
              }
            ]
          },
          "duration_unit": {
            "description": "The duration unit of the current policy",
            "example": "hours",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/TimeOffBalanceUnitEnum"
              }
            ]
          },
          "reasons": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Reason"
            }
          },
          "created_at": {
            "type": "string",
            "description": "The created_at date of this policy",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "The updated_at date of this policy",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "TimeOffPoliciesPaginated": {
        "type": "object",
        "properties": {
          "next": {
            "type": "string",
            "nullable": true
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/TimeOffPolicies"
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
      "TimeOffPolicyResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/TimeOffPolicies"
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
      "TimeOffPolicyTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "paid",
              "unpaid",
              "holiday",
              "vacation",
              "sick",
              "personal",
              "in_lieu",
              "bereavement",
              "jury_duty",
              "unmapped_value",
              null
            ],
            "description": "The unified value for the type of the time off policy. If the provider does not specify this unit, the value will be set to unmapped_value",
            "example": "holiday",
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
      "TimeOffResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/TimeOff"
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
      "TimeOffStatusEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "approved",
              "cancelled",
              "rejected",
              "pending",
              "unmapped_value",
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
      "TimeOffTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "sick",
              "unmapped_value",
              "vacation",
              "long_term_disability",
              "short_term_disability",
              "absent",
              "comp_time",
              "training",
              "annual_leave",
              "leave_of_absence",
              "break",
              "child_care_leave",
              "maternity_leave",
              "jury_duty",
              "bereavement_leave",
              "sabbatical",
              "accident",
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
      "TypeApiModel": {
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
          "label": {
            "type": "string",
            "description": "The label of the employment type",
            "example": "Permanent",
            "nullable": true
          },
          "type": {
            "description": "The type of employment (e.g., contractor, permanent)",
            "example": "permanent",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/TypeEnum"
              }
            ]
          }
        }
      },
      "TypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "contractor",
              "intern",
              "permanent",
              "apprentice",
              "freelance",
              "terminated",
              "temporary",
              "seasonal",
              "volunteer",
              "probation",
              "internal",
              "external",
              "expatriate",
              "employer_of_record",
              "casual",
              "Programme",
              "unmapped_value",
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
      "UnifiedWarningApiModel": {
        "type": "object",
        "properties": {
          "message": {
            "type": "string",
            "example": "The provided field type is not supported in the current model.",
            "nullable": true
          }
        }
      },
      "UpdateEmployeeApiModel": {
        "type": "object",
        "properties": {
          "first_name": {
            "type": "string",
            "description": "The employee first name",
            "example": "Isaac",
            "nullable": true
          },
          "last_name": {
            "type": "string",
            "description": "The employee last name",
            "example": "Newton",
            "nullable": true
          },
          "name": {
            "type": "string",
            "description": "The employee name",
            "example": "Isaac Newton",
            "nullable": true
          },
          "display_name": {
            "type": "string",
            "description": "The employee display name",
            "example": "Sir Isaac Newton",
            "nullable": true
          },
          "avatar_url": {
            "type": "string",
            "description": "The employee avatar Url",
            "example": "https://example.com/avatar.png",
            "nullable": true
          },
          "personal_email": {
            "type": "string",
            "description": "The employee personal email",
            "example": "isaac.newton@example.com",
            "nullable": true
          },
          "personal_phone_number": {
            "type": "string",
            "description": "The employee personal phone number",
            "example": "+1234567890",
            "nullable": true
          },
          "work_email": {
            "type": "string",
            "description": "The employee work email",
            "example": "newton@example.com",
            "nullable": true
          },
          "work_phone_number": {
            "type": "string",
            "description": "The employee work phone number",
            "example": "+1234567890",
            "nullable": true
          },
          "job_id": {
            "type": "string",
            "description": "The employee job id",
            "example": "R-6789",
            "nullable": true
          },
          "job_title": {
            "type": "string",
            "description": "The employee job title",
            "example": "Physicist",
            "nullable": true
          },
          "department_id": {
            "type": "string",
            "description": "The employee department id",
            "example": "3093",
            "nullable": true
          },
          "team_id": {
            "type": "string",
            "description": "The employee team id",
            "example": "2913",
            "nullable": true
          },
          "department": {
            "type": "string",
            "description": "The employee department",
            "example": "Physics",
            "nullable": true
          },
          "manager_id": {
            "type": "string",
            "description": "The employee manager ID",
            "example": "67890",
            "nullable": true
          },
          "gender": {
            "description": "The employee gender",
            "example": "male",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/GenderEnum"
              }
            ]
          },
          "preferred_language": {
            "description": "The employee preferred language",
            "example": "en_US",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/PreferredLanguageEnum"
              }
            ]
          },
          "ethnicity": {
            "description": "The employee ethnicity",
            "example": "white",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EthnicityEnum"
              }
            ]
          },
          "date_of_birth": {
            "type": "string",
            "description": "The employee date_of_birth",
            "example": "1990-01-01T00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "birthday": {
            "type": "string",
            "description": "The employee birthday",
            "example": "2021-01-01T00:00:00Z",
            "format": "date-time",
            "nullable": true
          },
          "marital_status": {
            "description": "The employee marital status",
            "example": "single",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/MaritalStatusEnum"
              }
            ]
          },
          "avatar": {
            "description": "The employee avatar",
            "example": "https://example.com/avatar.png",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/Image"
              }
            ]
          },
          "hire_date": {
            "type": "string",
            "description": "The employee hire date",
            "example": "2021-01-01T00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "start_date": {
            "type": "string",
            "description": "The employee start date",
            "example": "2021-01-01T00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "employment_type": {
            "description": "The employee employment type",
            "example": "full_time",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmploymentTypeEnum"
              }
            ]
          },
          "employment_contract_type": {
            "description": "The employment work schedule type (e.g., full-time, part-time)",
            "example": "full_time",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmploymentScheduleTypeEnum"
              }
            ]
          },
          "employment_status": {
            "description": "The employee employment status",
            "example": "active",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmploymentStatusEnum"
              }
            ]
          },
          "termination_date": {
            "type": "string",
            "description": "The employee termination date",
            "example": "2021-01-01T00:00:00Z",
            "format": "date-time",
            "nullable": true
          },
          "company_name": {
            "type": "string",
            "description": "The employee company name",
            "example": "Example Corp",
            "deprecated": true,
            "nullable": true
          },
          "company_id": {
            "type": "string",
            "description": "The employee company id",
            "example": "1234567890",
            "nullable": true
          },
          "citizenships": {
            "description": "The citizenships of the Employee",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CountryCodeEnum"
            }
          },
          "employment": {
            "description": "The employee employment",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/CreateEmploymentApiModel"
              }
            ]
          },
          "custom_fields": {
            "description": "The employee custom fields",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CustomFields"
            }
          },
          "benefits": {
            "description": "Current benefits of the employee",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CreateHRISBenefit"
            }
          },
          "employee_number": {
            "type": "string",
            "description": "The assigned employee number",
            "example": "125",
            "nullable": true
          },
          "national_identity_number": {
            "description": "The national identity number",
            "deprecated": true,
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/NationalIdentityNumberApiModel"
              }
            ]
          },
          "national_identity_numbers": {
            "description": "The national identity numbers",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/NationalIdentityNumberApiModel"
            }
          },
          "home_location": {
            "description": "The employee home location",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/CreateEmployeeLocationApiModel"
              }
            ]
          },
          "work_location": {
            "description": "The employee work location",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/CreateEmployeeLocationApiModel"
              }
            ]
          }
        }
      },
      "WorkEligibility": {
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
          "type": {
            "example": "visa",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/WorkEligibilityTypeEnum"
              }
            ]
          },
          "sub_type": {
            "type": "string",
            "example": "H1B",
            "nullable": true
          },
          "document": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/File"
              }
            ]
          },
          "valid_from": {
            "type": "string",
            "example": "2021-01-01T00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "valid_to": {
            "type": "string",
            "example": "2021-01-01T00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "issued_by": {
            "description": "The country code of the issued by authority",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/CountryCodeEnum"
              }
            ]
          },
          "number": {
            "type": "string",
            "example": "1234567890",
            "nullable": true
          }
        }
      },
      "WorkEligibilityPaginated": {
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
              "$ref": "#/components/schemas/WorkEligibility"
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
      "WorkEligibilityResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/WorkEligibility"
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
      "WorkEligibilityTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "visa",
              "passport",
              "driver_license",
              "birth_certificate",
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
      "WriteResultApiModel": {
        "type": "object",
        "properties": {
          "statusCode": {
            "type": "number",
            "example": 201,
            "nullable": true
          },
          "message": {
            "type": "string",
            "example": "Employee created successfully",
            "nullable": true
          },
          "timestamp": {
            "type": "string",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "provider_errors": {
            "example": [
              {
                "status": 400,
                "url": "https://api.someprovider.com/v1/endpoint",
                "raw": {
                  "error": "Bad Request",
                  "message": "The supplied data is invalid"
                },
                "headers": {
                  "date": "Tue, 02 Apr 2024 13:52:01 GMT",
                  "content-type": "application/json; charset=utf-8",
                  "transfer-encoding": "chunked",
                  "connection": "close"
                }
              }
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ProviderErrorApiModel"
            }
          },
          "unified_warnings": {
            "example": [
              {
                "message": "The provided field type is not supported in the current model."
              }
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/UnifiedWarningApiModel"
            }
          }
        }
      }
    }
  }
} as const;
