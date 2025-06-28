#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <float.h>

#ifdef _WIN32
#include <io.h>
#include <fcntl.h>
#endif

#define MAX_FIELDS 10
#define MAX_NAME_LENGTH 100
#define MAX_INPUT_SIZE 8192
#define MAX_WATER 100000

typedef struct {
    char name[MAX_NAME_LENGTH];
    int moisture;
    int waterNeeded;
    int allocated;
    int scheduled;
    int originalIndex;
} Field;

typedef struct {
    Field fields[MAX_FIELDS];
    int fieldCount;
    int totalWater;
    int totalWaterUsed;
    int remainingWater;
} IrrigationData;

char* findJsonValue(const char* json, const char* key) {
    char searchKey[256];
    snprintf(searchKey, sizeof(searchKey), "\"%s\":", key);
    
    char* pos = strstr(json, searchKey);
    if (!pos) return NULL;
    
    pos += strlen(searchKey);
    while (*pos == ' ' || *pos == '\t') pos++;
    return pos;
}

int extractJsonNumber(const char* json, const char* key) {
    char* pos = findJsonValue(json, key);
    if (!pos) return 0;
    return atoi(pos);
}

char* extractJsonString(const char* json, const char* key, char* buffer, int bufferSize) {
    char* pos = findJsonValue(json, key);
    if (!pos || *pos != '"') return NULL;
    
    pos++;
    int i = 0;
    while (i < bufferSize - 1 && *pos != '"' && *pos != '\0') {
        buffer[i++] = *pos++;
    }
    buffer[i] = '\0';
    return buffer;
}

int compareFields(const void *a, const void *b) {
    const Field *fieldA = (const Field *)a;
    const Field *fieldB = (const Field *)b;
    
    if (fieldA->moisture != fieldB->moisture) {
        return fieldA->moisture - fieldB->moisture;
    }
    return fieldB->waterNeeded - fieldA->waterNeeded;
}

int parseInput(const char *jsonString, IrrigationData *data) {
    if (!jsonString || !data) return 0;
    
    memset(data, 0, sizeof(IrrigationData));
    data->totalWater = extractJsonNumber(jsonString, "totalWater");
    if (data->totalWater <= 0) {
        fprintf(stderr, "Error: Invalid total water amount\n");
        return 0;
    }
    
    data->fieldCount = extractJsonNumber(jsonString, "fieldCount");
    if (data->fieldCount <= 0 || data->fieldCount > MAX_FIELDS) {
        fprintf(stderr, "Error: Invalid field count: %d\n", data->fieldCount);
        return 0;
    }
    
    char* fieldsStart = strstr(jsonString, "\"fields\":");
    if (!fieldsStart) {
        fprintf(stderr, "Error: Fields array not found\n");
        return 0;
    }
    
    fieldsStart = strchr(fieldsStart, '[');
    if (!fieldsStart) {
        fprintf(stderr, "Error: Fields array start not found\n");
        return 0;
    }
    
    char* fieldPos = fieldsStart + 1;
    int fieldIndex = 0;
    
    while (fieldIndex < data->fieldCount && fieldPos) {
        fieldPos = strchr(fieldPos, '{');
        if (!fieldPos) break;
        
        char* fieldEnd = strchr(fieldPos, '}');
        if (!fieldEnd) break;
        
        int fieldLen = fieldEnd - fieldPos + 1;
        char fieldStr[1024];
        if (fieldLen < sizeof(fieldStr)) {
            strncpy(fieldStr, fieldPos, fieldLen);
            fieldStr[fieldLen] = '\0';
            
            char nameBuffer[MAX_NAME_LENGTH];
            if (extractJsonString(fieldStr, "name", nameBuffer, sizeof(nameBuffer))) {
                strncpy(data->fields[fieldIndex].name, nameBuffer, MAX_NAME_LENGTH - 1);
                data->fields[fieldIndex].name[MAX_NAME_LENGTH - 1] = '\0';
                data->fields[fieldIndex].originalIndex = fieldIndex;
                
                data->fields[fieldIndex].moisture = extractJsonNumber(fieldStr, "moisture");
                data->fields[fieldIndex].waterNeeded = extractJsonNumber(fieldStr, "waterNeeded");
                
                if (data->fields[fieldIndex].moisture < 0 || data->fields[fieldIndex].moisture > 100) {
                    fprintf(stderr, "Error: Invalid moisture level for field %s: %d\n", 
                            data->fields[fieldIndex].name, data->fields[fieldIndex].moisture);
                    return 0;
                }
                
                if (data->fields[fieldIndex].waterNeeded < 0) {
                    fprintf(stderr, "Error: Invalid water needed for field %s: %d\n", 
                            data->fields[fieldIndex].name, data->fields[fieldIndex].waterNeeded);
                    return 0;
                }
                
                fieldIndex++;
            }
        }
        fieldPos = fieldEnd + 1;
    }
    data->fieldCount = fieldIndex;
    return fieldIndex > 0;
}

