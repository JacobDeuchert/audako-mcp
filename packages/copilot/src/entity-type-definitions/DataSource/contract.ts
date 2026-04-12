import { DataSource, DataSourceType, EntityType, EntityUtils } from 'audako-core';
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

const dataSourceTypeEnumValues = Object.values(DataSourceType).filter(
  value => typeof value === 'string',
) as string[];

type DataSourceContractFieldDefinition = EntityFieldDefinition & {
  isEntityField?: boolean;
};

const dataSourceFieldDefinitions: DataSourceContractFieldDefinition[] = [
  ...configurationEntityFieldDefinitions,
  {
    key: 'address',
    dtoName: 'address',
    description: 'Address for the data source connection.',
    type: 'string',
    entityPath: 'Address',
    isEntityField: true,
    requiredOnCreate: false,
  },
  {
    key: 'password',
    dtoName: 'password',
    description: 'Password used by the data source connection.',
    type: 'string',
    entityPath: 'Password',
    isEntityField: true,
    requiredOnCreate: false,
  },
  {
    key: 'type',
    dtoName: 'type',
    description: 'Data source type.',
    type: 'enum',
    enumValues: dataSourceTypeEnumValues,
    entityPath: 'Type',
    isEntityField: true,
    requiredOnCreate: true,
  },
];

const dataSourceCreateSchema = buildZodSchemaFromFieldDefinitions(
  dataSourceFieldDefinitions,
  'create',
);

const dataSourceUpdateSchema = buildZodSchemaFromFieldDefinitions(
  dataSourceFieldDefinitions,
  'update',
).refine(value => Object.keys(value).length > 0, {
  message: "At least one field must be provided in 'changes'.",
});

type DataSourceCreatePayload = z.infer<typeof dataSourceCreateSchema>;
type DataSourceUpdatePayload = z.infer<typeof dataSourceUpdateSchema>;

type DataSourceModel = ConfigurationEntityModel & Partial<DataSourceCreatePayload>;

class DataSourceEntityContract extends ConfigurationEntityContract<
  DataSource,
  DataSourceCreatePayload,
  DataSourceUpdatePayload
> {
  public readonly key = 'DataSource';
  public readonly aliases = ['dataSource', 'data-source'];
  public readonly entityType = EntityType.DataSource;
  public readonly description = 'Audako data source configuration entity';
  public override readonly extendedInfo = 'DataSource/data-source.md';

  protected readonly createSchema = dataSourceCreateSchema;
  protected readonly updateSchema = dataSourceUpdateSchema;
  protected readonly fieldDefinitions: DataSourceContractFieldDefinition[] =
    dataSourceFieldDefinitions;

  protected fromCreatePayload(
    payload: DataSourceCreatePayload,
    context?: EntityContractContext,
  ): DataSource {
    const model: DataSourceModel = { ...payload };

    this.applyConfigurationEntityContext(model, context);

    return this.toDataSource(model);
  }

  protected fromUpdatedPayload(
    existingEntity: DataSource,
    changes: DataSourceUpdatePayload,
    context?: EntityContractContext,
  ): DataSource {
    const model = this.toDataSourceModel(existingEntity);
    Object.assign(model, changes);

    this.applyConfigurationEntityContext(model, context);

    return this.toDataSource(model, existingEntity);
  }

  public toPayload(entity: DataSource): Record<string, unknown> {
    return this.toDataSourceModel(entity);
  }

  private toDataSourceModel(dataSource: DataSource): DataSourceModel {
    const model: DataSourceModel = {};

    this.setBaseEntityModelProperties(model, dataSource);

    for (const field of this.fieldDefinitions) {
      if (!field.entityPath) {
        continue;
      }

      const value = EntityUtils.getPropertyValue<DataSource, unknown>(
        dataSource,
        field.entityPath,
        field.isEntityField,
      );
      this.setModelValueIfDefined(model, this.getDtoFieldName(field), value);
    }

    return model;
  }

  private toDataSource(model: DataSourceModel, baseDataSource?: DataSource): DataSource {
    const dataSource = baseDataSource ? this.cloneDataSource(baseDataSource) : new DataSource();
    const modelValues = model as Record<string, unknown>;

    this.applyBaseEntityProperties(dataSource, model);

    for (const field of this.fieldDefinitions) {
      if (!field.entityPath) {
        continue;
      }

      const dtoFieldName = this.getDtoFieldName(field);
      const value = modelValues[dtoFieldName];
      if (typeof value === 'undefined') {
        continue;
      }

      EntityUtils.setPropertyValue(dataSource, field.entityPath, value, field.isEntityField);
    }

    return dataSource;
  }

  private cloneDataSource(dataSource: DataSource): DataSource {
    const cloned = new DataSource();
    Object.assign(cloned, dataSource);
    cloned.Path = Array.isArray(dataSource.Path) ? [...dataSource.Path] : [];
    cloned.AdditionalFields = {
      ...(dataSource.AdditionalFields ?? {}),
    };
    return cloned;
  }
}

export const dataSourceEntityContract = new DataSourceEntityContract();

registerType(dataSourceEntityContract.getDefinition());
registerContract(dataSourceEntityContract);
