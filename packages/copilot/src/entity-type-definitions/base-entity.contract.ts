import { type ConfigurationEntity, type EntityType, EntityUtils } from 'audako-core';
import { existsSync } from 'fs';
import { dirname, isAbsolute, join } from 'path';
import { fileURLToPath } from 'url';
import type { z } from 'zod';
import { loadMarkdownFile } from '../services/doc-loader.js';
import { resolveType } from '../services/type-registry.js';
import type {
  EntityContractContext,
  EntityFieldDefinition,
  EntityTypeDefinition,
  SettingsTypeDefinition,
  ValidationMode,
} from './types.js';
import { formatZodValidationErrors, validateSettingsPayload } from './zod-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function resolveMarkdownPath(markdownPath: string): string {
  if (isAbsolute(markdownPath)) {
    return markdownPath;
  }

  const candidatePaths = [
    join(__dirname, markdownPath),
    join(__dirname, '..', '..', 'src', 'entity-type-definitions', markdownPath),
    join(process.cwd(), 'src', 'entity-type-definitions', markdownPath),
    join(process.cwd(), 'packages', 'copilot', 'src', 'entity-type-definitions', markdownPath),
  ];

  const existingPath = candidatePaths.find(candidate => existsSync(candidate));
  return existingPath ?? markdownPath;
}

function resolveExtendedInfo(extendedInfo: string): string {
  if (!extendedInfo.toLowerCase().endsWith('.md')) {
    return extendedInfo;
  }

  return loadMarkdownFile(resolveMarkdownPath(extendedInfo));
}

export abstract class BaseEntityContract<
  TEntity extends ConfigurationEntity,
  TCreatePayload extends Record<string, unknown>,
  TUpdatePayload extends Record<string, unknown>,
> {
  public abstract readonly key: string;
  public abstract readonly entityType: EntityType;
  public abstract readonly description: string;
  public abstract readonly extendedInfo?: string;
  public readonly aliases: string[] = [];

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
          polymorphic: field.polymorphic,
        })),
        extendedInfo:
          typeof this.extendedInfo === 'string'
            ? resolveExtendedInfo(this.extendedInfo)
            : undefined,
      };
    }

    return this.cachedDefinition as EntityTypeDefinition;
  }

  public validate(payload: Record<string, unknown>, mode: ValidationMode): string[] {
    const schema = mode === 'create' ? this.createSchema : this.updateSchema;
    const result = schema.safeParse(payload);

    const errors: string[] = [];
    if (!result.success) {
      errors.push(...formatZodValidationErrors(result.error));
    }

    errors.push(...this.validatePolymorphicFields(payload));

    return errors;
  }

  protected validatePolymorphicFields(payload: Record<string, unknown>): string[] {
    const errors: string[] = [];

    for (const field of this.fieldDefinitions) {
      if (field.type !== 'polymorphic' || !field.polymorphic) continue;

      const dtoFieldName = field.dtoName ?? field.key;
      const fieldValue = payload[dtoFieldName];

      if (fieldValue === undefined || fieldValue === null) continue;

      const discriminatorValue = payload[field.polymorphic.discriminatorField];
      if (typeof discriminatorValue !== 'string') {
        errors.push(
          `Discriminator field '${field.polymorphic.discriminatorField}' is required and must be a string.`,
        );
        continue;
      }

      const settingsTypeKey = field.polymorphic.mapping[discriminatorValue];
      if (!settingsTypeKey) {
        errors.push(
          `No settings type mapping for ${field.polymorphic.discriminatorField}='${discriminatorValue}'.`,
        );
        continue;
      }

      const settingsTypeDef = resolveType(settingsTypeKey);
      if (!settingsTypeDef || 'entityType' in settingsTypeDef) {
        errors.push(`Settings type '${settingsTypeKey}' not found in type registry.`);
        continue;
      }

      errors.push(
        ...validateSettingsPayload(settingsTypeDef as SettingsTypeDefinition, fieldValue),
      );
    }

    return errors;
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
