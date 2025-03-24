// Generated OpenAPI specification for documents
export const documentsSpec = {
  "openapi": "3.1.0",
  "paths": {
    "/unified/documents/files/{id}/download": {
      "get": {
        "operationId": "documents_download_file",
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
            "description": "The file with the given identifiers was retrieved.",
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
        "summary": "Download File",
        "tags": [
          "Files"
        ],
        "x-speakeasy-group": "documents",
        "x-speakeasy-name-override": "download_file",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/documents/files/upload": {
      "post": {
        "operationId": "documents_upload_file",
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
                "$ref": "#/components/schemas/UnifiedUploadRequestDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "The file was uploaded.",
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
        "summary": "Upload File",
        "tags": [
          "Files"
        ],
        "x-speakeasy-group": "documents",
        "x-speakeasy-name-override": "upload_file",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/documents/files": {
      "get": {
        "operationId": "documents_list_files",
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
              "example": "id,remote_id,name,description,url,size,file_format,path,owner_id,remote_owner_id,folder_id,remote_folder_id,drive_id,remote_drive_id,export_formats,created_at,updated_at",
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
            "description": "The list of files was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/FilesPaginated"
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
        "summary": "List Files",
        "tags": [
          "Files"
        ],
        "x-speakeasy-group": "documents",
        "x-speakeasy-name-override": "list_files",
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
    "/unified/documents/files/{id}": {
      "get": {
        "operationId": "documents_get_file",
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
              "example": "id,remote_id,name,description,url,size,file_format,path,owner_id,remote_owner_id,folder_id,remote_folder_id,drive_id,remote_drive_id,export_formats,created_at,updated_at",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The file with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/FileResult"
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
        "summary": "Get File",
        "tags": [
          "Files"
        ],
        "x-speakeasy-group": "documents",
        "x-speakeasy-name-override": "get_file",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/documents/files/search": {
      "post": {
        "operationId": "documents_search_files",
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
                "$ref": "#/components/schemas/DocumentsFilesSearchRequestDto"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "The list of files matching the search query was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/FilesPaginated"
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
        "summary": "Search Files",
        "tags": [
          "Files"
        ],
        "x-speakeasy-group": "documents",
        "x-speakeasy-name-override": "search_files",
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
    "/unified/documents/folders": {
      "get": {
        "operationId": "documents_list_folders",
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
              "example": "id,remote_id,name,description,url,size,path,owner_id,remote_owner_id,parent_folder_id,remote_parent_folder_id,drive_id,remote_drive_id,created_at,updated_at",
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
            "description": "The list of folders was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/FoldersPaginated"
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
        "summary": "List Folders",
        "tags": [
          "Folders"
        ],
        "x-speakeasy-group": "documents",
        "x-speakeasy-name-override": "list_folders",
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
    "/unified/documents/folders/{id}": {
      "get": {
        "operationId": "documents_get_folder",
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
              "example": "id,remote_id,name,description,url,size,path,owner_id,remote_owner_id,parent_folder_id,remote_parent_folder_id,drive_id,remote_drive_id,created_at,updated_at",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The folder with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/FolderResult"
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
        "summary": "Get Folder",
        "tags": [
          "Folders"
        ],
        "x-speakeasy-group": "documents",
        "x-speakeasy-name-override": "get_folder",
        "x-speakeasy-retries": {
          "statusCodes": [
            429,
            408
          ],
          "strategy": "backoff"
        }
      }
    },
    "/unified/documents/drives": {
      "get": {
        "operationId": "documents_list_drives",
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
              "example": "id,remote_id,name,description,url,created_at,updated_at",
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
            "description": "The list of drives was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DrivesPaginated"
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
        "summary": "List Drives",
        "tags": [
          "Drives"
        ],
        "x-speakeasy-group": "documents",
        "x-speakeasy-name-override": "list_drives",
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
    "/unified/documents/drives/{id}": {
      "get": {
        "operationId": "documents_get_drive",
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
              "example": "id,remote_id,name,description,url,created_at,updated_at",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "The drive with the given identifier was retrieved.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DriveResult"
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
        "summary": "Get Drive",
        "tags": [
          "Drives"
        ],
        "x-speakeasy-group": "documents",
        "x-speakeasy-name-override": "get_drive",
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
    "title": "Documents",
    "description": "The documentation for the StackOne Unified API - DOCUMENTS",
    "version": "1.0.0",
    "contact": {}
  },
  "tags": [
    {
      "name": "Files",
      "description": ""
    },
    {
      "name": "Folders",
      "description": ""
    },
    {
      "name": "Drives",
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
      "DocumentsFilesSearchRequestDto": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "The query to search for",
            "example": "test"
          },
          "field": {
            "type": "string",
            "description": "The specific field to search within. If not provided, the search will be performed across all searchable text fields",
            "example": "name",
            "nullable": true
          },
          "operation_type": {
            "description": "The operation type to use for the query. If not provided, the default operation is `contains`.",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/OperationTypeEnumApiModel"
              }
            ]
          },
          "params": {
            "description": "The additional parameters of the query",
            "nullable": true,
            "allOf": [
              {
                "$ref": "#/components/schemas/UnifiedSearchParamsRequestDto"
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
        },
        "required": [
          "query"
        ]
      },
      "DriveResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/Drives"
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
      "Drives": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "The ID associated with this drive",
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
            "description": "The name associated with this drive",
            "example": "USA Development Drive",
            "nullable": true
          },
          "description": {
            "type": "string",
            "description": "The description associated with this drive",
            "example": "Drive with USA Development documents",
            "nullable": true
          },
          "url": {
            "type": "string",
            "description": "The url of the drive",
            "example": "https://test.sharepoint.com/Document%20Library",
            "nullable": true
          },
          "created_at": {
            "type": "string",
            "description": "The created date of the drive",
            "example": "2023-02-23T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "The last updated date of the drive",
            "example": "2024-02-23T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "DrivesPaginated": {
        "type": "object",
        "properties": {
          "next": {
            "type": "string",
            "nullable": true
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Drives"
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
      "FileResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/Files"
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
      "Files": {
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
            "description": "The name associated with this file",
            "example": "Information-Technology",
            "nullable": true
          },
          "description": {
            "type": "string",
            "description": "The description of the file",
            "example": "This is the description associated to the file.",
            "nullable": true
          },
          "size": {
            "type": "number",
            "description": "The size of this file",
            "example": 1024,
            "nullable": true
          },
          "url": {
            "type": "string",
            "description": "The url of the file",
            "example": "https://drive.google.com/file/d/nd8932h9d/view",
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
          "path": {
            "type": "string",
            "description": "The path where the file is stored",
            "example": "/path/to/file",
            "nullable": true
          },
          "owner_id": {
            "type": "string",
            "description": "The user ID of owner of this file",
            "example": "c28xyrc55866bvuv",
            "nullable": true
          },
          "export_formats": {
            "description": "List of supported export formats",
            "example": [
              "application/pdf"
            ],
            "nullable": true,
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "remote_owner_id": {
            "type": "string",
            "description": "Provider's unique identifier of the owner of this file",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "folder_id": {
            "type": "string",
            "description": "The parent folder ID associated with this file",
            "example": "c28xyrc55866bvuv",
            "nullable": true
          },
          "remote_folder_id": {
            "type": "string",
            "description": "Provider's unique identifier of the parent folder associated with this file",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "drive_id": {
            "type": "string",
            "description": "The parent drive ID associated with this file",
            "example": "c28xyrc55866bvuv",
            "nullable": true
          },
          "remote_drive_id": {
            "type": "string",
            "description": "Provider's unique identifier of the parent drive associated with this file",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "created_at": {
            "type": "string",
            "description": "The created date of the file",
            "example": "2023-02-23T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "The last updated date of the file",
            "example": "2024-02-23T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "FilesPaginated": {
        "type": "object",
        "properties": {
          "next": {
            "type": "string",
            "nullable": true
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Files"
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
      "FolderResult": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/Folders"
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
      "Folders": {
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
            "description": "The name associated with this folder",
            "example": "Information-Technology",
            "nullable": true
          },
          "description": {
            "type": "string",
            "description": "The description of the folder",
            "example": "This is the description associated to the folder.",
            "nullable": true
          },
          "size": {
            "type": "number",
            "description": "The size of this folder in bytes",
            "example": 1024,
            "nullable": true
          },
          "url": {
            "type": "string",
            "description": "The url of the folder",
            "example": "https://drive.google.com/folder/d/nd8932h9d/view",
            "nullable": true
          },
          "path": {
            "type": "string",
            "description": "The path where the folder is stored",
            "example": "/path/to/folder",
            "nullable": true
          },
          "owner_id": {
            "type": "string",
            "description": "The user ID of owner of this folder",
            "example": "c28xyrc55866bvuv",
            "nullable": true
          },
          "remote_owner_id": {
            "type": "string",
            "description": "Provider's unique identifier of the owner of this folder",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "parent_folder_id": {
            "type": "string",
            "description": "The parent folder ID associated with this folder",
            "example": "c28xyrc55866bvuv",
            "nullable": true
          },
          "remote_parent_folder_id": {
            "type": "string",
            "description": "Provider's unique identifier of the parent folder associated with this folder",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "drive_id": {
            "type": "string",
            "description": "The parent drive ID associated with this folder",
            "example": "c28xyrc55866bvuv",
            "nullable": true
          },
          "remote_drive_id": {
            "type": "string",
            "description": "Provider's unique identifier of the parent drive associated with this folder",
            "example": "e3cb75bf-aa84-466e-a6c1-b8322b257a48",
            "nullable": true
          },
          "created_at": {
            "type": "string",
            "description": "The created date of the folder",
            "example": "2023-02-23T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          },
          "updated_at": {
            "type": "string",
            "description": "The last updated date of the folder",
            "example": "2024-02-23T00:00:00.000Z",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "FoldersPaginated": {
        "type": "object",
        "properties": {
          "next": {
            "type": "string",
            "nullable": true
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Folders"
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
      "OperationTypeEnumApiModel": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "description": "The operation type of the query",
            "enum": [
              "contains",
              "equals",
              "not_equals",
              "unmapped_value",
              null
            ],
            "example": "contains",
            "default": "contains",
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
            "example": "contains",
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
      "UnifiedSearchParamsRequestDto": {
        "type": "object",
        "properties": {
          "raw": {
            "type": "boolean",
            "description": "Indicates that the raw request result should be returned in addition to the mapped result (default value is false)",
            "nullable": true
          },
          "fields": {
            "type": "string",
            "description": "The comma separated list of fields to return in the response (if empty, all fields are returned)",
            "nullable": true
          },
          "filter": {
            "type": "object",
            "description": "Filter parameters that allow greater customisation of the list response",
            "properties": {
              "updated_after": {
                "description": "Use a string with a date to only select results updated after that given date",
                "example": "2020-01-01T00:00:00.000Z",
                "type": "string",
                "nullable": true,
                "additionalProperties": false
              }
            },
            "nullable": true
          },
          "page": {
            "type": "string",
            "description": "The page number of the results to fetch",
            "deprecated": true,
            "nullable": true
          },
          "page_size": {
            "type": "string",
            "description": "The number of results per page (default value is 25)",
            "nullable": true
          },
          "next": {
            "type": "string",
            "description": "The unified cursor",
            "nullable": true
          },
          "updated_after": {
            "type": "string",
            "description": "Use a string with a date to only select results updated after that given date",
            "example": "2020-01-01T00:00:00.000Z",
            "deprecated": true,
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
