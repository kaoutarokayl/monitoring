using KtcWeb.Application.DTOs;

namespace KtcWeb.Application.Interfaces
{
    public interface IAtmApplicationService
    {
        Task<ConnectionTestDto> TestConnectionAsync();

        Task<List<RegionListDto>> GetAllRegionsAsync();
        Task<RegionDetailsDto?> GetRegionByIdAsync(short id);
        Task CreateRegionAsync(CreateRegionRequest req);
        Task<bool> UpdateRegionAsync(short id, UpdateRegionRequest req);
        Task<bool> DeleteRegionAsync(short id);

        Task<List<BusinessDto>> GetAllBusinessesAsync();
        Task<BusinessDetailsDto?> GetBusinessByIdAsync(short id);
        Task CreateBusinessAsync(CreateBusinessRequest req);
        Task<bool> UpdateBusinessAsync(short id, UpdateBusinessRequest req);
        Task<bool> DeleteBusinessAsync(short id);

        Task<List<BranchDto>> GetAllBranchesAsync();
        Task<BranchDto?> GetBranchByIdAsync(short id);
        Task CreateBranchAsync(CreateBranchRequest req);
        Task<bool> UpdateBranchAsync(short id, UpdateBranchRequest req);
        Task<bool> DeleteBranchAsync(short id);

        Task<List<ClientAtmDto>> GetAllClientsAsync();
        Task<ClientAtmDto?> GetClientByIdAsync(int id);
        Task CreateClientAsync(CreateOrUpdateAtmRequest req);
        Task<bool> UpdateClientAsync(int id, CreateOrUpdateAtmRequest req);
        Task<bool> DeleteClientAsync(int id);

        Task<List<HardwareTypeDto>> GetHardwareTypesAsync();
        Task<List<HardwareTypeDto>> GetHardwareTypesByBusinessAsync(short businessId);

        Task<List<AtmComponentStatusDto>> GetAtmStatusAsync(int clientId);
        Task<List<AppCounterDto>> GetApplicationCountersAsync(int clientId, short componentId);
        Task<List<ReplenishmentDto>> GetReplenishmentsAsync(int clientId, short componentId);
        Task<XfsCountersResponseDto> GetXfsCountersAsync(int clientId, short componentId);
        Task<List<AtmActionDto>> GetClientActionsAsync(int clientId, DateTime? from, DateTime? to);
        Task<List<ElectronicJournalEntryDto>> GetElectronicJournalAsync(int clientId, DateTime from, DateTime to);
        Task<List<LookupItemDto>> GetTransactionTypeLookupsAsync();
        Task<List<LookupItemDto>> GetTransactionReasonLookupsAsync();
        Task<List<LookupItemDto>> GetTransactionCompletionLookupsAsync();
        Task<List<TransactionAuditDto>> SearchAtmTransactionsAsync(int clientId, TransactionSearchCriteria criteria);
        Task<List<AtmAssetHistoryDto>> GetAtmAssetHistoryAsync(int clientId);
        Task<LastClientContactDto?> GetLastClientContactAsync(int clientId);
        Task<List<AtmSoftwareInfoDto>> GetAtmSoftwareInfoAsync(int clientId);
        Task<List<AtmCertificateDto>> GetAtmCertificatesAsync(int clientId);
        Task<List<AtmTicketDto>> GetAtmTicketsAsync(int clientId, int days, string statusFilter);
        Task<TicketDebugDto> GetAtmTicketsDebugAsync(int clientId);

        Task<List<VideoJournalEventDto>> SearchVideoJournalAsync(int clientId, DateTime? from, DateTime? to, string? search);
        Task<MediaStreamDto?> GetVideoJournalMediaAsync(int clientId, long mediaId);
        Task<AtmAvailabilityReportDto> GetAtmAvailabilityAsync(int clientId, DateTime? from, DateTime? to);
    }
}

