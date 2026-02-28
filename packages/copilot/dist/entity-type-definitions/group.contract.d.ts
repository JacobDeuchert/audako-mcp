import { EntityType, Group } from 'audako-core';
import type { z } from 'zod';
import { BaseEntityContract } from './base-entity.contract.js';
import type { EntityContractContext, EntityFieldDefinition } from './types.js';
type GroupContractFieldDefinition = EntityFieldDefinition & {
    isEntityField?: boolean;
    additionalFieldKey?: string;
};
declare const groupCreateSchema: z.AnyZodObject;
declare const groupUpdateSchema: z.ZodEffects<z.AnyZodObject, {
    [x: string]: any;
}, {
    [x: string]: any;
}>;
type GroupCreatePayload = z.infer<typeof groupCreateSchema>;
type GroupUpdatePayload = z.infer<typeof groupUpdateSchema>;
declare class GroupEntityContract extends BaseEntityContract<Group, GroupCreatePayload, GroupUpdatePayload> {
    readonly key = "Group";
    readonly aliases: string[];
    readonly entityType = EntityType.Group;
    readonly description = "Audako group configuration entity";
    readonly examples: {
        create: {
            name: string;
            groupId: string;
            type: string;
            icon: string;
        };
        update: {
            description: string;
            icon: string;
        };
    };
    protected readonly createSchema: z.AnyZodObject;
    protected readonly updateSchema: z.ZodEffects<z.AnyZodObject, {
        [x: string]: any;
    }, {
        [x: string]: any;
    }>;
    protected readonly fieldDefinitions: GroupContractFieldDefinition[];
    protected fromCreatePayload(payload: GroupCreatePayload, context?: EntityContractContext): Group;
    protected fromUpdatedPayload(existingEntity: Group, changes: GroupUpdatePayload, context?: EntityContractContext): Group;
    toPayload(entity: Group): Record<string, unknown>;
    private toGroupModel;
    private toGroup;
    private getGroupFieldValue;
    private getAdditionalFieldValue;
    private setAdditionalFieldValue;
    private cloneGroup;
    private getDtoFieldName;
    private setModelValueIfDefined;
}
export declare const groupEntityContract: GroupEntityContract;
export {};
//# sourceMappingURL=group.contract.d.ts.map