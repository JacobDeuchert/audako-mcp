import { EntityType, EntityUtils, Field, Group } from 'audako-core';
import type { z } from 'zod';
import { registerType } from '../../services/type-registry.js';
import {
  ConfigurationEntityContract,
  type ConfigurationEntityModel,
  configurationEntityFieldDefinitions,
} from '../base-entity.contract.js';
import { registerContract } from '../contract-registry.js';
import type { EntityContractContext, EntityFieldDefinition } from '../types.js';
import { buildZodSchemaFromFieldDefinitions } from '../zod-utils.js';

const DEFAULT_GROUP_TYPE = 'Default';

type GroupContractFieldDefinition = EntityFieldDefinition & {
  isEntityField?: boolean;
  additionalFieldKey?: string;
};

const groupFieldDefinitions: GroupContractFieldDefinition[] = [
  ...configurationEntityFieldDefinitions,
  {
    key: 'type',
    dtoName: 'type',
    description:
      'Can be set to Default or DigitalTwin. DigitalTwins are for maintenance objects. Set to default if asked otherwise.',
    type: 'string',
    entityPath: 'Type',
    requiredOnCreate: false,
  },
  {
    key: 'isEntryPoint',
    dtoName: 'isEntryPoint',
    description: 'Whether this group is an entry point',
    type: 'boolean',
    entityPath: 'IsEntryPoint',
    requiredOnCreate: false,
  },
  {
    key: 'icon',
    dtoName: 'icon',
    description: 'Icon key stored in AdditionalFields.Icon',
    type: 'string',
    entityPath: 'AdditionalFields.Icon',
    additionalFieldKey: 'Icon',
    requiredOnCreate: false,
  },
  {
    key: 'position',
    dtoName: 'position',
    description: 'Position value stored in AdditionalFields.Position',
    type: 'string',
    entityPath: 'AdditionalFields.Position',
    additionalFieldKey: 'Position',
    requiredOnCreate: false,
  },
];

const groupCreateSchema = buildZodSchemaFromFieldDefinitions(groupFieldDefinitions, 'create');

const groupUpdateSchema = buildZodSchemaFromFieldDefinitions(
  groupFieldDefinitions,
  'update',
).refine(value => Object.keys(value).length > 0, {
  message: "At least one field must be provided in 'changes'.",
});

type GroupCreatePayload = z.infer<typeof groupCreateSchema>;
type GroupUpdatePayload = z.infer<typeof groupUpdateSchema>;

type GroupModel = ConfigurationEntityModel & Partial<GroupCreatePayload>;

class GroupEntityContract extends ConfigurationEntityContract<
  Group,
  GroupCreatePayload,
  GroupUpdatePayload
> {
  public readonly key = 'Group';
  public readonly aliases = ['group'];
  public readonly entityType = EntityType.Group;
  public readonly description = 'Audako group configuration entity';
  public readonly examples = {
    create: {
      type: DEFAULT_GROUP_TYPE,
      icon: 'mat-alarm',
    },
    update: {
      icon: 'mat-folder',
    },
  };

  public override readonly extendedInfo = undefined;

  protected readonly createSchema = groupCreateSchema;
  protected readonly updateSchema = groupUpdateSchema;
  protected readonly fieldDefinitions: GroupContractFieldDefinition[] = groupFieldDefinitions;

  protected fromCreatePayload(payload: GroupCreatePayload, context?: EntityContractContext): Group {
    const model: GroupModel = { ...payload };

    this.applyConfigurationEntityContext(model, context);

    if (!model.type) {
      model.type = DEFAULT_GROUP_TYPE;
    }

    return this.toGroup(model);
  }

  protected fromUpdatedPayload(
    existingEntity: Group,
    changes: GroupUpdatePayload,
    context?: EntityContractContext,
  ): Group {
    const model = this.toGroupModel(existingEntity);
    Object.assign(model, changes);

    this.applyConfigurationEntityContext(model, context);

    if (!model.type) {
      model.type = DEFAULT_GROUP_TYPE;
    }

    return this.toGroup(model, existingEntity);
  }

  public toPayload(entity: Group): Record<string, unknown> {
    return this.toGroupModel(entity);
  }

  private toGroupModel(group: Group): GroupModel {
    const model: GroupModel = {};

    this.setBaseEntityModelProperties(model, group);

    for (const field of this.fieldDefinitions) {
      const dtoFieldName = this.getDtoFieldName(field);
      const value = this.getGroupFieldValue(group, field);
      this.setModelValueIfDefined(model, dtoFieldName, value);
    }

    return model;
  }

  private toGroup(model: GroupModel, baseGroup?: Group): Group {
    const group = baseGroup ? this.cloneGroup(baseGroup) : new Group();
    const modelValues = model as Record<string, unknown>;

    this.applyBaseEntityProperties(group, model);

    for (const field of this.fieldDefinitions) {
      const dtoFieldName = this.getDtoFieldName(field);
      const value = modelValues[dtoFieldName];
      if (typeof value === 'undefined') {
        continue;
      }

      if (field.additionalFieldKey) {
        this.setAdditionalFieldValue(group, field.additionalFieldKey, value);
        continue;
      }

      if (!field.entityPath) {
        continue;
      }

      EntityUtils.setPropertyValue(group, field.entityPath, value, field.isEntityField);
    }

    return group;
  }

  private getGroupFieldValue(group: Group, field: GroupContractFieldDefinition): unknown {
    if (field.additionalFieldKey) {
      return this.getAdditionalFieldValue(group, field.additionalFieldKey);
    }

    if (!field.entityPath) {
      return undefined;
    }

    return EntityUtils.getPropertyValue<Group, unknown>(
      group,
      field.entityPath,
      field.isEntityField,
    );
  }

  private getAdditionalFieldValue(group: Group, key: string): unknown {
    const value = group.AdditionalFields?.[key]?.Value;
    if (typeof value === 'undefined' || value === null) {
      return undefined;
    }

    return value;
  }

  private setAdditionalFieldValue(group: Group, key: string, value: unknown): void {
    if (typeof value === 'undefined' || value === null) {
      return;
    }

    group.AdditionalFields = group.AdditionalFields ?? {};
    group.AdditionalFields[key] = new Field(String(value));
  }

  private cloneGroup(group: Group): Group {
    const cloned = new Group();
    Object.assign(cloned, group);
    cloned.Path = Array.isArray(group.Path) ? [...group.Path] : [];
    cloned.AdditionalFields = {
      ...(group.AdditionalFields ?? {}),
    };
    return cloned;
  }
}

export const groupEntityContract = new GroupEntityContract();

registerType(groupEntityContract.getDefinition());
registerContract(groupEntityContract);
