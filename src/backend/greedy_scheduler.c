#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
#include <io.h>
#include <fcntl.h>
#endif

#define MAX_FIELDS 10
#define MAX_NAME_LENGTH 100
#define MAX_INPUT_SIZE 8192

typedef struct {
    char name[MAX_NAME_LENGTH];
    int moisture;
    int waterNeeded;
    int timeNeeded;
    int allocated;
    int scheduled;
} Field;

typedef struct {
    Field fields[MAX_FIELDS];
    int fieldCount;
    int totalWater;
    int totalElectricity;
    int waterDeliveryRate;
    int totalWaterUsed;
    int totalTimeUsed;
    int remainingWater;
    int remainingElectricity;
    int useTimeConstraints;
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

void calculateFieldTimes(IrrigationData *data) {
    if (!data) return;
    
    if (data->waterDeliveryRate <= 0) {
        data->waterDeliveryRate = 50;
    }
    
    for (int i = 0; i < data->fieldCount; i++) {
        data->fields[i].timeNeeded = (data->fields[i].waterNeeded + data->waterDeliveryRate - 1) / data->waterDeliveryRate;
        if (data->fields[i].timeNeeded <= 0) {
            data->fields[i].timeNeeded = 1;
        }
    }
}

void scheduleIrrigation(IrrigationData *data) {
    if (!data || data->fieldCount <= 0 || data->totalWater < 0) {
        return;
    }
    
    if (data->useTimeConstraints) {
        calculateFieldTimes(data);
    }
    
    qsort(data->fields, data->fieldCount, sizeof(Field), compareFields);
    
    data->remainingWater = data->totalWater;
    data->remainingElectricity = data->totalElectricity;
    data->totalWaterUsed = 0;
    data->totalTimeUsed = 0;
    
    for (int i = 0; i < data->fieldCount; i++) {
        data->fields[i].scheduled = 0;
        data->fields[i].allocated = 0;
    }
    
    for (int i = 0; i < data->fieldCount; i++) {
        if (data->useTimeConstraints) {
            int minWater = data->fields[i].waterNeeded / 10;
            int minTime = (minWater + data->waterDeliveryRate - 1) / data->waterDeliveryRate;
            
            if (data->remainingWater >= minWater && data->remainingElectricity >= minTime) {
                int waterToAllocate = data->fields[i].waterNeeded;
                int timeToAllocate = data->fields[i].timeNeeded;
                
                if (waterToAllocate > data->remainingWater) {
                    waterToAllocate = data->remainingWater;
                    timeToAllocate = (waterToAllocate + data->waterDeliveryRate - 1) / data->waterDeliveryRate;
                }
                
                if (timeToAllocate > data->remainingElectricity) {
                    timeToAllocate = data->remainingElectricity;
                    waterToAllocate = timeToAllocate * data->waterDeliveryRate;
                    if (waterToAllocate > data->fields[i].waterNeeded) {
                        waterToAllocate = data->fields[i].waterNeeded;
                    }
                }
                
                data->fields[i].allocated = waterToAllocate;
                data->fields[i].scheduled = 1;
                data->remainingWater -= waterToAllocate;
                data->remainingElectricity -= timeToAllocate;
                data->totalWaterUsed += waterToAllocate;
                data->totalTimeUsed += timeToAllocate;
            }
        } else {
            if (data->remainingWater >= data->fields[i].waterNeeded) {
                data->fields[i].allocated = data->fields[i].waterNeeded;
                data->fields[i].scheduled = 1;
                data->remainingWater -= data->fields[i].waterNeeded;
                data->totalWaterUsed += data->fields[i].waterNeeded;
            } else if (data->remainingWater > 0) {
                int minAllocation = data->fields[i].waterNeeded / 10;
                if (data->remainingWater >= minAllocation) {
                    data->fields[i].allocated = data->remainingWater;
                    data->fields[i].scheduled = 1;
                    data->totalWaterUsed += data->remainingWater;
                    data->remainingWater = 0;
                }
                break;
            } else {
                break;
            }
        }
    }
}

int parseInput(const char *jsonString, IrrigationData *data) {
    if (!jsonString || !data) return 0;
    
    memset(data, 0, sizeof(IrrigationData));
    data->totalWater = extractJsonNumber(jsonString, "totalWater");
    if (data->totalWater <= 0) {
        fprintf(stderr, "Error: Invalid total water amount\n");
        return 0;
    }
    
    data->totalElectricity = extractJsonNumber(jsonString, "totalElectricity");
    data->waterDeliveryRate = extractJsonNumber(jsonString, "waterDeliveryRate");
    data->useTimeConstraints = (data->totalElectricity > 0 && data->waterDeliveryRate > 0);
    
    if (!data->useTimeConstraints) {
        data->totalElectricity = 1000;
        data->waterDeliveryRate = 50;
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
    printf("  \"algorithm\": \"Greedy\",\n");
    printf("  \"scheduled\": [\n");
    
    int scheduledCount = 0;
    for (int i = 0; i < data->fieldCount; i++) {
        if (data->fields[i].scheduled) {
            if (scheduledCount > 0) printf(",\n");
            printf("    {\n");
            printf("      \"name\": \"%s\",\n", data->fields[i].name);
            printf("      \"moisture\": %d,\n", data->fields[i].moisture);
            printf("      \"need\": %d,\n", data->fields[i].waterNeeded);
            printf("      \"allocated\": %d", data->fields[i].allocated);
            
            if (data->useTimeConstraints) {
                printf(",\n      \"timeNeeded\": %d\n", data->fields[i].timeNeeded);
            } else {
                printf("\n");
            }
            printf("    }");
            scheduledCount++;
        }
    }
    
    printf("\n  ],\n");
    printf("  \"totalWaterUsed\": %d,\n", data->totalWaterUsed);
    
    if (data->useTimeConstraints) {
        printf("  \"totalTimeUsed\": %d,\n", data->totalTimeUsed);
        printf("  \"remainingElectricity\": %d,\n", data->remainingElectricity);
    }
    
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
    
    scheduleIrrigation(&data);
    generateOutput(&data);
    return 0;
}
