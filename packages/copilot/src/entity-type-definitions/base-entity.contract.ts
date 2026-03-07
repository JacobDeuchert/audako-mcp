import { type ConfigurationEntity, type EntityType, EntityUtils } from 'audako-core';
import type { z } from 'zod';
import type {
  EntityContractContext,
  EntityFieldDefinition,
  EntityTypeDefinition,
  EntityTypeExamples,
  ValidationMode,
} from './types.js';
import { formatZodValidationErrors } from './zod-utils.js';

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

export type ConfigurationEntityModel = Record<string, unknown> & {
  id?: string;
  path?: string[];
  name?: string;
  description?: string;
  groupId?: string;
};

export const configurationEntityFieldDefinitions: EntityFieldDefinition[] = [
  {
    key: 'name',
    dtoName: 'name',
    description: 'Name of the entity.',
    type: 'string',
    requiredOnCreate: true,
  },
  {
    key: 'description',
    dtoName: 'description',
    description: 'Description of the entity.',
    type: 'string',
    requiredOnCreate: false,
  },
  {
    key: 'groupId',
    dtoName: 'groupId',
    description:
      'Parent group ID. Pass a real group ID or the literal "context" to use group from session context.',
    type: 'string',
    requiredOnCreate: true,
  },
];

export abstract class ConfigurationEntityContract<
  TEntity extends ConfigurationEntity,
  TCreatePayload extends Record<string, unknown>,
  TUpdatePayload extends Record<string, unknown>,
> extends BaseEntityContract<TEntity, TCreatePayload, TUpdatePayload> {
  protected applyConfigurationEntityContext(
    model: { groupId?: string },
    context?: EntityContractContext,
  ): void {
    if (!model.groupId && context?.tenantRootGroupId) {
      model.groupId = context.tenantRootGroupId;
    }
  }

  protected setBaseEntityModelProperties(model: ConfigurationEntityModel, entity: TEntity): void {
    this.setModelValueIfDefined(model, 'id', entity.Id);
    this.setModelValueIfDefined(model, 'path', entity.Path ? [...entity.Path] : undefined);
    this.setModelValueIfDefined(
      model,
      'name',
      EntityUtils.getPropertyValue<TEntity, unknown>(entity, 'Name', true),
    );
    this.setModelValueIfDefined(
      model,
      'description',
      EntityUtils.getPropertyValue<TEntity, unknown>(entity, 'Description', true),
    );
    this.setModelValueIfDefined(model, 'groupId', entity.GroupId);
  }

  protected applyBaseEntityProperties(entity: TEntity, model: ConfigurationEntityModel): void {
    if (typeof model.id !== 'undefined') {
      entity.Id = model.id;
    }

    if (typeof model.path !== 'undefined') {
      entity.Path = [...model.path];
    }

    if (model.name !== undefined) {
      EntityUtils.setPropertyValue(entity, 'Name', model.name, true);
    }

    if (model.description !== undefined) {
      EntityUtils.setPropertyValue(entity, 'Description', model.description, true);
    }

    if (model.groupId !== undefined) {
      entity.GroupId = model.groupId;
    }
  }

  protected getDtoFieldName(field: EntityFieldDefinition): string {
    return field.dtoName ?? field.key;
  }

  protected setModelValueIfDefined(
    model: Record<string, unknown>,
    key: string,
    value: unknown,
  ): void {
    if (typeof value === 'undefined' || value === null) {
      return;
    }

    model[key] = Array.isArray(value) ? [...value] : value;
  }
}
