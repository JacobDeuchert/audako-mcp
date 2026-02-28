import { EntityType, Signal, SignalType } from 'audako-core';
import type { z } from 'zod';
import { BaseEntityContract } from './base-entity.contract.js';
import type { EntityContractContext, EntityFieldDefinition } from './types.js';
type SignalContractFieldDefinition = EntityFieldDefinition & {
    isEntityField?: boolean;
};
declare const signalCreateSchema: z.AnyZodObject;
declare const signalUpdateSchema: z.ZodEffects<z.AnyZodObject, {
    [x: string]: any;
}, {
    [x: string]: any;
}>;
type SignalCreatePayload = z.infer<typeof signalCreateSchema>;
type SignalUpdatePayload = z.infer<typeof signalUpdateSchema>;
declare class SignalEntityContract extends BaseEntityContract<Signal, SignalCreatePayload, SignalUpdatePayload> {
    readonly key = "Signal";
    readonly aliases: string[];
    readonly entityType = EntityType.Signal;
    readonly description = "Audako signal configuration entity";
    readonly examples: {
        create: {
            name: string;
            type: SignalType;
            address: string;
            minValue: number;
            maxValue: number;
            unit: string;
            decimalPlaces: number;
            dataConnectionId: string;
            recordingInterval: number;
        };
        update: {
            description: string;
            maxValue: number;
            recordingInterval: number;
        };
    };
    protected readonly createSchema: z.AnyZodObject;
    protected readonly updateSchema: z.ZodEffects<z.AnyZodObject, {
        [x: string]: any;
    }, {
        [x: string]: any;
    }>;
    protected readonly fieldDefinitions: SignalContractFieldDefinition[];
    protected readonly appliesTo: Record<string, string[]>;
    protected fromCreatePayload(payload: SignalCreatePayload, context?: EntityContractContext): Signal;
    protected fromUpdatedPayload(existingEntity: Signal, changes: SignalUpdatePayload, context?: EntityContractContext): Signal;
    toPayload(entity: Signal): Record<string, unknown>;
    private toSignalModel;
    private toSignal;
    private createSignalSettings;
    private getDtoFieldName;
    private isApplicableForSignalType;
    private setModelValueIfDefined;
}
export declare const signalEntityContract: SignalEntityContract;
export {};
//# sourceMappingURL=signal.contract.d.ts.map