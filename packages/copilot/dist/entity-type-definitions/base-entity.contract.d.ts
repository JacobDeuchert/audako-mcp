import type { ConfigurationEntity, EntityType } from 'audako-core';
import type { z } from 'zod';
import type { EntityContractContext, EntityFieldDefinition, EntityTypeDefinition, EntityTypeExamples, ValidationMode } from './types.js';
export declare abstract class BaseEntityContract<TEntity extends ConfigurationEntity, TCreatePayload extends Record<string, unknown>, TUpdatePayload extends Record<string, unknown>> {
    abstract readonly key: string;
    abstract readonly entityType: EntityType;
    abstract readonly description: string;
    readonly aliases: string[];
    readonly examples?: EntityTypeExamples;
    protected readonly appliesTo: Record<string, string[]>;
    protected abstract readonly createSchema: z.ZodType<TCreatePayload>;
    protected abstract readonly updateSchema: z.ZodType<TUpdatePayload>;
    protected abstract readonly fieldDefinitions: EntityFieldDefinition[];
    private cachedDefinition?;
    protected abstract fromCreatePayload(payload: TCreatePayload, context?: EntityContractContext): TEntity;
    protected abstract fromUpdatedPayload(existingEntity: TEntity, changes: TUpdatePayload, context?: EntityContractContext): TEntity;
    abstract toPayload(entity: TEntity): Record<string, unknown>;
    getDefinition(): EntityTypeDefinition;
    validate(payload: Record<string, unknown>, mode: ValidationMode): string[];
    fromPayload(payload: Record<string, unknown>, context?: EntityContractContext): TEntity;
    applyUpdate(existingEntity: TEntity, changes: Record<string, unknown>, context?: EntityContractContext): TEntity;
    private parseCreatePayload;
    private parseUpdatePayload;
}
//# sourceMappingURL=base-entity.contract.d.ts.map