void generateOutput(const IrrigationData *data) {
    if (!data) {
        printf("{\"error\":\"Invalid data\"}\n");
        return;
    }
    
    printf("{\n");
    printf("  \"algorithm\": \"DynamicProgramming\",\n");
    printf("  \"scheduled\": [\n");
    
    int scheduledCount = 0;
    for (int i = 0; i < data->fieldCount; i++) {
        if (data->fields[i].scheduled) {
            if (scheduledCount > 0) printf(",\n");
            printf("    {\n");
            printf("      \"name\": \"%s\",\n", data->fields[i].name);
            printf("      \"moisture\": %d,\n", data->fields[i].moisture);
            printf("      \"need\": %d,\n", data->fields[i].waterNeeded);
            printf("      \"allocated\": %d\n", data->fields[i].allocated);
            printf("    }");
            scheduledCount++;
        }
    }
    
    printf("\n  ],\n");
    printf("  \"totalWaterUsed\": %d,\n", data->totalWaterUsed);
    printf("  \"remainingWater\": %d\n", data->remainingWater);
    printf("}\n");
}

int main() {
    char input[MAX_INPUT_SIZE] = {0};
#ifdef _WIN32
    _setmode(_fileno(stdin), _O_BINARY);
    _setmode(_fileno(stdout), _O_BINARY);
#endif

    size_t totalRead = 0;
    char buffer[1024];
    while (fgets(buffer, sizeof(buffer), stdin) && totalRead < sizeof(input) - 1) {
        size_t bufferLen = strlen(buffer);
        if (totalRead + bufferLen < sizeof(input)) {
            strcat(input + totalRead, buffer);
            totalRead += bufferLen;
        } else break;
    }
    
    if (totalRead == 0) {
        fprintf(stderr, "Error: No input received\n");
        printf("{\"error\":\"No input received\"}\n");
        return 1;
    }
    
    IrrigationData data;
    if (!parseInput(input, &data)) {
        fprintf(stderr, "Error: Failed to parse input JSON\n");
        printf("{\"error\":\"Failed to parse input JSON\"}\n");
        return 1;
    }

    // Sort fields by priority
    qsort(data.fields, data.fieldCount, sizeof(Field), compareFields);
    
    // DP setup
    float **dp = malloc((data.fieldCount + 1) * sizeof(float *));
    int **parent = malloc((data.fieldCount + 1) * sizeof(int *));
    for (int i = 0; i <= data.fieldCount; i++) {
        dp[i] = malloc((data.totalWater + 1) * sizeof(float));
        parent[i] = malloc((data.totalWater + 1) * sizeof(int));
        for (int w = 0; w <= data.totalWater; w++) {
            dp[i][w] = -FLT_MAX;
            parent[i][w] = -1;
        }
    }
    dp[0][0] = 0;

    // DP computation
    for (int i = 0; i < data.fieldCount; i++) {
        int minWater = (data.fields[i].waterNeeded + 9) / 10;
        for (int w = 0; w <= data.totalWater; w++) {
            // Skip field
            if (dp[i][w] > dp[i + 1][w]) {
                dp[i + 1][w] = dp[i][w];
                parent[i + 1][w] = -1;
            }

            // Allocate to field
            for (int x = minWater; x <= data.fields[i].waterNeeded; x++) {
                if (w < x) break;
                float value = (100.0 - data.fields[i].moisture) * 
                             (x / (float)data.fields[i].waterNeeded);
                float candidate = dp[i][w - x] + value;
                
                if (candidate > dp[i + 1][w]) {
                    dp[i + 1][w] = candidate;
                    parent[i + 1][w] = x;
                }
            }
        }
    }

    // Find optimal water usage
    int best_w = 0;
    float best_value = -FLT_MAX;
    for (int w = 0; w <= data.totalWater; w++) {
        if (dp[data.fieldCount][w] > best_value) {
            best_value = dp[data.fieldCount][w];
            best_w = w;
        }
    }

    // Backtrack allocations
    int current_w = best_w;
    for (int i = data.fieldCount - 1; i >= 0; i--) {
        int x = parent[i + 1][current_w];
        if (x >= 0) {
            data.fields[i].allocated = x;
            data.fields[i].scheduled = 1;
            current_w -= x;
        }
    }
    data.totalWaterUsed = best_w;
    data.remainingWater = data.totalWater - best_w;

    // Restore original field order
    for (int i = 0; i < data.fieldCount; i++) {
        for (int j = i + 1; j < data.fieldCount; j++) {
            if (data.fields[j].originalIndex < data.fields[i].originalIndex) {
                Field temp = data.fields[i];
                data.fields[i] = data.fields[j];
                data.fields[j] = temp;
            }
        }
    }

    generateOutput(&data);

    // Cleanup
    for (int i = 0; i <= data.fieldCount; i++) {
        free(dp[i]);
        free(parent[i]);
    }
    free(dp);
    free(parent);

    return 0;
}
