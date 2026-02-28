import { BaseHttpService, DataSourceHttpService, EntityHttpService, TenantHttpService, } from 'audako-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAudakoServices } from '../audako-services.js';
// Mock audako-core
vi.mock('audako-core', () => ({
    BaseHttpService: {
        requestHttpConfig: vi.fn(),
    },
    TenantHttpService: vi.fn(),
    EntityHttpService: vi.fn(),
    DataSourceHttpService: vi.fn(),
}));
describe('createAudakoServices', () => {
    const mockSystemUrl = 'https://audako-test.example.com';
    const mockAccessToken = 'test-token-123';
    const mockHttpConfig = {
        Services: {
            BaseUri: 'https://audako-test.example.com/api',
            Calendar: '',
            Camera: '',
            Driver: '',
            Event: '',
            Historian: '',
            Live: '',
            Maintenance: '',
            Messenger: '',
            Reporting: '',
            Structure: '',
        },
        Authentication: {
            BaseUri: 'https://audako-test.example.com/auth',
            ClientId: 'test-client',
        },
    };
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(BaseHttpService.requestHttpConfig).mockResolvedValue(mockHttpConfig);
    });
    it('should throw error if systemUrl is missing', async () => {
        await expect(createAudakoServices('', mockAccessToken)).rejects.toThrow('systemUrl parameter is required');
    });
    it('should throw error if accessToken is missing', async () => {
        await expect(createAudakoServices(mockSystemUrl, '')).rejects.toThrow('accessToken parameter is required');
    });
    it('should return object with all service instances', async () => {
        const services = await createAudakoServices(mockSystemUrl, mockAccessToken);
        expect(services).toBeDefined();
        expect(services.httpConfig).toEqual(mockHttpConfig);
        expect(services.accessToken).toBe(mockAccessToken);
        expect(services.tenantService).toBeInstanceOf(TenantHttpService);
        expect(services.entityService).toBeInstanceOf(EntityHttpService);
        expect(services.dataSourceService).toBeInstanceOf(DataSourceHttpService);
    });
    it('should create services with correct httpConfig and accessToken', async () => {
        await createAudakoServices(mockSystemUrl, mockAccessToken);
        expect(TenantHttpService).toHaveBeenCalledWith(mockHttpConfig, mockAccessToken);
        expect(EntityHttpService).toHaveBeenCalledWith(mockHttpConfig, mockAccessToken);
        expect(DataSourceHttpService).toHaveBeenCalledWith(mockHttpConfig, mockAccessToken);
    });
    it('should create fresh instances on each call', async () => {
        const services1 = await createAudakoServices(mockSystemUrl, mockAccessToken);
        const services2 = await createAudakoServices(mockSystemUrl, 'different-token');
        // Different calls should produce different service instances
        expect(services1.tenantService).not.toBe(services2.tenantService);
        expect(services1.entityService).not.toBe(services2.entityService);
        expect(services1.dataSourceService).not.toBe(services2.dataSourceService);
        // Second call should have different token
        expect(services2.accessToken).toBe('different-token');
    });
});
//# sourceMappingURL=audako-services.test.js.map