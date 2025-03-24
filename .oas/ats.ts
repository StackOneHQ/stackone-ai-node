// Generated OpenAPI specification for ats
export const atsSpec = {
  "openapi": "3.1.0",
  "paths": {
    "/unified/ats/applications": {
      "get": {
        "operationId": "ats_list_applications",
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
              "example": "id,remote_id,candidate_id,remote_candidate_id,job_id,remote_job_id,job_posting_id,remote_job_posting_id,interview_stage,interview_stage_id,remote_interview_stage_id,rejected_reason,rejected_reason_id,remote_rejected_reason_id,rejected_reason_ids,remote_rejected_reason_ids,rejected_reasons,rejected_at,location_id,remote_location_id,location_ids,remote_location_ids,status,application_status,questionnaires,attachments,result_links,source,created_at,updated_at,documents,custom_fields,candidate",
              "type": "string"
            }
          },
          {
            "name": "filter",
            "required": false,
            "in": "query",
            "description": "ATS Application Filter",
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
                "created_after": {
                  "description": "Use a string with a date to only select results created after that given date",
                  "example": "2020-01-01T00:00:00.000Z",
                  "type": "string",
                  "nullable": true,
                  "additionalProperties": false
                },
                "job_id": {
                  "description": "Filter to select applications by job_id",
                  "type": "string",
                  "nullable": true
                },
                "stage": {
                  "description": "Filter to select applications by stage and sub-stage",
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
            "name": "sync_token",
            "required": false,
            "in": "query",
            "description": "The sync token to select the only updated results",
            "deprecated": true,
            "schema": {
              "nullable": true,
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
              "example": "documents",
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
              "example": "attachments,custom_fields",
              "type": "string"
            }
          },
          {
            "name": "job_id",
            "required": false,
            "in": "query",
            "description": "Filter for job ID to retrieve a list of applications related to this job",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "example": "cxQiyiuasdFKfdsYfer",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The list of applications was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApplicationsPaginated"
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
        "summary": "List Applications",
        "tags": [
          "Applications"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "list_applications",
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
        "operationId": "ats_create_application",
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
                "$ref": "#/components/schemas/AtsCreateApplicationRequestDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "The application was created successfully.",
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
        "summary": "Create Application",
        "tags": [
          "Applications"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "create_application",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/applications/{id}": {
      "get": {
        "operationId": "ats_get_application",
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
              "example": "id,remote_id,candidate_id,remote_candidate_id,job_id,remote_job_id,job_posting_id,remote_job_posting_id,interview_stage,interview_stage_id,remote_interview_stage_id,rejected_reason,rejected_reason_id,remote_rejected_reason_id,rejected_reason_ids,remote_rejected_reason_ids,rejected_reasons,rejected_at,location_id,remote_location_id,location_ids,remote_location_ids,status,application_status,questionnaires,attachments,result_links,source,created_at,updated_at,documents,custom_fields,candidate",
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
              "example": "documents",
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
              "example": "attachments,custom_fields",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The application with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApplicationResult"
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
        "summary": "Get Application",
        "tags": [
          "Applications"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_application",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      },
      "patch": {
        "operationId": "ats_update_application",
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
                "$ref": "#/components/schemas/AtsUpdateApplicationRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Record updated successfully.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateResult"
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
        "summary": "Update an Application",
        "tags": [
          "Applications"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "update_application",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/applications/{id}/offers": {
      "get": {
        "operationId": "ats_list_applications_offers",
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
              "example": "id,remote_id,application_id,remote_application_id,start_date,status,offer_status,salary,currency,created_at,updated_at,offer_history",
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
            "name": "sync_token",
            "required": false,
            "in": "query",
            "description": "The sync token to select the only updated results",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The offers related to the application with the given identifier were retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/OffersPaginated"
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
        "summary": "List Application Offers",
        "tags": [
          "Applications",
          "Offers"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "list_applications_offers",
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
    "/unified/ats/applications/{id}/move": {
      "post": {
        "operationId": "ats_move_application",
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
                "$ref": "#/components/schemas/AtsMoveApplicationRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "The application was moved successfully.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/MoveApplicationResult"
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
        "summary": "Move Application",
        "tags": [
          "Applications"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "move_application",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/applications/{id}/reject": {
      "post": {
        "operationId": "ats_reject_application",
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
                "$ref": "#/components/schemas/AtsRejectApplicationRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "The application was rejected successfully.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RejectApplicationResult"
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
        "summary": "Reject Application",
        "tags": [
          "Applications"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "reject_application",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/applications/{id}/offers/{subResourceId}": {
      "get": {
        "operationId": "ats_get_application_offer",
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
              "example": "id,remote_id,application_id,remote_application_id,start_date,status,offer_status,salary,currency,created_at,updated_at,offer_history",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The offer related to the application with the given identifiers was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/OffersResult"
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
        "summary": "Get Application Offer",
        "tags": [
          "Applications",
          "Offers"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_application_offer",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/applications/{id}/scorecards": {
      "get": {
        "operationId": "ats_list_application_scorecards",
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
              "example": "id,remote_id,sections,label,candidate_id,remote_candidate_id,application_id,remote_application_id,interview_id,remote_interview_id,author_id,remote_author_id,overall_recommendation,created_at,updated_at",
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
            "name": "sync_token",
            "required": false,
            "in": "query",
            "description": "The sync token to select the only updated results",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The scorecards related to the application with the given identifier were retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ScorecardsPaginated"
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
        "summary": "List Application Scorecards",
        "tags": [
          "Applications",
          "Scorecards"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "list_application_scorecards",
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
    "/unified/ats/applications/{id}/scorecards/{subResourceId}": {
      "get": {
        "operationId": "ats_get_application_scorecard",
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
              "example": "id,remote_id,sections,label,candidate_id,remote_candidate_id,application_id,remote_application_id,interview_id,remote_interview_id,author_id,remote_author_id,overall_recommendation,created_at,updated_at",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The scorecard related to the application with the given identifiers was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ScorecardsResult"
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
        "summary": "Get Application Scorecard",
        "tags": [
          "Applications"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_application_scorecard",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/applications/{id}/notes": {
      "get": {
        "operationId": "ats_list_application_notes",
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
              "example": "id,remote_id,content,author_id,remote_author_id,visibility,created_at,updated_at,deleted_at",
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
            "name": "sync_token",
            "required": false,
            "in": "query",
            "description": "The sync token to select the only updated results",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The notes related to the application with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/NotesPaginated"
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
        "summary": "List Application Notes",
        "tags": [
          "Applications",
          "Notes"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "list_application_notes",
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
        "operationId": "ats_create_application_note",
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
                "$ref": "#/components/schemas/AtsCreateNotesRequestDto"
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
        "summary": "Create Application Note",
        "tags": [
          "Applications",
          "Notes"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "create_application_note",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/applications/{id}/notes/{subResourceId}": {
      "get": {
        "operationId": "ats_get_application_note",
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
              "example": "id,remote_id,content,author_id,remote_author_id,visibility,created_at,updated_at,deleted_at",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The note with the given identifier related to the application with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/NoteResult"
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
        "summary": "Get Application Note",
        "tags": [
          "Applications",
          "Notes"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_application_note",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      },
      "patch": {
        "operationId": "ats_update_application_note",
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
                "$ref": "#/components/schemas/AtsUpdateNotesRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Record updated successfully.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateResult"
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
        "summary": "Update an Application Note",
        "tags": [
          "Applications",
          "Notes"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "update_application_note",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/applications/{id}/scheduled_interviews": {
      "get": {
        "operationId": "ats_list_applications_scheduled_interviews",
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
              "example": "id,remote_id,application_id,remote_application_id,interview_stage_id,remote_interview_stage_id,interview_stage,status,interview_status,interviewer_ids,remote_interviewer_ids,interview_parts,interviewers,start_at,end_at,meeting_url,created_at,updated_at",
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
            "name": "sync_token",
            "required": false,
            "in": "query",
            "description": "The sync token to select the only updated results",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The list of applications scheduled interviews was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ScheduledInterviewsPaginated"
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
        "summary": "List Applications scheduled interviews",
        "tags": [
          "Applications",
          "Scheduled Interviews"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "list_applications_scheduled_interviews",
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
    "/unified/ats/applications/{id}/scheduled_interviews/{subResourceId}": {
      "get": {
        "operationId": "ats_get_application_scheduled_interview",
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
              "example": "id,remote_id,candidate_id,remote_candidate_id,job_id,remote_job_id,job_posting_id,remote_job_posting_id,interview_stage,interview_stage_id,remote_interview_stage_id,rejected_reason,rejected_reason_id,remote_rejected_reason_id,rejected_reason_ids,remote_rejected_reason_ids,rejected_reasons,rejected_at,location_id,remote_location_id,location_ids,remote_location_ids,status,application_status,questionnaires,attachments,result_links,source,created_at,updated_at,documents,custom_fields,candidate",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The applications scheduled interview with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ScheduledInterviewsResult"
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
        "summary": "Get Applications scheduled interview",
        "tags": [
          "Applications",
          "Scheduled Interviews"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_application_scheduled_interview",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/applications/{id}/documents/upload": {
      "post": {
        "operationId": "ats_upload_application_document",
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
                "$ref": "#/components/schemas/UnifiedUploadRequestDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "The document related to the application with the given identifier was uploaded.",
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
        "summary": "Upload Application Document",
        "tags": [
          "Applications",
          "Documents"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "upload_application_document",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/applications/{id}/documents/{subResourceId}/download": {
      "get": {
        "operationId": "ats_download_application_document",
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
            "description": "The document related to the application with the given identifiers was retrieved.",
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
        "summary": "Download Application Document",
        "tags": [
          "Applications",
          "Documents"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "download_application_document",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/applications/{id}/documents": {
      "get": {
        "operationId": "ats_list_application_documents",
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
            "description": "ATS Document Filter",
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
                "type": {
                  "description": "Filter to select documents by type",
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
            "name": "sync_token",
            "required": false,
            "in": "query",
            "description": "The sync token to select the only updated results",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The documents related to the application with the given identifier were retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AtsDocumentsPaginated"
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
        "summary": "List Application Documents",
        "tags": [
          "Applications",
          "Documents"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "list_application_documents",
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
    "/unified/ats/applications/{id}/documents/{subResourceId}": {
      "get": {
        "operationId": "ats_get_application_document",
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
            "description": "The document related to the application with the given identifiers was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AtsDocumentResult"
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
        "summary": "Get Application Document",
        "tags": [
          "Applications",
          "Documents"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_application_document",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/candidates": {
      "get": {
        "operationId": "ats_list_candidates",
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
              "example": "id,remote_id,name,first_name,last_name,email,emails,social_links,phone,phone_numbers,company,country,title,application_ids,remote_application_ids,hired_at,custom_fields,created_at,updated_at",
              "type": "string"
            }
          },
          {
            "name": "filter",
            "required": false,
            "in": "query",
            "description": "ATS Candidate Filter",
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
                "created_after": {
                  "description": "Use a string with a date to only select results created after that given date",
                  "example": "2020-01-01T00:00:00.000Z",
                  "type": "string",
                  "nullable": true,
                  "additionalProperties": false
                },
                "email": {
                  "description": "Filter to select candidates by email",
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
            "name": "sync_token",
            "required": false,
            "in": "query",
            "description": "The sync token to select the only updated results",
            "deprecated": true,
            "schema": {
              "nullable": true,
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
            "description": "The list of candidates was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CandidatesPaginated"
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
        "summary": "List Candidates",
        "tags": [
          "Candidates"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "list_candidates",
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
        "operationId": "ats_create_candidate",
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
                "$ref": "#/components/schemas/AtsCreateCandidateRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "The candidate was successfully created.",
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
        "summary": "Create Candidate",
        "tags": [
          "Candidates"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "create_candidate",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/candidates/{id}": {
      "get": {
        "operationId": "ats_get_candidate",
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
              "example": "id,remote_id,name,first_name,last_name,email,emails,social_links,phone,phone_numbers,company,country,title,application_ids,remote_application_ids,hired_at,custom_fields,created_at,updated_at",
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
            "description": "The candidate with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CandidateResult"
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
        "summary": "Get Candidate",
        "tags": [
          "Candidates"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_candidate",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      },
      "patch": {
        "operationId": "ats_update_candidate",
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
                "$ref": "#/components/schemas/AtsUpdateCandidateRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "The candidate was successfully updated.",
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
        "summary": "Update Candidate",
        "tags": [
          "Candidates"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "update_candidate",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/candidates/{id}/notes": {
      "get": {
        "operationId": "ats_list_candidate_notes",
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
              "example": "id,remote_id,content,author_id,remote_author_id,visibility,created_at,updated_at,deleted_at",
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
            "name": "sync_token",
            "required": false,
            "in": "query",
            "description": "The sync token to select the only updated results",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The notes related to the candidate with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/NotesPaginated"
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
        "summary": "List Candidate Notes",
        "tags": [
          "Candidates",
          "Notes"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "list_candidate_notes",
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
        "operationId": "ats_create_candidate_note",
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
                "$ref": "#/components/schemas/AtsCreateNotesRequestDto"
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
        "summary": "Create Candidate Note",
        "tags": [
          "Candidates",
          "Notes"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "create_candidate_note",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/candidates/{id}/notes/{subResourceId}": {
      "get": {
        "operationId": "ats_get_candidate_note",
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
              "example": "id,remote_id,content,author_id,remote_author_id,visibility,created_at,updated_at,deleted_at",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The note with the given identifier related to the candidate with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/NoteResult"
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
        "summary": "Get Candidate Note",
        "tags": [
          "Candidates",
          "Notes"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_candidate_note",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/custom_field_definitions/applications": {
      "get": {
        "operationId": "ats_list_application_custom_field_definitions",
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
            "description": "The list of application custom field definitions was retrieved.",
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
        "summary": "List Application Custom Field Definitions",
        "tags": [
          "Custom Field Definitions"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "list_application_custom_field_definitions",
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
    "/unified/ats/custom_field_definitions/applications/{id}": {
      "get": {
        "operationId": "ats_get_application_custom_field_definition",
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
            "description": "The application custom field definition was retrieved.",
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
        "summary": "Get Application Custom Field Definition",
        "tags": [
          "Custom Field Definitions"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_application_custom_field_definition",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/custom_field_definitions/candidates": {
      "get": {
        "operationId": "ats_list_candidate_custom_field_definitions",
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
            "description": "The list of candidate custom field definitions was retrieved.",
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
        "summary": "List Candidate Custom Field Definitions",
        "tags": [
          "Custom Field Definitions"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "list_candidate_custom_field_definitions",
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
    "/unified/ats/custom_field_definitions/candidates/{id}": {
      "get": {
        "operationId": "ats_get_candidate_custom_field_definition",
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
            "description": "The candidate custom field definition was retrieved.",
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
        "summary": "Get Candidate Custom Field Definition",
        "tags": [
          "Custom Field Definitions"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_candidate_custom_field_definition",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/custom_field_definitions/jobs": {
      "get": {
        "operationId": "ats_list_job_custom_field_definitions",
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
            "description": "The list of job custom field definitions was retrieved.",
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
        "summary": "List Job Custom Field Definitions",
        "tags": [
          "Custom Field Definitions"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "list_job_custom_field_definitions",
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
    "/unified/ats/custom_field_definitions/jobs/{id}": {
      "get": {
        "operationId": "ats_get_job_custom_field_definition",
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
            "description": "The job custom field definition was retrieved.",
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
        "summary": "Get Job Custom Field Definition",
        "tags": [
          "Custom Field Definitions"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_job_custom_field_definition",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/departments": {
      "get": {
        "operationId": "ats_list_departments",
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
          },
          {
            "name": "sync_token",
            "required": false,
            "in": "query",
            "description": "The sync token to select the only updated results",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The list of departments was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DepartmentsPaginated"
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
        "summary": "List Departments",
        "tags": [
          "Departments"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "list_departments",
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
    "/unified/ats/departments/{id}": {
      "get": {
        "operationId": "ats_get_department",
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
            "description": "The department with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DepartmentResult"
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
        "summary": "Get Department",
        "tags": [
          "Departments"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_department",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/interview_stages": {
      "get": {
        "operationId": "ats_list_interview_stages",
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
              "example": "id,remote_id,name,order,created_at,updated_at",
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
            "name": "sync_token",
            "required": false,
            "in": "query",
            "description": "The sync token to select the only updated results",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The list of interview-stages was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/InterviewStagesPaginated"
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
        "summary": "List Interview Stages",
        "tags": [
          "Interview Stages"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "list_interview_stages",
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
    "/unified/ats/interview_stages/{id}": {
      "get": {
        "operationId": "ats_get_interview_stage",
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
              "example": "id,remote_id,name,order,created_at,updated_at",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The interview-stage with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/InterviewStageResult"
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
        "summary": "Get Interview Stage",
        "tags": [
          "Interview Stages"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_interview_stage",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/interviews": {
      "get": {
        "operationId": "ats_list_interviews",
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
              "example": "id,remote_id,application_id,remote_application_id,interview_stage_id,remote_interview_stage_id,interview_stage,status,interview_status,interviewer_ids,remote_interviewer_ids,interview_parts,interviewers,start_at,end_at,meeting_url,created_at,updated_at",
              "type": "string"
            }
          },
          {
            "name": "filter",
            "required": false,
            "in": "query",
            "description": "ATS Interviews Filter",
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
                "created_after": {
                  "description": "Use a string with a date to only select results created after that given date",
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
            "name": "sync_token",
            "required": false,
            "in": "query",
            "description": "The sync token to select the only updated results",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The list of interviews was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/InterviewsPaginated"
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
        "summary": "List Interviews",
        "tags": [
          "Interviews"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "list_interviews",
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
    "/unified/ats/interviews/{id}": {
      "get": {
        "operationId": "ats_get_interview",
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
              "example": "id,remote_id,application_id,remote_application_id,interview_stage_id,remote_interview_stage_id,interview_stage,status,interview_status,interviewer_ids,remote_interviewer_ids,interview_parts,interviewers,start_at,end_at,meeting_url,created_at,updated_at",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The interview with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/InterviewsResult"
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
        "summary": "Get Interview",
        "tags": [
          "Interviews"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_interview",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/jobs": {
      "get": {
        "operationId": "ats_list_jobs",
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
              "example": "id,remote_id,code,title,description,status,job_status,department_ids,remote_department_ids,location_ids,remote_location_ids,hiring_team,interview_stages,confidential,custom_fields,created_at,updated_at",
              "type": "string"
            }
          },
          {
            "name": "filter",
            "required": false,
            "in": "query",
            "description": "ATS Jobs filters",
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
                "created_after": {
                  "description": "Use a string with a date to only select results created after that given date",
                  "example": "2020-01-01T00:00:00.000Z",
                  "type": "string",
                  "nullable": true,
                  "additionalProperties": false
                },
                "status": {
                  "description": "The status of the job",
                  "enum": [
                    "open",
                    "draft",
                    null
                  ],
                  "nullable": true,
                  "type": "string",
                  "deprecated": true
                },
                "job_status": {
                  "description": "The job_status of the job",
                  "enum": [
                    "open",
                    "draft",
                    null
                  ],
                  "nullable": true,
                  "type": "string"
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
            "name": "sync_token",
            "required": false,
            "in": "query",
            "description": "The sync token to select the only updated results",
            "deprecated": true,
            "schema": {
              "nullable": true,
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
              "example": "job_postings,interview_stages",
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
        "x-speakeasy-group": "ats",
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
      },
      "post": {
        "operationId": "ats_create_job",
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
                "$ref": "#/components/schemas/AtsCreateJobRequestDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "The job was successfully created.",
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
        "summary": "Create Job",
        "tags": [
          "Jobs"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "create_job",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/jobs/{id}": {
      "get": {
        "operationId": "ats_get_job",
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
              "example": "id,remote_id,code,title,description,status,job_status,department_ids,remote_department_ids,location_ids,remote_location_ids,hiring_team,interview_stages,confidential,custom_fields,created_at,updated_at",
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
              "example": "job_postings,interview_stages",
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
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_job",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      },
      "patch": {
        "operationId": "ats_update_job",
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
                "$ref": "#/components/schemas/AtsUpdateJobRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "The job was successfully updated.",
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
        "summary": "Update Job",
        "tags": [
          "Jobs"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "update_job",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/lists": {
      "get": {
        "operationId": "ats_list_lists",
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
        "x-speakeasy-group": "ats",
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
    "/unified/ats/lists/{id}": {
      "get": {
        "operationId": "ats_get_list",
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
        "x-speakeasy-group": "ats",
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
    "/unified/ats/locations": {
      "get": {
        "operationId": "ats_list_locations",
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
          },
          {
            "name": "sync_token",
            "required": false,
            "in": "query",
            "description": "The sync token to select the only updated results",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The list of locations was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ATSLocationsPaginated"
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
        "summary": "List locations",
        "tags": [
          "Locations"
        ],
        "x-speakeasy-group": "ats",
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
    "/unified/ats/locations/{id}": {
      "get": {
        "operationId": "ats_get_location",
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
            "description": "The location with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ATSLocationResult"
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
        "summary": "Get Location",
        "tags": [
          "Locations"
        ],
        "x-speakeasy-group": "ats",
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
    "/unified/ats/rejected_reasons": {
      "get": {
        "operationId": "ats_list_rejected_reasons",
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
              "example": "id,remote_id,label,type,rejected_reason_type",
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
            "name": "sync_token",
            "required": false,
            "in": "query",
            "description": "The sync token to select the only updated results",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The list of rejected reasons was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RejectedReasonsPaginated"
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
        "summary": "List Rejected Reasons",
        "tags": [
          "Rejected Reasons"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "list_rejected_reasons",
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
    "/unified/ats/rejected_reasons/{id}": {
      "get": {
        "operationId": "ats_get_rejected_reason",
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
              "example": "id,remote_id,label,type,rejected_reason_type",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The rejected reason with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RejectedReasonResult"
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
        "summary": "Get Rejected Reason",
        "tags": [
          "Rejected Reasons"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_rejected_reason",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/users": {
      "get": {
        "operationId": "ats_list_users",
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
              "example": "id,remote_id,first_name,last_name,name,email,phone",
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
            "name": "sync_token",
            "required": false,
            "in": "query",
            "description": "The sync token to select the only updated results",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The list of users was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UsersPaginated"
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
        "summary": "List Users",
        "tags": [
          "Users"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "list_users",
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
    "/unified/ats/users/{id}": {
      "get": {
        "operationId": "ats_get_user",
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
              "example": "id,remote_id,first_name,last_name,name,email,phone",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The user with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UserResult"
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
        "summary": "Get User",
        "tags": [
          "Users"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_user",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/job_postings": {
      "get": {
        "operationId": "ats_list_job_postings",
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
              "example": "id,remote_id,title,locations,internal,status,job_id,remote_job_id,content,compensation,employment_type,employment_contract_type,external_url,external_apply_url,questionnaires,updated_at,created_at",
              "type": "string"
            }
          },
          {
            "name": "filter",
            "required": false,
            "in": "query",
            "description": "ATS Job Postings Filter",
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
                "created_after": {
                  "description": "Use a string with a date to only select results created after that given date",
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
            "name": "sync_token",
            "required": false,
            "in": "query",
            "description": "The sync token to select the only updated results",
            "deprecated": true,
            "schema": {
              "nullable": true,
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
              "example": "questionnaires",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The list of job postings was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/JobPostingsPaginated"
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
        "summary": "List Job Postings",
        "tags": [
          "Job Postings"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "list_job_postings",
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
    "/unified/ats/job_postings/{id}": {
      "get": {
        "operationId": "ats_get_job_posting",
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
              "example": "id,remote_id,title,locations,internal,status,job_id,remote_job_id,content,compensation,employment_type,employment_contract_type,external_url,external_apply_url,questionnaires,updated_at,created_at",
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
              "example": "questionnaires",
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
                  "$ref": "#/components/schemas/JobPostingResult"
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
        "summary": "Get Job Posting",
        "tags": [
          "Job Postings"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_job_posting",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/offers": {
      "get": {
        "operationId": "ats_list_offers",
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
              "example": "id,remote_id,application_id,remote_application_id,start_date,status,offer_status,salary,currency,created_at,updated_at,offer_history",
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
            "name": "sync_token",
            "required": false,
            "in": "query",
            "description": "The sync token to select the only updated results",
            "deprecated": true,
            "schema": {
              "nullable": true,
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The list of offers was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/OffersPaginated"
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
        "summary": "List Offers",
        "tags": [
          "Offers"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "list_offers",
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
        "operationId": "ats_create_offer",
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
                "$ref": "#/components/schemas/AtsCreateOfferRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "The offer was created successfully.",
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
        "summary": "Creates an offer",
        "tags": [
          "Offers"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "create_offer",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/offers/{id}": {
      "get": {
        "operationId": "ats_get_offer",
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
              "example": "id,remote_id,application_id,remote_application_id,start_date,status,offer_status,salary,currency,created_at,updated_at,offer_history",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The offer with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/OffersResult"
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
        "summary": "Get Offer",
        "tags": [
          "Offers"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_offer",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/assessments/packages": {
      "get": {
        "operationId": "ats_list_assessments_packages",
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
            "description": "The comma separated list of fields to return in the response (if empty, all fields are returned)",
            "schema": {
              "nullable": true,
              "type": "string"
            }
          },
          {
            "name": "filter",
            "required": false,
            "in": "query",
            "description": "Filter parameters that allow greater customisation of the list response",
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
            "description": "The list of assessments packages was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AssessmentPackagePaginated"
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
        "summary": "List Assessments Packages",
        "tags": [
          "Assessments",
          "Packages"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "list_assessments_packages",
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
    "/unified/ats/assessments/packages/{id}": {
      "get": {
        "operationId": "ats_get_assessments_package",
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
            "description": "The comma separated list of fields to return in the response (if empty, all fields are returned)",
            "schema": {
              "nullable": true,
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The assessments package with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AssessmentPackageResult"
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
        "summary": "Get Assessments Package",
        "tags": [
          "Assessments",
          "Packages"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_assessments_package",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/assessments/orders": {
      "post": {
        "operationId": "ats_order_assessments_request",
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
                "$ref": "#/components/schemas/AtsCreateCandidatesAssessmentsRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "The order request of the assessment for candidate.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateAssessmentOrderResult"
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
        "summary": "Order Assessments Request",
        "tags": [
          "Assessments",
          "Orders"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "order_assessments_request",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/assessments/orders/{id}": {
      "get": {
        "operationId": "ats_get_assessments_request",
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
              "example": "id,remote_id,package,application,job,candidate,requester,results_update_url",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The assessments order with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AssessmentOrderResult"
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
        "summary": "Get Assessments Requests",
        "tags": [
          "Assessments",
          "Orders"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_assessments_request",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/assessments/orders/{id}/result": {
      "patch": {
        "operationId": "ats_update_assessments_result",
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
                "$ref": "#/components/schemas/AtsUpdateCandidatesAssessmentsResultsRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "The result update of the assessment for candidate.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateResult"
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
        "summary": "Update Assessments Result",
        "tags": [
          "Assessments",
          "Results"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "update_assessments_result",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/assessments/orders/{id}/results": {
      "get": {
        "operationId": "ats_get_assessments_result",
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
              "example": "id,remote_id,candidate,score,start_date,submission_date,summary,result,result_url,attachments",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The assessments result with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AssessmentResultsResult"
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
        "summary": "Get Assessments Results",
        "tags": [
          "Assessments",
          "Results"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_assessments_result",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/background_checks/packages": {
      "get": {
        "operationId": "ats_list_background_check_packages",
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
              "example": "id,remote_id,name,description,tests",
              "type": "string"
            }
          },
          {
            "name": "filter",
            "required": false,
            "in": "query",
            "description": "Filter parameters that allow greater customisation of the list response",
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
            "description": "The list of background check packages was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/BackgroundCheckPackagePaginated"
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
        "summary": "List Background Check Packages",
        "tags": [
          "Background Checks",
          "Packages"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "list_background_check_packages",
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
        "operationId": "ats_create_background_check_package",
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
                "$ref": "#/components/schemas/AtsCreateBackgroundCheckPackagesRequestDto"
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
        "summary": "Create Background Check Package",
        "tags": [
          "Background Checks",
          "Packages"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "create_background_check_package",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/background_checks/packages/{id}": {
      "get": {
        "operationId": "ats_get_background_check_package",
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
              "example": "id,remote_id,name,description,tests",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The background check package with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/BackgroundCheckPackageResult"
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
        "summary": "Get Background Check Package",
        "tags": [
          "Background Checks",
          "Packages"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_background_check_package",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      },
      "patch": {
        "operationId": "ats_update_background_check_package",
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
                "$ref": "#/components/schemas/AtsUpdateBackgroundCheckPackagesRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Record updated successfully.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateResult"
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
        "summary": "Update Background Check Package",
        "tags": [
          "Background Checks",
          "Packages"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "update_background_check_package",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      },
      "delete": {
        "operationId": "ats_delete_background_check_package",
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
        "responses": {
          "200": {
            "description": "Record deleted successfully.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DeleteResult"
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
        "summary": "Delete Background Check Package",
        "tags": [
          "Background Checks",
          "Packages"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "delete_background_check_package",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/background_checks/orders": {
      "get": {
        "operationId": "ats_list_background_check_request",
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
              "example": "id,remote_id,package,application,job,candidate,requester,results_update_url",
              "type": "string"
            }
          },
          {
            "name": "filter",
            "required": false,
            "in": "query",
            "description": "Filter parameters that allow greater customisation of the list response",
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
            "description": "The list of background check requests was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/BackgroundCheckOrderPaginated"
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
        "summary": "List Background Check Request",
        "tags": [
          "Background Checks",
          "Orders"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "list_background_check_request",
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
        "operationId": "ats_order_background_check_request",
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
                "$ref": "#/components/schemas/AtsCreateBackgroundCheckOrderRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "The order request of the background check for candidate.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateBackgroundCheckOrderResult"
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
        "summary": "Order Background Check Request",
        "tags": [
          "Background Checks",
          "Orders"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "order_background_check_request",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/background_checks/orders/{id}": {
      "get": {
        "operationId": "ats_get_background_check_request",
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
              "example": "id,remote_id,package,application,job,candidate,requester,results_update_url",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The background check order with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/BackgroundCheckOrderResult"
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
        "summary": "Get Background Check Request",
        "tags": [
          "Background Checks",
          "Orders"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_background_check_request",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/background_checks/orders/{id}/result": {
      "patch": {
        "operationId": "ats_update_background_check_result",
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
                "$ref": "#/components/schemas/AtsUpdateBackgroundCheckResultRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "The result update of the background check for candidate.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateResult"
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
        "summary": "Update Background Check Result",
        "tags": [
          "Background Checks",
          "Results"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "update_background_check_result",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/ats/background_checks/orders/{id}/results": {
      "get": {
        "operationId": "ats_get_background_check_result",
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
              "example": "id,remote_id,candidate,score,start_date,submission_date,summary,result,result_url,attachments",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The background check result with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/BackgroundCheckResultsResult"
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
        "summary": "Get Background Check Results",
        "tags": [
          "Background Checks",
          "Results"
        ],
        "x-speakeasy-group": "ats",
        "x-speakeasy-name-override": "get_background_check_result",
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
    "title": "ATS",
    "description": "The documentation for the StackOne Unified API - ATS",
    "version": "1.0.0",
    "contact": {}
  },
  "tags": [
    {
      "name": "Application Notes",
      "description": ""
    },
    {
      "name": "Applications",
      "description": ""
    },
    {
      "name": "Assessments",
      "description": ""
    },
    {
      "name": "Background Checks",
      "description": ""
    },
    {
      "name": "Candidates",
      "description": ""
    },
    {
      "name": "Custom Field Definitions",
      "description": ""
    },
    {
      "name": "Departments",
      "description": ""
    },
    {
      "name": "Documents",
      "description": ""
    },
    {
      "name": "Interview Stages",
      "description": ""
    },
    {
      "name": "Interviews",
      "description": ""
    },
    {
      "name": "Job Postings",
      "description": ""
    },
    {
      "name": "Jobs",
      "description": ""
    },
    {
      "name": "Lists",
      "description": ""
    },
    {
      "name": "Locations",
      "description": ""
    },
    {
      "name": "Notes",
      "description": ""
    },
    {
      "name": "Offers",
      "description": ""
    },
    {
      "name": "Orders",
      "description": ""
    },
    {
      "name": "Packages",
      "description": ""
    },
    {
      "name": "Rejected Reasons",
      "description": ""
    },
    {
      "name": "Results",
      "description": ""
    },
    {
      "name": "Scheduled Interviews",
      "description": ""
    },
    {
      "name": "Scorecards",
      "description": ""
    },
    {
      "name": "Users",
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
      "Answer": {
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
            "description": "Type of the answer",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/AnswerEnum"
              }
            ]
          },
          "values": {
            "description": "Values of the answer",
            "example": [
              "Yes",
              "No Travel",
              "It sounds pretty cool.",
              "Excel",
              "Power Point"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "AnswerEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "short_text",
              "long_text",
              "attachment",
              "multi_select",
              "single_select",
              "boolean",
              "number",
              "date",
              "video",
              null
            ],
            "description": "The type of the answer.",
            "example": "short_text",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the answer type.",
            "example": "Short Text",
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
      "Application": {
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
          "candidate_id": {
            "type": "string",
            "description": "Unique identifier of the candidate",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "remote_candidate_id": {
            "type": "string",
            "description": "Provider's unique identifier of the candidate",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "job_id": {
            "type": "string",
            "description": "Unique identifier of the job",
            "example": "4071538b-3cac-4fbf-ac76-f78ed250ffdd",
            "nullable": true
          },
          "remote_job_id": {
            "type": "string",
            "description": "Provider's unique identifier of the job",
            "example": "4071538b-3cac-4fbf-ac76-f78ed250ffdd",
            "nullable": true
          },
          "interview_stage": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/InterviewStage"
              }
            ]
          },
          "interview_stage_id": {
            "type": "string",
            "description": "Unique identifier of the interview stage",
            "example": "18bcbb1b-3cbc-4198-a999-460861d19480",
            "nullable": true
          },
          "remote_interview_stage_id": {
            "type": "string",
            "description": "Provider's unique identifier of the interview stage",
            "example": "18bcbb1b-3cbc-4198-a999-460861d19480",
            "nullable": true
          },
          "rejected_reasons": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/RejectedReason"
            }
          },
          "rejected_reason_ids": {
            "description": "Unique identifiers of the rejection reasons",
            "example": [
              "f223d7f6-908b-48f0-9237-b201c307f609"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "remote_rejected_reason_ids": {
            "description": "Provider's unique identifiers of the rejection reasons",
            "example": [
              "f223d7f6-908b-48f0-9237-b201c307f609"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "rejected_at": {
            "type": "string",
            "description": "Date of rejection",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "location_id": {
            "type": "string",
            "description": "Unique identifier of the location",
            "example": "dd8d41d1-5eb8-4408-9c87-9ba44604eae4",
            "deprecated": true,
            "nullable": true
          },
          "remote_location_id": {
            "type": "string",
            "description": "Provider's unique identifier of the location",
            "example": "dd8d41d1-5eb8-4408-9c87-9ba44604eae4",
            "nullable": true
          },
          "location_ids": {
            "description": "Unique identifiers of the locations",
            "example": [
              "dd8d41d1-5eb8-4408-9c87-9ba44604eae4"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "remote_location_ids": {
            "description": "Remote's unique identifiers of the locations",
            "example": [
              "dd8d41d1-5eb8-4408-9c87-9ba44604eae4"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "application_status": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ApplicationStatusEnum"
              }
            ]
          },
          "questionnaires": {
            "description": "Questionnaires associated with the application",
            "example": {
              "id": "right_to_work",
              "answers": [
                {
                  "id": "answer1",
                  "type": "text",
                  "values": [
                    "Yes"
                  ]
                }
              ]
            },
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Questionnaire"
            }
          },
          "candidate": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ApplicationCandidate"
              }
            ]
          },
          "attachments": {
            "deprecated": true,
            "description": "Use `documents` expand instead",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ApplicationAttachment"
            }
          },
          "documents": {
            "description": "The documents attached to this application (eg. resume, cover letter etc.)",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AtsDocumentApiModel"
            }
          },
          "result_links": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ResultLink"
            }
          },
          "source": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/Source"
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
          },
          "custom_fields": {
            "description": "The application custom fields",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CustomFields"
            }
          }
        }
      },
      "ApplicationAttachment": {
        "type": "object",
        "properties": {
          "file_name": {
            "type": "string",
            "description": "The file name of the attachment.",
            "example": "resume.pdf",
            "nullable": true
          },
          "content": {
            "type": "string",
            "description": "The content of the attachment.",
            "example": "Base64 encoded content",
            "nullable": true
          },
          "url": {
            "type": "string",
            "description": "The URL of the attachment.",
            "example": "http://example.com/resume.pdf",
            "nullable": true
          },
          "content_type": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/AttachmentContentType"
              }
            ]
          }
        }
      },
      "ApplicationCandidate": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Candidate name",
            "example": "Romain Sestier",
            "nullable": true
          },
          "first_name": {
            "type": "string",
            "description": "First name of the candidate",
            "example": "John",
            "nullable": true
          },
          "last_name": {
            "type": "string",
            "description": "Last name of the candidate",
            "example": "Doe",
            "nullable": true
          },
          "email": {
            "type": "string",
            "description": "Email of the candidate",
            "example": "john.doe@example.com",
            "nullable": true
          },
          "emails": {
            "description": "List of candidate emails",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CandidateEmail"
            }
          },
          "phone_numbers": {
            "description": "List of candidate phone numbers including the type of the number when available",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PhoneNumber"
            }
          },
          "social_links": {
            "description": "List of candidate social links",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/SocialLink"
            }
          },
          "company": {
            "type": "string",
            "description": "Candidate company",
            "example": "Company Inc.",
            "nullable": true
          },
          "title": {
            "type": "string",
            "description": "Candidate title",
            "example": "Software Engineer",
            "nullable": true
          }
        }
      },
      "ApplicationResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/Application"
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
      "ApplicationsPaginated": {
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
              "$ref": "#/components/schemas/Application"
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
      "ApplicationStatusEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "active",
              "assessment",
              "background_check",
              "converted",
              "declined_by_candidate",
              "hired",
              "interview",
              "lead",
              "offer",
              "reference_check",
              "rejected",
              "review",
              "screen",
              "new",
              "onboarding",
              "created",
              "accepted",
              "short_list",
              "approved",
              "unmapped_value",
              null
            ],
            "description": "The status of the application.",
            "example": "hired",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the application status.",
            "example": "Hired",
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
      "AssessmentOrder": {
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
          "package": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OrderPackageApiModel"
              }
            ]
          },
          "application": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OrderApplicationApiModel"
              }
            ]
          },
          "job": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OrderJobApiModel"
              }
            ]
          },
          "candidate": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OrderCandidateApiModel"
              }
            ]
          },
          "requester": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OrderJobHiringTeamApiModel"
              }
            ]
          },
          "results_update_url": {
            "type": "string",
            "description": "Results update url",
            "example": "https://exmaple.com/integrations/results/update",
            "nullable": true
          }
        }
      },
      "AssessmentOrderResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/AssessmentOrder"
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
      "AssessmentPackage": {
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
            "description": "Package name",
            "example": "Test 1",
            "nullable": true
          },
          "description": {
            "type": "string",
            "description": "Package description",
            "example": "Skills test to gauge a candidate's proficiency in job-specific skills",
            "nullable": true
          }
        }
      },
      "AssessmentPackagePaginated": {
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
              "$ref": "#/components/schemas/AssessmentPackage"
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
      "AssessmentPackageResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/AssessmentPackage"
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
      "AssessmentResult": {
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
          "candidate": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ResultCandidateApiModel"
              }
            ]
          },
          "score": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ScoreApiModel"
              }
            ]
          },
          "start_date": {
            "type": "string",
            "description": "The start date of the candidate test",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "submission_date": {
            "type": "string",
            "description": "The submission date of the candidate test",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "summary": {
            "type": "string",
            "description": "The summary about the result of the test",
            "example": "Test is passed",
            "nullable": true
          },
          "result": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ResultEnum"
              }
            ]
          },
          "result_url": {
            "type": "string",
            "description": "The test`s result url",
            "example": "https://exmaple.com/result?id=xyz",
            "nullable": true
          },
          "attachments": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Attachment"
            }
          }
        }
      },
      "AssessmentResultsResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/AssessmentResult"
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
      "AssessmentTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "responsibilities",
              "skills",
              "benefits",
              "company_overview",
              "description",
              "other",
              null
            ],
            "description": "The type of the description.",
            "example": "responsibilities",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the description type.",
            "example": "key_responsibilities",
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
      "AtsCreateApplicationRequestDto": {
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
          },
          "job_id": {
            "type": "string",
            "description": "Unique identifier of the job",
            "example": "4071538b-3cac-4fbf-ac76-f78ed250ffdd",
            "nullable": true
          },
          "job_posting_id": {
            "type": "string",
            "description": "Unique identifier of the job posting that is associated with application",
            "example": "1c702a20-8de8-4d03-ac18-cbf4ac42eb51",
            "nullable": true
          },
          "location_id": {
            "type": "string",
            "description": "Unique identifier of the location",
            "example": "dd8d41d1-5eb8-4408-9c87-9ba44604eae4",
            "nullable": true
          },
          "application_status": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ApplicationStatusEnum"
              }
            ]
          },
          "questionnaires": {
            "description": "Questionnaires associated with the application",
            "example": {
              "id": "right_to_work",
              "answers": [
                {
                  "id": "answer1",
                  "type": "text",
                  "values": [
                    "Yes"
                  ]
                }
              ]
            },
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CreateQuestionnaire"
            }
          },
          "source": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/CreateSource"
              }
            ]
          },
          "candidate_id": {
            "type": "string",
            "description": "Unique identifier of the candidate. Provide this OR candidate, but not both.",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "candidate": {
            "description": "Candidate Properties. Provide this OR candidate_id, but not both. Providing this attempts to create a new candidate with the application.",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/CreateCandidate"
              }
            ]
          }
        }
      },
      "AtsCreateBackgroundCheckOrderRequestDto": {
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
          "application": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OrderApplicationApiModel"
              }
            ]
          },
          "job": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OrderJobApiModel"
              }
            ]
          },
          "candidate": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OrderCandidateApiModel"
              }
            ]
          },
          "requester": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OrderJobHiringTeamApiModel"
              }
            ]
          },
          "results_update_url": {
            "type": "string",
            "description": "Results update url",
            "example": "https://exmaple.com/integrations/results/update",
            "nullable": true
          },
          "package": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OrderBackgroundCheckPackageApiModel"
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
      "AtsCreateBackgroundCheckPackagesRequestDto": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Package name",
            "example": "Test 1",
            "nullable": true
          },
          "description": {
            "type": "string",
            "description": "Package description",
            "example": "Skills test to gauge a candidate's proficiency in job-specific skills",
            "nullable": true
          },
          "tests": {
            "description": "Package tests",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CreatePackage"
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
      "AtsCreateCandidateRequestDto": {
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
          "phone_number": {
            "type": "string",
            "description": "The candidate personal phone number",
            "example": "+1234567890",
            "deprecated": true,
            "nullable": true
          },
          "phone_numbers": {
            "description": "List of candidate phone numbers including the type of the number when available",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PhoneNumber"
            }
          },
          "name": {
            "type": "string",
            "description": "Candidate name",
            "example": "Romain Sestier",
            "nullable": true
          },
          "first_name": {
            "type": "string",
            "description": "Candidate first name",
            "example": "Romain",
            "nullable": true
          },
          "last_name": {
            "type": "string",
            "description": "Candidate last name",
            "example": "Sestier",
            "nullable": true
          },
          "email": {
            "type": "string",
            "description": "Candidate email",
            "example": "sestier.romain123@gmail.com",
            "nullable": true
          },
          "social_links": {
            "description": "List of candidate social links",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/SocialLink"
            }
          },
          "company": {
            "type": "string",
            "description": "Candidate company",
            "example": "Company Inc.",
            "nullable": true
          },
          "title": {
            "type": "string",
            "description": "Candidate title",
            "example": "Software Engineer",
            "nullable": true
          },
          "hired_at": {
            "type": "string",
            "description": "Candidate hired date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "country": {
            "type": "string",
            "description": "Candidate country",
            "example": "United States",
            "nullable": true
          },
          "custom_fields": {
            "description": "The candidate custom fields",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CustomFields"
            }
          }
        }
      },
      "AtsCreateCandidatesAssessmentsRequestDto": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier",
            "example": "8187e5da-dc77-475e-9949-af0f1fa4e4e3",
            "nullable": true
          },
          "package": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OrderPackageApiModel"
              }
            ]
          },
          "application": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OrderApplicationApiModel"
              }
            ]
          },
          "job": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OrderJobApiModel"
              }
            ]
          },
          "candidate": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OrderCandidateApiModel"
              }
            ]
          },
          "requester": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OrderJobHiringTeamApiModel"
              }
            ]
          },
          "results_update_url": {
            "type": "string",
            "description": "Results update url",
            "example": "https://exmaple.com/integrations/results/update",
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
      "AtsCreateJobRequestDto": {
        "type": "object",
        "properties": {
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
            "type": "string",
            "deprecated": true,
            "description": "Status of the job",
            "example": "archived",
            "nullable": true
          },
          "job_status": {
            "description": "Status of the job",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/JobStatusEnum"
              }
            ]
          },
          "department_ids": {
            "description": "Department ids of the job",
            "example": [
              "308570",
              "308571",
              "308572"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "location_ids": {
            "description": "Location ids of the job",
            "example": [
              "668570",
              "678571",
              "688572"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "hiring_team": {
            "description": "Hiring team for the job.",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/JobHiringTeam"
            }
          },
          "interview_stages": {
            "description": "Interview stages for the job.",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/InterviewStage"
            }
          },
          "confidential": {
            "type": "string",
            "description": "Confidential status of the job",
            "enum": [
              "true",
              "false",
              null
            ],
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "custom_fields": {
            "description": "The job custom fields",
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
      "AtsCreateNotesRequestDto": {
        "type": "object",
        "properties": {
          "content": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/NoteContentApiModel"
            }
          },
          "author_id": {
            "type": "string",
            "description": "Unique identifier of the author",
            "example": "1234567890",
            "nullable": true
          },
          "visibility": {
            "description": "Visibility of the note",
            "example": "public",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/NotesVisibilityEnum"
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
      "AtsCreateOfferRequestDto": {
        "type": "object",
        "properties": {
          "application_id": {
            "type": "string",
            "nullable": true
          },
          "start_date": {
            "type": "string",
            "description": "Date of creation",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "offer_status": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OfferStatusEnum"
              }
            ]
          },
          "salary": {
            "type": "number",
            "nullable": true
          },
          "currency": {
            "type": "string",
            "nullable": true
          },
          "offer_history": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/OfferHistory"
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
      "AtsDocumentApiModel": {
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
                "$ref": "#/components/schemas/AtsDocumentTypeEnum"
              }
            ]
          }
        }
      },
      "AtsDocumentResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/AtsDocumentApiModel"
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
      "AtsDocumentsPaginated": {
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
              "$ref": "#/components/schemas/AtsDocumentApiModel"
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
      "AtsDocumentTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "description": "The category of the file",
            "nullable": true,
            "enum": [
              "resume",
              "avatar",
              "cover_letter",
              "profile_picture",
              "policy",
              "passport",
              "assessment",
              "interview_attachment",
              "take_home_test",
              "offer_letter",
              "signed_offer_letter",
              "national_id",
              "offer_packet",
              "other",
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
      "ATSLocation": {
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
          }
        }
      },
      "ATSLocationResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/ATSLocation"
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
      "ATSLocationsPaginated": {
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
              "$ref": "#/components/schemas/ATSLocation"
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
      "AtsMoveApplicationRequestDto": {
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
          },
          "interview_stage_id": {
            "type": "string",
            "description": "Unique identifier of the application stage.",
            "example": "f223d7f6-908b-48f0-9237-b201c307f609",
            "nullable": true
          }
        }
      },
      "AtsRejectApplicationRequestDto": {
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
          },
          "rejected_reason_id": {
            "type": "string",
            "description": "Unique identifier of the rejection reason",
            "example": "f223d7f6-908b-48f0-9237-b201c307f609",
            "nullable": true
          }
        }
      },
      "AtsUpdateApplicationRequestDto": {
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
          },
          "custom_fields": {
            "description": "The application custom fields",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CustomFields"
            }
          },
          "application_status": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ApplicationStatusEnum"
              }
            ]
          },
          "source": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/CreateSource"
              }
            ]
          }
        }
      },
      "AtsUpdateBackgroundCheckPackagesRequestDto": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Package name",
            "example": "Test 1",
            "nullable": true
          },
          "description": {
            "type": "string",
            "description": "Package description",
            "example": "Skills test to gauge a candidate's proficiency in job-specific skills",
            "nullable": true
          },
          "tests": {
            "description": "Package tests",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/UpdatePackage"
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
      "AtsUpdateBackgroundCheckResultRequestDto": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier",
            "example": "8187e5da-dc77-475e-9949-af0f1fa4e4e3",
            "nullable": true
          },
          "score": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ScoreApiModel"
              }
            ]
          },
          "start_date": {
            "type": "string",
            "description": "The start date of the candidate test",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "submission_date": {
            "type": "string",
            "description": "The submission date of the candidate test",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "summary": {
            "type": "string",
            "description": "The summary about the result of the test",
            "example": "Test is passed",
            "nullable": true
          },
          "result": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ResultEnum"
              }
            ]
          },
          "result_url": {
            "type": "string",
            "description": "The test`s result url",
            "example": "https://exmaple.com/result?id=xyz",
            "nullable": true
          },
          "attachments": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Attachment"
            }
          },
          "candidate": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/UpdateResultCandidateApiModel"
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
      "AtsUpdateCandidateRequestDto": {
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
            "description": "Candidate name",
            "example": "Romain Sestier",
            "nullable": true
          },
          "first_name": {
            "type": "string",
            "description": "Candidate first name",
            "example": "Romain",
            "nullable": true
          },
          "last_name": {
            "type": "string",
            "description": "Candidate last name",
            "example": "Sestier",
            "nullable": true
          },
          "email": {
            "type": "string",
            "description": "Candidate email",
            "example": "sestier.romain123@gmail.com",
            "nullable": true
          },
          "emails": {
            "description": "List of candidate emails",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CandidateEmail"
            }
          },
          "social_links": {
            "description": "List of candidate social links",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/SocialLink"
            }
          },
          "phone": {
            "type": "string",
            "description": "Candidate phone number",
            "example": "+16178294093",
            "deprecated": true,
            "nullable": true
          },
          "phone_numbers": {
            "description": "List of candidate phone numbers including the type of the number when available",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PhoneNumber"
            }
          },
          "company": {
            "type": "string",
            "description": "Candidate company",
            "example": "Company Inc.",
            "nullable": true
          },
          "title": {
            "type": "string",
            "description": "Candidate title",
            "example": "Software Engineer",
            "nullable": true
          },
          "application_ids": {
            "description": "List of candidate application IDs",
            "example": [
              "123e4567-e89b-12d3-a456-426614174000",
              "523e1234-e89b-fdd2-a456-762545121101"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "hired_at": {
            "type": "string",
            "description": "Candidate hired date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "country": {
            "type": "string",
            "description": "Candidate country",
            "example": "United States",
            "nullable": true
          },
          "custom_fields": {
            "description": "The candidate custom fields",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CustomFields"
            }
          }
        }
      },
      "AtsUpdateCandidatesAssessmentsResultsRequestDto": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier",
            "example": "8187e5da-dc77-475e-9949-af0f1fa4e4e3",
            "nullable": true
          },
          "score": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ScoreApiModel"
              }
            ]
          },
          "start_date": {
            "type": "string",
            "description": "The start date of the candidate test",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "submission_date": {
            "type": "string",
            "description": "The submission date of the candidate test",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "summary": {
            "type": "string",
            "description": "The summary about the result of the test",
            "example": "Test is passed",
            "nullable": true
          },
          "result": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ResultEnum"
              }
            ]
          },
          "result_url": {
            "type": "string",
            "description": "The test`s result url",
            "example": "https://exmaple.com/result?id=xyz",
            "nullable": true
          },
          "attachments": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Attachment"
            }
          },
          "candidate": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/UpdateResultCandidateApiModel"
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
      "AtsUpdateJobRequestDto": {
        "type": "object",
        "properties": {
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
            "type": "string",
            "deprecated": true,
            "description": "Status of the job",
            "example": "archived",
            "nullable": true
          },
          "job_status": {
            "description": "Status of the job",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/JobStatusEnum"
              }
            ]
          },
          "department_ids": {
            "description": "Department ids of the job",
            "example": [
              "308570",
              "308571",
              "308572"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "location_ids": {
            "description": "Location ids of the job",
            "example": [
              "668570",
              "678571",
              "688572"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "hiring_team": {
            "description": "Hiring team for the job.",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/JobHiringTeam"
            }
          },
          "interview_stages": {
            "description": "Interview stages for the job.",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/InterviewStage"
            }
          },
          "confidential": {
            "type": "string",
            "description": "Confidential status of the job",
            "enum": [
              "true",
              "false",
              null
            ],
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "custom_fields": {
            "description": "The job custom fields",
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
      "AtsUpdateNotesRequestDto": {
        "type": "object",
        "properties": {
          "content": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/NoteContentApiModel"
            }
          },
          "author_id": {
            "type": "string",
            "description": "Unique identifier of the author",
            "example": "1234567890",
            "nullable": true
          },
          "visibility": {
            "description": "Visibility of the note",
            "example": "public",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/NotesVisibilityEnum"
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
      "Attachment": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string",
            "description": "The URL of the attachment.",
            "example": "http://example.com/resume.pdf",
            "nullable": true
          },
          "content_type": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/AttachmentContentType"
              }
            ]
          }
        }
      },
      "AttachmentContentType": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "text",
              "unmapped_value",
              null
            ],
            "description": "The content type of the attachment.",
            "example": "text",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the content type.",
            "example": "Text",
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
      "BackgroundCheckOrder": {
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
          "application": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OrderApplicationApiModel"
              }
            ]
          },
          "job": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OrderJobApiModel"
              }
            ]
          },
          "candidate": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OrderCandidateApiModel"
              }
            ]
          },
          "requester": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OrderJobHiringTeamApiModel"
              }
            ]
          },
          "results_update_url": {
            "type": "string",
            "description": "Results update url",
            "example": "https://exmaple.com/integrations/results/update",
            "nullable": true
          },
          "package": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OrderBackgroundCheckPackageApiModel"
              }
            ]
          }
        }
      },
      "BackgroundCheckOrderPaginated": {
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
              "$ref": "#/components/schemas/BackgroundCheckOrder"
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
      "BackgroundCheckOrderResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/BackgroundCheckOrder"
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
      "BackgroundCheckPackage": {
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
            "description": "Package name",
            "example": "Test 1",
            "nullable": true
          },
          "description": {
            "type": "string",
            "description": "Package description",
            "example": "Skills test to gauge a candidate's proficiency in job-specific skills",
            "nullable": true
          },
          "tests": {
            "description": "Package tests",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Package"
            }
          }
        }
      },
      "BackgroundCheckPackagePaginated": {
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
              "$ref": "#/components/schemas/BackgroundCheckPackage"
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
      "BackgroundCheckPackageResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/BackgroundCheckPackage"
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
      "BackgroundCheckResult": {
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
          "candidate": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ResultCandidateApiModel"
              }
            ]
          },
          "score": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ScoreApiModel"
              }
            ]
          },
          "start_date": {
            "type": "string",
            "description": "The start date of the candidate test",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "submission_date": {
            "type": "string",
            "description": "The submission date of the candidate test",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "summary": {
            "type": "string",
            "description": "The summary about the result of the test",
            "example": "Test is passed",
            "nullable": true
          },
          "result": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ResultEnum"
              }
            ]
          },
          "result_url": {
            "type": "string",
            "description": "The test`s result url",
            "example": "https://exmaple.com/result?id=xyz",
            "nullable": true
          },
          "attachments": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Attachment"
            }
          }
        }
      },
      "BackgroundCheckResultsResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/BackgroundCheckResult"
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
      "Candidate": {
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
            "description": "Candidate name",
            "example": "Romain Sestier",
            "nullable": true
          },
          "first_name": {
            "type": "string",
            "description": "Candidate first name",
            "example": "Romain",
            "nullable": true
          },
          "last_name": {
            "type": "string",
            "description": "Candidate last name",
            "example": "Sestier",
            "nullable": true
          },
          "email": {
            "type": "string",
            "description": "Candidate email",
            "example": "sestier.romain123@gmail.com",
            "nullable": true
          },
          "emails": {
            "description": "List of candidate emails",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CandidateEmail"
            }
          },
          "social_links": {
            "description": "List of candidate social links",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/SocialLink"
            }
          },
          "phone": {
            "type": "string",
            "description": "Candidate phone number",
            "example": "+16178294093",
            "deprecated": true,
            "nullable": true
          },
          "phone_numbers": {
            "description": "List of candidate phone numbers including the type of the number when available",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PhoneNumber"
            }
          },
          "company": {
            "type": "string",
            "description": "Candidate company",
            "example": "Company Inc.",
            "nullable": true
          },
          "title": {
            "type": "string",
            "description": "Candidate title",
            "example": "Software Engineer",
            "nullable": true
          },
          "application_ids": {
            "description": "List of candidate application IDs",
            "example": [
              "123e4567-e89b-12d3-a456-426614174000",
              "523e1234-e89b-fdd2-a456-762545121101"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "remote_application_ids": {
            "description": "Provider's list of candidate application IDs",
            "example": [
              "123e4567-e89b-12d3-a456-426614174000",
              "523e1234-e89b-fdd2-a456-762545121101"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "hired_at": {
            "type": "string",
            "description": "Candidate hired date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "country": {
            "type": "string",
            "description": "Candidate country",
            "example": "United States",
            "nullable": true
          },
          "custom_fields": {
            "description": "The candidate custom fields",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CustomFields"
            }
          },
          "created_at": {
            "type": "string",
            "description": "Candidate created date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "Candidate updated date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "CandidateEmail": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "description": "Type of the email",
            "example": "personal",
            "nullable": true
          },
          "value": {
            "type": "string",
            "description": "Email value",
            "example": "sestier.romain123@gmail.com",
            "nullable": true
          }
        }
      },
      "CandidateResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/Candidate"
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
      "CandidatesPaginated": {
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
              "$ref": "#/components/schemas/Candidate"
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
      "CompensationTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "salary",
              "hourly",
              "commission",
              "bonus",
              "equity",
              "other",
              "unmapped_value",
              null
            ],
            "description": "The type of the compensation.",
            "example": "salary",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the compensation type.",
            "example": "Salary",
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
      "ConditionTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "equals_to",
              "contains",
              null
            ],
            "description": "The type of the question's condition",
            "example": "equals_to",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the question's condition type",
            "example": "EqualsTo",
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
      "CreateAnswer": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier",
            "example": "8187e5da-dc77-475e-9949-af0f1fa4e4e3",
            "nullable": true
          },
          "type": {
            "description": "Type of the answer",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/AnswerEnum"
              }
            ]
          },
          "values": {
            "description": "Values of the answer",
            "example": [
              "Yes",
              "No Travel",
              "It sounds pretty cool.",
              "Excel",
              "Power Point"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "CreateAssessmentOrderResult": {
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
          "test_url": {
            "type": "string",
            "description": "Test url",
            "example": "https://exmaple.com/integrations/candidate/test",
            "nullable": true
          }
        }
      },
      "CreateBackgroundCheckOrderResult": {
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
          "test_url": {
            "type": "string",
            "description": "Test url",
            "example": "https://exmaple.com/integrations/candidate/test",
            "nullable": true
          }
        }
      },
      "CreateCandidate": {
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
          "phone_number": {
            "type": "string",
            "description": "The candidate personal phone number",
            "example": "+1234567890",
            "deprecated": true,
            "nullable": true
          },
          "phone_numbers": {
            "description": "List of candidate phone numbers including the type of the number when available",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PhoneNumber"
            }
          },
          "name": {
            "type": "string",
            "description": "Candidate name",
            "example": "Romain Sestier",
            "nullable": true
          },
          "first_name": {
            "type": "string",
            "description": "Candidate first name",
            "example": "Romain",
            "nullable": true
          },
          "last_name": {
            "type": "string",
            "description": "Candidate last name",
            "example": "Sestier",
            "nullable": true
          },
          "email": {
            "type": "string",
            "description": "Candidate email",
            "example": "sestier.romain123@gmail.com",
            "nullable": true
          },
          "social_links": {
            "description": "List of candidate social links",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/SocialLink"
            }
          },
          "company": {
            "type": "string",
            "description": "Candidate company",
            "example": "Company Inc.",
            "nullable": true
          },
          "title": {
            "type": "string",
            "description": "Candidate title",
            "example": "Software Engineer",
            "nullable": true
          },
          "hired_at": {
            "type": "string",
            "description": "Candidate hired date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "country": {
            "type": "string",
            "description": "Candidate country",
            "example": "United States",
            "nullable": true
          },
          "custom_fields": {
            "description": "The candidate custom fields",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CustomFields"
            }
          }
        }
      },
      "CreatePackage": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Package name",
            "example": "Test 1",
            "nullable": true
          },
          "description": {
            "type": "string",
            "description": "Package description",
            "example": "Skills test to gauge a candidate's proficiency in job-specific skills",
            "nullable": true
          }
        }
      },
      "CreateQuestionnaire": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier",
            "example": "8187e5da-dc77-475e-9949-af0f1fa4e4e3",
            "nullable": true
          },
          "answers": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CreateAnswer"
            }
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
      "CreateSource": {
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
            "description": "The source of the application",
            "example": "LinkedIn",
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
      "DeleteResult": {
        "type": "object",
        "properties": {
          "statusCode": {
            "type": "number",
            "example": 204
          },
          "message": {
            "type": "string",
            "example": "Record deleted successfully."
          },
          "timestamp": {
            "type": "string",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time"
          }
        },
        "required": [
          "statusCode",
          "message",
          "timestamp"
        ]
      },
      "Department": {
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
          }
        }
      },
      "DepartmentResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/Department"
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
      "DepartmentsPaginated": {
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
              "$ref": "#/components/schemas/Department"
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
      "EmploymentContractTypeEnum": {
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
            "description": "The employment contract type.",
            "example": "full_time",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the employment contract type.",
            "example": "FullTime",
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
            "description": "The type of the employment.",
            "example": "permanent",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the employment type.",
            "example": "Permanent",
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
      "Field": {
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
            "description": "The label of the field",
            "example": "Problem Solving",
            "nullable": true
          },
          "type": {
            "type": "string",
            "description": "The type of the field",
            "example": "text",
            "enum": [
              "short_text",
              "long_text",
              "multi_select",
              "single_select",
              "boolean",
              "number",
              "date",
              "phone",
              "email",
              "score",
              "location",
              "unmapped_value",
              null
            ],
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "values": {
            "description": "The possible values for the field",
            "example": [
              "Excellent",
              "Good",
              "Average",
              "Poor"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "required": {
            "description": "Indicates if the field is required",
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
      "Interview": {
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
          "application_id": {
            "type": "string",
            "nullable": true
          },
          "remote_application_id": {
            "type": "string",
            "description": "Provider's unique identifier of the application",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "interview_stage_id": {
            "type": "string",
            "nullable": true
          },
          "remote_interview_stage_id": {
            "type": "string",
            "description": "Provider's unique identifier of the interview stage",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "interview_stage": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/InterviewStage"
              }
            ]
          },
          "interview_status": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/InterviewStatusEnum"
              }
            ]
          },
          "interviewer_ids": {
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "remote_interviewer_ids": {
            "description": "Provider's unique identifiers of the interviewers",
            "example": [
              "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
              "e3cb75bf-aa84-466e-a6c1-b8322b257a48"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "interview_parts": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/InterviewPart"
            }
          },
          "interviewers": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Interviewer"
            }
          },
          "start_at": {
            "type": "string",
            "description": "Interview start date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "end_at": {
            "type": "string",
            "description": "Interview end date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "meeting_url": {
            "type": "string",
            "nullable": true
          },
          "created_at": {
            "type": "string",
            "description": "Interview created date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "Interview updated date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "Interviewer": {
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
          "first_name": {
            "type": "string",
            "nullable": true
          },
          "last_name": {
            "type": "string",
            "nullable": true
          },
          "name": {
            "type": "string",
            "nullable": true
          },
          "email": {
            "type": "string",
            "nullable": true
          }
        }
      },
      "InterviewPart": {
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
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/InterviewTypeEnum"
              }
            ]
          },
          "title": {
            "type": "string",
            "description": "The title of interview, usually corresponding to the title of an associated calendar event",
            "example": "Interview (Informal Interview) - Elon and StackOne",
            "nullable": true
          },
          "interviewer_ids": {
            "description": "The user (interviewer) IDs taking part in this specific interview.",
            "example": [
              "cx28iQahdfDHa",
              "cx28iQokkD78das"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "remote_interviewer_ids": {
            "description": "Provider's user (interviewer) IDs taking part in this specific interview.",
            "example": [
              "cx28iQahdfDHa",
              "cx28iQokkD78das"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "meeting_url": {
            "type": "string",
            "description": "The meeting URL for the interview - this may be populated using the underlying location if the location string extracted is a valid url.",
            "example": "zoomus://zoom.us/join?confno=123456789",
            "nullable": true
          },
          "meeting_provider": {
            "type": "string",
            "description": "The video meeting provider used for the interview.",
            "example": "zoom",
            "nullable": true
          },
          "start_at": {
            "type": "string",
            "description": "The specific interview part's start date",
            "example": "2021-01-01T17:00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "end_at": {
            "type": "string",
            "description": "The specific interview part's end date",
            "example": "2021-01-01T18:00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "created_at": {
            "type": "string",
            "description": "Interview part created date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "Interview part updated date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "InterviewsPaginated": {
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
              "$ref": "#/components/schemas/Interview"
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
      "InterviewsResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/Interview"
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
      "InterviewStage": {
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
          "order": {
            "type": "number",
            "nullable": true
          },
          "created_at": {
            "type": "string",
            "description": "Interview Stage created date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "Interview Stage updated date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "InterviewStageResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/InterviewStage"
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
      "InterviewStagesPaginated": {
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
              "$ref": "#/components/schemas/InterviewStage"
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
      "InterviewStatusEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "unscheduled",
              "scheduled",
              "completed",
              "cancelled",
              "pending_feedback",
              "unmapped_value",
              null
            ],
            "description": "The status of the interview.",
            "example": "unscheduled",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the interview status.",
            "example": "Unscheduled",
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
      "InterviewTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "screening",
              "lunch",
              "on_site",
              "presentation",
              "sell",
              "culture",
              "informal",
              "test",
              "phone",
              "video",
              "unmapped_value",
              null
            ],
            "description": "The type of the interview.",
            "example": "on_site",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the interview type.",
            "example": "Onsite Interview",
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
            "type": "string",
            "deprecated": true,
            "description": "Status of the job",
            "example": "archived",
            "nullable": true
          },
          "job_status": {
            "description": "Status of the job",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/JobStatusEnum"
              }
            ]
          },
          "department_ids": {
            "description": "Department ids of the job",
            "example": [
              "308570",
              "308571",
              "308572"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "remote_department_ids": {
            "description": "Provider's department ids of the job",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "location_ids": {
            "description": "Location ids of the job",
            "example": [
              "668570",
              "678571",
              "688572"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "remote_location_ids": {
            "description": "Provider's location ids of the job",
            "example": [
              "668570",
              "678571",
              "688572"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "hiring_team": {
            "description": "Hiring team for the job.",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/JobHiringTeam"
            }
          },
          "interview_stages": {
            "description": "Interview stages for the job.",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/InterviewStage"
            }
          },
          "confidential": {
            "type": "string",
            "description": "Confidential status of the job",
            "enum": [
              "true",
              "false",
              null
            ],
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "custom_fields": {
            "description": "The job custom fields",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CustomFields"
            }
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
      "JobHiringTeam": {
        "type": "object",
        "properties": {
          "user_id": {
            "type": "string",
            "example": "123456",
            "description": "User ID of the hiring team member.",
            "nullable": true
          },
          "remote_user_id": {
            "type": "string",
            "description": "Provider's unique identifier of the user",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "first_name": {
            "type": "string",
            "example": "John",
            "description": "First name of the hiring team member.",
            "nullable": true
          },
          "last_name": {
            "type": "string",
            "example": "Doe",
            "description": "Last name of the hiring team member.",
            "nullable": true
          },
          "email": {
            "type": "string",
            "example": "john.doe@gmail.com",
            "description": "Email of the hiring team member.",
            "nullable": true
          },
          "role": {
            "type": "string",
            "example": "Software Engineer",
            "description": "Role of the hiring team member.",
            "nullable": true
          }
        }
      },
      "JobPosting": {
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
          "title": {
            "type": "string",
            "example": "Software Engineer",
            "nullable": true
          },
          "locations": {
            "example": [
              {
                "id": "12345",
                "name": "New York"
              },
              {
                "id": "67890",
                "name": "Remote"
              }
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/JobPostingLocation"
            }
          },
          "internal": {
            "type": "string",
            "enum": [
              "true",
              "false",
              null
            ],
            "example": "true",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "status": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/JobPostingStatusEnum"
              }
            ]
          },
          "job_id": {
            "type": "string",
            "example": "job001",
            "nullable": true
          },
          "remote_job_posting_id": {
            "type": "string",
            "description": "Provider's unique identifier of the job posting",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "content": {
            "example": {
              "plain": "This is a plain text description",
              "html": "<p>This is an HTML description</p>"
            },
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/JobPostingContent"
              }
            ]
          },
          "compensation": {
            "example": [
              {
                "name": "Base Salary",
                "type": "salary",
                "pay_period": "month",
                "pay_frequency": "yearly",
                "currency": "USD",
                "value": "50000",
                "min_value": "45000",
                "max_value": "55000"
              },
              {
                "name": "Bonus",
                "type": "bonus",
                "pay_frequency": "quarterly",
                "currency": "USD",
                "value": "10%"
              }
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/JobPostingCompensation"
            }
          },
          "employment_type": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmploymentTypeEnum"
              }
            ]
          },
          "employment_contract_type": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/EmploymentContractTypeEnum"
              }
            ]
          },
          "external_url": {
            "type": "string",
            "example": "https://www.example.com/job-posting/abcd1234",
            "nullable": true
          },
          "external_apply_url": {
            "type": "string",
            "example": "https://www.example.com/job-posting/abcd1234/apply",
            "nullable": true
          },
          "questionnaires": {
            "example": [
              {
                "id": "about001",
                "name": "About",
                "internal": "false",
                "questions": [
                  {
                    "id": "question001",
                    "text": "What is your name?",
                    "type": "short_text",
                    "required": true,
                    "parent_question": null
                  },
                  {
                    "id": "question002",
                    "text": "What are your hobbies?",
                    "type": "long_text",
                    "required": false,
                    "parent_question": null
                  },
                  {
                    "id": "question003",
                    "text": "What is your favourite animal?",
                    "type": "single_select",
                    "required": true,
                    "multiple_choice_answers": [
                      {
                        "id": "1",
                        "text": "Dog"
                      },
                      {
                        "id": "2",
                        "text": "Cat"
                      },
                      {
                        "id": "3",
                        "text": "Bird"
                      },
                      {
                        "id": "4",
                        "text": "Other"
                      }
                    ],
                    "parent_question": null
                  },
                  {
                    "id": "question004",
                    "text": "Do you have previous work experience??",
                    "type": "single_select",
                    "required": true,
                    "multiple_choice_answers": [
                      {
                        "id": "1",
                        "text": "Yes"
                      },
                      {
                        "id": "2",
                        "text": "No"
                      }
                    ],
                    "parent_question": null
                  },
                  {
                    "id": "question005",
                    "text": "What was the duration of your last employment?",
                    "type": "single_select",
                    "required": true,
                    "multiple_choice_answers": [
                      {
                        "id": "1",
                        "text": "Less than 1 year"
                      },
                      {
                        "id": "2",
                        "text": "1-2 years"
                      },
                      {
                        "id": "2",
                        "text": "More than 2 year"
                      }
                    ],
                    "parent_question": {
                      "id": "question004",
                      "option_ids": [
                        "1"
                      ],
                      "condition_type": "equals_to"
                    }
                  }
                ]
              },
              {
                "id": "experience001",
                "name": "Experience",
                "internal": "false",
                "questions": [
                  {
                    "id": "question004",
                    "text": "Please upload your resume.",
                    "type": "attachment",
                    "parent_question": null,
                    "required": true
                  },
                  {
                    "id": "question005",
                    "text": "Select the programming languages you are proficient in.",
                    "type": "multi_select",
                    "multiple_choice_answers": [
                      {
                        "id": "1",
                        "text": "JavaScript"
                      },
                      {
                        "id": "2",
                        "text": "Python"
                      },
                      {
                        "id": "3",
                        "text": "Java"
                      }
                    ],
                    "parent_question": null,
                    "required": true
                  },
                  {
                    "id": "question006",
                    "text": "Are you willing to relocate?",
                    "type": "boolean",
                    "parent_question": null
                  },
                  {
                    "id": "question007",
                    "text": "How many years of experience do you have?",
                    "type": "number",
                    "parent_question": null
                  },
                  {
                    "id": "question008",
                    "text": "When did you start your most recent position?",
                    "type": "date",
                    "parent_question": null
                  },
                  {
                    "id": "question009",
                    "text": "Do you have Project Management Experience?",
                    "type": "single_select",
                    "multiple_choice_answers": [
                      {
                        "id": "1",
                        "text": "Yes"
                      },
                      {
                        "id": "2",
                        "text": "No"
                      }
                    ],
                    "parent_question": null,
                    "required": true
                  },
                  {
                    "id": "question010",
                    "text": "How much Project Management experience do you have?",
                    "type": "single_select",
                    "multiple_choice_answers": [
                      {
                        "id": "1",
                        "text": "1-3 years"
                      },
                      {
                        "id": "2",
                        "text": "3-5 years"
                      },
                      {
                        "id": "3",
                        "text": "5-10 years"
                      },
                      {
                        "id": "4",
                        "text": "More than 10 years"
                      }
                    ],
                    "parent_question": {
                      "id": "question009",
                      "option_ids": [
                        "1"
                      ],
                      "condition_type": "equals_to"
                    }
                  }
                ]
              }
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/JobPostingQuestionnaire"
            }
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
      "JobPostingCompensation": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "nullable": true
          },
          "type": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/CompensationTypeEnum"
              }
            ]
          },
          "pay_period": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/PayPeriodEnum"
              }
            ]
          },
          "pay_frequency": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/PayFrequencyEnum"
              }
            ]
          },
          "currency": {
            "type": "string",
            "nullable": true
          },
          "value": {
            "type": "string",
            "nullable": true
          },
          "min_value": {
            "type": "string",
            "nullable": true
          },
          "max_value": {
            "type": "string",
            "nullable": true
          }
        }
      },
      "JobPostingContent": {
        "type": "object",
        "properties": {
          "plain": {
            "type": "string",
            "nullable": true
          },
          "html": {
            "type": "string",
            "nullable": true
          },
          "sections": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/JobPostingContentSection"
            }
          }
        }
      },
      "JobPostingContentSection": {
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
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/AssessmentTypeEnum"
              }
            ]
          },
          "label": {
            "type": "string",
            "example": "Key Responsibilities",
            "nullable": true
          },
          "content": {
            "type": "string",
            "example": "This is a plain description",
            "nullable": true
          }
        }
      },
      "JobPostingLocation": {
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
      "JobPostingQuestionnaire": {
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
          "internal": {
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
          "questions": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Question"
            }
          }
        }
      },
      "JobPostingResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/JobPosting"
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
      "JobPostingsPaginated": {
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
              "$ref": "#/components/schemas/JobPosting"
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
      "JobPostingStatusEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "live",
              "draft",
              "pending",
              "internal",
              "rejected",
              "closed",
              "archived",
              "unmapped_value",
              null
            ],
            "description": "The status of the job postings.",
            "example": "live",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the job postings status.",
            "example": "Live",
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
              "published",
              "draft",
              "pending",
              "internal",
              "archived",
              "closed",
              "open",
              "deleted",
              "on_hold",
              "unmapped_value",
              null
            ],
            "description": "The status of the job.",
            "example": "published",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the job status.",
            "example": "Published",
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
      "MoveApplicationResult": {
        "type": "object",
        "properties": {
          "statusCode": {
            "type": "number",
            "example": 200
          },
          "message": {
            "type": "string",
            "example": "Application moved successfully."
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
      "Note": {
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
          "content": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/NoteContentApiModel"
            }
          },
          "author_id": {
            "type": "string",
            "description": "Unique identifier of the author",
            "example": "1234567890",
            "nullable": true
          },
          "remote_author_id": {
            "type": "string",
            "description": "Provider's unique identifier of the author",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "visibility": {
            "description": "Visibility of the note",
            "example": "public",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/NotesVisibilityEnum"
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
          },
          "deleted_at": {
            "type": "string",
            "description": "Date of Deletion",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "NoteContentApiModel": {
        "type": "object",
        "properties": {
          "body": {
            "type": "string",
            "description": "Body of the note",
            "example": "This candidate seems like a good fit for the role",
            "nullable": true
          }
        }
      },
      "NoteResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/Note"
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
      "NotesPaginated": {
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
              "$ref": "#/components/schemas/Note"
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
      "NotesVisibilityEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "private",
              "public",
              null
            ],
            "description": "The visibility of the notes.",
            "example": "public",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the notes visibility.",
            "example": "Public",
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
      "Offer": {
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
          "application_id": {
            "type": "string",
            "nullable": true
          },
          "remote_application_id": {
            "type": "string",
            "description": "Provider's unique identifier of the application",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "start_date": {
            "type": "string",
            "description": "Date of creation",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "offer_status": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OfferStatusEnum"
              }
            ]
          },
          "salary": {
            "type": "number",
            "nullable": true
          },
          "currency": {
            "type": "string",
            "nullable": true
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
          },
          "offer_history": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/OfferHistory"
            }
          }
        }
      },
      "OfferHistory": {
        "type": "object",
        "properties": {
          "start_date": {
            "type": "string",
            "description": "Start Date of the offer",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "salary": {
            "type": "number",
            "nullable": true
          },
          "currency": {
            "type": "string",
            "nullable": true
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
      "OffersPaginated": {
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
              "$ref": "#/components/schemas/Offer"
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
      "OffersResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/Offer"
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
      "OfferStatusEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "pending",
              "retracted",
              "accepted",
              "rejected",
              "created",
              "approved",
              "not_approved",
              "unmapped_value",
              null
            ],
            "description": "The status of the offer.",
            "example": "pending",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the offer status.",
            "example": "Pending",
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
      "OrderApplicationApiModel": {
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
          "application_status": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ApplicationStatusEnum"
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
      "OrderBackgroundCheckPackageApiModel": {
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
            "description": "Package name",
            "example": "Test 1",
            "nullable": true
          },
          "description": {
            "type": "string",
            "description": "Package description",
            "example": "Skills test to gauge a candidate's proficiency in job-specific skills",
            "nullable": true
          },
          "tests": {
            "description": "Package tests",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Package"
            }
          }
        }
      },
      "OrderCandidateApiModel": {
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
          "first_name": {
            "type": "string",
            "description": "Candidate first name",
            "example": "Romain",
            "nullable": true
          },
          "last_name": {
            "type": "string",
            "description": "Candidate last name",
            "example": "Sestier",
            "nullable": true
          },
          "emails": {
            "description": "List of candidate emails",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CandidateEmail"
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
          },
          "profile_url": {
            "type": "string",
            "description": "Candidate profile url",
            "example": "https://exmaple.com/candidate?id=xyz",
            "nullable": true
          }
        }
      },
      "OrderJobApiModel": {
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
          "hiring_team": {
            "description": "Hiring team for the job.",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/JobHiringTeam"
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
      "OrderJobHiringTeamApiModel": {
        "type": "object",
        "properties": {
          "user_id": {
            "type": "string",
            "example": "123456",
            "description": "User ID of the hiring team member.",
            "nullable": true
          },
          "remote_user_id": {
            "type": "string",
            "description": "Provider's unique identifier of the user",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "first_name": {
            "type": "string",
            "example": "John",
            "description": "First name of the hiring team member.",
            "nullable": true
          },
          "last_name": {
            "type": "string",
            "example": "Doe",
            "description": "Last name of the hiring team member.",
            "nullable": true
          },
          "email": {
            "type": "string",
            "example": "john.doe@gmail.com",
            "description": "Email of the hiring team member.",
            "nullable": true
          },
          "role": {
            "type": "string",
            "example": "Software Engineer",
            "description": "Role of the hiring team member.",
            "nullable": true
          }
        }
      },
      "OrderPackageApiModel": {
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
            "description": "Package name",
            "example": "Test 1",
            "nullable": true
          },
          "description": {
            "type": "string",
            "description": "Package description",
            "example": "Skills test to gauge a candidate's proficiency in job-specific skills",
            "nullable": true
          }
        }
      },
      "Package": {
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
            "description": "Package name",
            "example": "Test 1",
            "nullable": true
          },
          "description": {
            "type": "string",
            "description": "Package description",
            "example": "Skills test to gauge a candidate's proficiency in job-specific skills",
            "nullable": true
          }
        }
      },
      "ParentQuestion": {
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
          "option_ids": {
            "description": "List of parent questions's option IDs",
            "example": [
              "123e4567-e89b-12d3-a456-426614174000",
              "523e1234-e89b-fdd2-a456-762545121101"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "remote_option_ids": {
            "description": "Provider's list of parent questions's option IDs",
            "example": [
              "123e4567-e89b-12d3-a456-426614174000",
              "523e1234-e89b-fdd2-a456-762545121101"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "condition_type": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ConditionTypeEnum"
              }
            ]
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
              null
            ],
            "description": "The pay frequency of the job postings.",
            "example": "hourly",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the pay frequency.",
            "example": "Hourly",
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
              "twice_a_month",
              "every_two_months",
              "quarter",
              "every_six_months",
              "year",
              "one_off",
              "none",
              "unmapped_value",
              null
            ],
            "description": "The pay period of the job postings.",
            "example": "hour",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the pay period.",
            "example": "Hour",
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
      "PhoneNumber": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "description": "Type of phone number",
            "enum": [
              "personal",
              "work",
              "mobile",
              "home",
              "unknown",
              "other",
              null
            ],
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "phone": {
            "type": "string",
            "description": "Phone number string",
            "example": "+447700112233",
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
      "Question": {
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
          "type": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/QuestionsTypeEnum"
              }
            ]
          },
          "text": {
            "type": "string",
            "nullable": true
          },
          "required": {
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
          "multiple_choice_answers": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/QuestionMultipleChoiceAnswers"
            }
          },
          "parent_question": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/ParentQuestion"
              }
            ]
          }
        }
      },
      "QuestionMultipleChoiceAnswers": {
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
          "text": {
            "type": "string",
            "nullable": true
          }
        }
      },
      "Questionnaire": {
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
          "answers": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Answer"
            }
          }
        }
      },
      "QuestionsTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "short_text",
              "long_text",
              "attachment",
              "multi_select",
              "single_select",
              "boolean",
              "number",
              "date",
              "video",
              null
            ],
            "description": "The type of the questions.",
            "example": "short_text",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the questions type.",
            "example": "ShortText",
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
      },
      "RejectApplicationResult": {
        "type": "object",
        "properties": {
          "statusCode": {
            "type": "number",
            "example": 200
          },
          "message": {
            "type": "string",
            "example": "Application rejected successfully."
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
      "RejectedReason": {
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
          "label": {
            "type": "string",
            "description": "The label of the rejected reason.",
            "example": "Failed Phone Screen",
            "nullable": true
          },
          "type": {
            "type": "string",
            "description": "The string type of the rejected reason.",
            "example": "rejected_by_organization",
            "deprecated": true,
            "nullable": true
          },
          "rejected_reason_type": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/RejectedReasonTypeEnum"
              }
            ]
          }
        }
      },
      "RejectedReasonResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/RejectedReason"
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
      "RejectedReasonsPaginated": {
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
              "$ref": "#/components/schemas/RejectedReason"
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
      "RejectedReasonTypeEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "rejected_by_candidate",
              "rejected_by_organization",
              "other",
              "unknown",
              "unmapped_value",
              null
            ],
            "description": "The type of the rejected reason.",
            "example": "rejected_by_organization",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the rejected reason type.",
            "example": "RejectedByOrg",
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
      "ResultCandidateApiModel": {
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
          "profile_url": {
            "type": "string",
            "description": "Candidate profile url",
            "example": "https://exmaple.com/candidate?id=xyz",
            "nullable": true
          }
        }
      },
      "ResultEnum": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "enum": [
              "cancelled",
              "completed",
              "expired",
              "failed",
              "passed",
              null
            ],
            "description": "The result of the test.",
            "example": "passed",
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "source_value": {
            "description": "The source value of the test result.",
            "example": "Passed",
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
      "ResultLink": {
        "type": "object",
        "properties": {
          "label": {
            "type": "string",
            "description": "The label of the result link.",
            "example": "test result link",
            "nullable": true
          },
          "url": {
            "type": "string",
            "description": "The URL of the result link.",
            "example": "http://example.com/test-result/4565765/data",
            "nullable": true
          }
        }
      },
      "ScheduledInterview": {
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
          "application_id": {
            "type": "string",
            "nullable": true
          },
          "remote_application_id": {
            "type": "string",
            "description": "Provider's unique identifier of the application",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "interview_stage_id": {
            "type": "string",
            "nullable": true
          },
          "remote_interview_stage_id": {
            "type": "string",
            "description": "Provider's unique identifier of the interview stage",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "interview_stage": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/InterviewStage"
              }
            ]
          },
          "interview_status": {
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/InterviewStatusEnum"
              }
            ]
          },
          "interviewer_ids": {
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "remote_interviewer_ids": {
            "description": "Provider's unique identifiers of the interviewers",
            "example": [
              "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
              "e3cb75bf-aa84-466e-a6c1-b8322b257a48"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "interview_parts": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/InterviewPart"
            }
          },
          "interviewers": {
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Interviewer"
            }
          },
          "start_at": {
            "type": "string",
            "description": "Interview start date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "end_at": {
            "type": "string",
            "description": "Interview end date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "meeting_url": {
            "type": "string",
            "nullable": true
          },
          "created_at": {
            "type": "string",
            "description": "Interview created date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "Interview updated date",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "ScheduledInterviewsPaginated": {
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
              "$ref": "#/components/schemas/ScheduledInterview"
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
      "ScheduledInterviewsResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/ScheduledInterview"
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
      "ScoreApiModel": {
        "type": "object",
        "properties": {
          "label": {
            "type": "string",
            "description": "The label of the score",
            "example": "Percentage",
            "nullable": true
          },
          "value": {
            "type": "string",
            "description": "The value is the actual score",
            "example": "80",
            "nullable": true
          },
          "min": {
            "type": "string",
            "description": "The minimum value of the score",
            "example": "0",
            "nullable": true
          },
          "max": {
            "type": "string",
            "description": "The maximum value of the score",
            "example": "100",
            "nullable": true
          }
        }
      },
      "Scorecard": {
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
          "sections": {
            "description": "The sections in the scorecard",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ScorecardSection"
            }
          },
          "label": {
            "type": "string",
            "description": "The label of the scorecard",
            "example": "Technical Interview",
            "nullable": true
          },
          "candidate_id": {
            "type": "string",
            "description": "The candidate ID associated with the scorecard",
            "example": "5678-9",
            "nullable": true
          },
          "remote_candidate_id": {
            "type": "string",
            "description": "Provider's unique identifier of the candidate",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "application_id": {
            "type": "string",
            "description": "The application ID associated with the scorecard",
            "example": "1011-12",
            "nullable": true
          },
          "remote_application_id": {
            "type": "string",
            "description": "Provider's unique identifier of the application",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "interview_id": {
            "type": "string",
            "description": "The interview ID associated with the scorecard",
            "example": "1314-15",
            "nullable": true
          },
          "remote_interview_id": {
            "type": "string",
            "description": "Provider's unique identifier of the interview",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "author_id": {
            "type": "string",
            "description": "The author ID of the scorecard",
            "example": "1617-18",
            "nullable": true
          },
          "remote_author_id": {
            "type": "string",
            "description": "Provider's unique identifier of the author",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "overall_recommendation": {
            "type": "string",
            "description": "The overall recommendation",
            "example": "recommended",
            "enum": [
              "strong_yes",
              "yes",
              "no",
              "strong_no",
              "no_decision",
              "unmapped_value",
              null
            ],
            "x-speakeasy-unknown-values": "allow",
            "nullable": true
          },
          "created_at": {
            "type": "string",
            "description": "The creation date of the scorecard",
            "example": "2021-01-01T00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "The update date of the scorecard",
            "example": "2021-01-01T00:00.000Z",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "ScorecardSection": {
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
            "description": "The label of the section",
            "example": "Technical Skills",
            "nullable": true
          },
          "fields": {
            "description": "The fields within the section",
            "nullable": true,
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Field"
            }
          }
        }
      },
      "ScorecardsPaginated": {
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
              "$ref": "#/components/schemas/Scorecard"
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
      "ScorecardsResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/Scorecard"
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
      "SocialLink": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "description": "Type of the social link",
            "example": "linkedin",
            "nullable": true
          },
          "url": {
            "type": "string",
            "description": "URL of the social link",
            "example": "https://www.linkedin.com/in/romainsestier/",
            "nullable": true
          }
        }
      },
      "Source": {
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
            "description": "The source of the application",
            "example": "LinkedIn",
            "nullable": true
          }
        }
      },
      "UnifiedUploadCategoryEnumApiModel": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "description": "The category name for associating uploaded files.",
            "example": "reports, resumes",
            "nullable": true
          },
          "source_value": {
            "type": "string",
            "description": "The provider specific category for associating uploaded files, if provided, the value will be ignored.",
            "example": "550e8400-e29b-41d4-a716-446655440000, CUSTOM_CATEGORY_NAME",
            "nullable": true
          }
        }
      },
      "UnifiedUploadRequestDto": {
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
            "description": "The category object for associating uploaded files. If both an ID and a name are provided, the ID takes precedence.",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/UnifiedUploadCategoryEnumApiModel"
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
      "UpdatePackage": {
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
            "description": "Package name",
            "example": "Test 1",
            "nullable": true
          },
          "description": {
            "type": "string",
            "description": "Package description",
            "example": "Skills test to gauge a candidate's proficiency in job-specific skills",
            "nullable": true
          }
        }
      },
      "UpdateResult": {
        "type": "object",
        "properties": {
          "statusCode": {
            "type": "number",
            "example": 200
          },
          "message": {
            "type": "string",
            "example": "Record updated successfully."
          },
          "timestamp": {
            "type": "string",
            "example": "2021-01-01T01:01:01.000Z",
            "format": "date-time"
          }
        },
        "required": [
          "statusCode",
          "message",
          "timestamp"
        ]
      },
      "UpdateResultCandidateApiModel": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier",
            "example": "8187e5da-dc77-475e-9949-af0f1fa4e4e3",
            "nullable": true
          },
          "profile_url": {
            "type": "string",
            "description": "Candidate profile url",
            "example": "https://exmaple.com/candidate?id=xyz",
            "nullable": true
          }
        }
      },
      "User": {
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
          "email": {
            "type": "string",
            "nullable": true
          },
          "first_name": {
            "type": "string",
            "nullable": true
          },
          "last_name": {
            "type": "string",
            "nullable": true
          },
          "name": {
            "type": "string",
            "nullable": true
          },
          "phone": {
            "type": "string",
            "nullable": true
          }
        }
      },
      "UserResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/User"
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
      "UsersPaginated": {
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
              "$ref": "#/components/schemas/User"
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
