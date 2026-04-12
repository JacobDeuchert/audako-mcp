import { DataSource, DataSourceType, EntityType, EntityUtils } from 'audako-core';
import { registerType } from '../../services/type-registry.js';
import { ConfigurationEntityContract, configurationEntityFieldDefinitions, } from '../base-entity.contract.js';
import { registerContract } from '../contract-registry.js';
import { buildZodSchemaFromFieldDefinitions } from '../zod-utils.js';
const dataSourceTypeEnumValues = Object.values(DataSourceType).filter(value => typeof value === 'string');
const dataSourceFieldDefinitions = [
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
const dataSourceCreateSchema = buildZodSchemaFromFieldDefinitions(dataSourceFieldDefinitions, 'create');
const dataSourceUpdateSchema = buildZodSchemaFromFieldDefinitions(dataSourceFieldDefinitions, 'update').refine(value => Object.keys(value).length > 0, {
    message: "At least one field must be provided in 'changes'.",
});
class DataSourceEntityContract extends ConfigurationEntityContract {
    key = 'DataSource';
    aliases = ['dataSource', 'data-source'];
    entityType = EntityType.DataSource;
    description = 'Audako data source configuration entity';
    extendedInfo = 'DataSource/data-source.md';
    createSchema = dataSourceCreateSchema;
    updateSchema = dataSourceUpdateSchema;
    fieldDefinitions = dataSourceFieldDefinitions;
    fromCreatePayload(payload, context) {
        const model = { ...payload };
        this.applyConfigurationEntityContext(model, context);
        return this.toDataSource(model);
    }
    fromUpdatedPayload(existingEntity, changes, context) {
        const model = this.toDataSourceModel(existingEntity);
        Object.assign(model, changes);
        this.applyConfigurationEntityContext(model, context);
        return this.toDataSource(model, existingEntity);
    }
    toPayload(entity) {
        return this.toDataSourceModel(entity);
    }
    toDataSourceModel(dataSource) {
        const model = {};
        this.setBaseEntityModelProperties(model, dataSource);
        for (const field of this.fieldDefinitions) {
            if (!field.entityPath) {
                continue;
            }
            const value = EntityUtils.getPropertyValue(dataSource, field.entityPath, field.isEntityField);
            this.setModelValueIfDefined(model, this.getDtoFieldName(field), value);
        }
        return model;
    }
    toDataSource(model, baseDataSource) {
        const dataSource = baseDataSource ? this.cloneDataSource(baseDataSource) : new DataSource();
        const modelValues = model;
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
    cloneDataSource(dataSource) {
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
//# sourceMappingURL=contract.js.map