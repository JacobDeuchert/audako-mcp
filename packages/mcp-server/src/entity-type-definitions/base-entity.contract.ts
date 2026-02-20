import { ConfigurationEntity, EntityType } from 'audako-core';
import { z } from 'zod';
import { formatZodValidationErrors } from './zod-utils.js';
import {
  EntityContractContext,
  EntityFieldDefinition,
  EntityTypeDefinition,
  EntityTypeExamples,
  ValidationMode,
} from './types.js';

export abstract class BaseEntityContract<
  TEntity extends ConfigurationEntity,
  TCreatePayload extends Record<string, unknown>,
  TUpdatePayload extends Record<string, unknown>,
> {
  public abstract readonly key: string;
  public abstract readonly entityType: EntityType;
  public abstract readonly description: string;
  public readonly aliases: string[] = [];
  public readonly examples?: EntityTypeExamples;

  protected readonly appliesTo: Record<string, string[]> = {};

  protected abstract readonly createSchema: z.ZodType<TCreatePayload>;
  protected abstract readonly updateSchema: z.ZodType<TUpdatePayload>;
  protected abstract readonly fieldDefinitions: EntityFieldDefinition[];

  private cachedDefinition?: EntityTypeDefinition;

  protected abstract fromCreatePayload(
    payload: TCreatePayload,
    context?: EntityContractContext,
  ): TEntity;

  protected abstract fromUpdatedPayload(
    existingEntity: TEntity,
    changes: TUpdatePayload,
    context?: EntityContractContext,
  ): TEntity;

  public abstract toPayload(entity: TEntity): Record<string, unknown>;

  public getDefinition(): EntityTypeDefinition {
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

  public validate(payload: Record<string, unknown>, mode: ValidationMode): string[] {
    const schema = mode === 'create' ? this.createSchema : this.updateSchema;
    const result = schema.safeParse(payload);

    if (result.success) {
      return [];
    }

    return formatZodValidationErrors(result.error);
  }

  public fromPayload(payload: Record<string, unknown>, context?: EntityContractContext): TEntity {
    const parsedPayload = this.parseCreatePayload(payload);
    return this.fromCreatePayload(parsedPayload, context);
  }

  public applyUpdate(
    existingEntity: TEntity,
    changes: Record<string, unknown>,
    context?: EntityContractContext,
  ): TEntity {
    const parsedChanges = this.parseUpdatePayload(changes);
    return this.fromUpdatedPayload(existingEntity, parsedChanges, context);
  }

  private parseCreatePayload(payload: Record<string, unknown>): TCreatePayload {
    const result = this.createSchema.safeParse(payload);
    if (result.success) {
      return result.data;
    }

    throw new Error(formatZodValidationErrors(result.error).join('; '));
  }

  private parseUpdatePayload(payload: Record<string, unknown>): TUpdatePayload {
    const result = this.updateSchema.safeParse(payload);
    if (result.success) {
      return result.data;
    }

    throw new Error(formatZodValidationErrors(result.error).join('; '));
  }
}
