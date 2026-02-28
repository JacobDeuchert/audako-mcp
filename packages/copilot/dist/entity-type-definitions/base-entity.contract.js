import { formatZodValidationErrors } from './zod-utils.js';
export class BaseEntityContract {
    aliases = [];
    examples;
    appliesTo = {};
    cachedDefinition;
    getDefinition() {
        if (!this.cachedDefinition) {
            this.cachedDefinition = {
                key: this.entityType,
                aliases: this.aliases,
                entityType: this.entityType,
                description: this.description,
                fields: this.fieldDefinitions.map(field => ({
                    key: field.key,
                    dtoName: field.dtoName ?? field.key,
                    type: field.type,
                    description: field.description,
                    entityPath: field.entityPath,
                    requiredOnCreate: field.requiredOnCreate ?? false,
                    enumValues: field.enumValues,
                    appliesTo: field.appliesTo ?? this.appliesTo[field.key],
                })),
                examples: this.examples,
            };
        }
        return this.cachedDefinition;
    }
    validate(payload, mode) {
        const schema = mode === 'create' ? this.createSchema : this.updateSchema;
        const result = schema.safeParse(payload);
        if (result.success) {
            return [];
        }
        return formatZodValidationErrors(result.error);
    }
    fromPayload(payload, context) {
        const parsedPayload = this.parseCreatePayload(payload);
        return this.fromCreatePayload(parsedPayload, context);
    }
    applyUpdate(existingEntity, changes, context) {
        const parsedChanges = this.parseUpdatePayload(changes);
        return this.fromUpdatedPayload(existingEntity, parsedChanges, context);
    }
    parseCreatePayload(payload) {
        const result = this.createSchema.safeParse(payload);
        if (result.success) {
            return result.data;
        }
        throw new Error(formatZodValidationErrors(result.error).join('; '));
    }
    parseUpdatePayload(payload) {
        const result = this.updateSchema.safeParse(payload);
        if (result.success) {
            return result.data;
        }
        throw new Error(formatZodValidationErrors(result.error).join('; '));
    }
}
//# sourceMappingURL=base-entity.contract.js.map