using KtcWeb.Application.DTOs;
using KtcWeb.Application.Interfaces;
using KtcWeb.Domain.Interfaces;

namespace KtcWeb.Application.Services
{
    public class AtmApplicationService : IAtmApplicationService
    {
        private readonly IAtmRepository _atmRepository;
        private readonly IAtmAdminRepository _atmAdminRepository;

        public AtmApplicationService(IAtmRepository atmRepository, IAtmAdminRepository atmAdminRepository)
        {
            _atmRepository = atmRepository;
            _atmAdminRepository = atmAdminRepository;
        }

        public Task<ConnectionTestDto> TestConnectionAsync() => _atmAdminRepository.TestConnectionAsync();

        public Task<List<RegionListDto>> GetAllRegionsAsync() => _atmAdminRepository.GetAllRegionsAsync();
        public Task<RegionDetailsDto?> GetRegionByIdAsync(short id) => _atmAdminRepository.GetRegionByIdAsync(id);
        public Task CreateRegionAsync(CreateRegionRequest req) => _atmAdminRepository.CreateRegionAsync(req);
        public Task<bool> UpdateRegionAsync(short id, UpdateRegionRequest req) => _atmAdminRepository.UpdateRegionAsync(id, req);
        public Task<bool> DeleteRegionAsync(short id) => _atmAdminRepository.DeleteRegionAsync(id);

        public Task<List<BusinessDto>> GetAllBusinessesAsync() => _atmAdminRepository.GetAllBusinessesAsync();
        public Task<BusinessDetailsDto?> GetBusinessByIdAsync(short id) => _atmAdminRepository.GetBusinessByIdAsync(id);
        public Task CreateBusinessAsync(CreateBusinessRequest req) => _atmAdminRepository.CreateBusinessAsync(req);
        public Task<bool> UpdateBusinessAsync(short id, UpdateBusinessRequest req) => _atmAdminRepository.UpdateBusinessAsync(id, req);
        public Task<bool> DeleteBusinessAsync(short id) => _atmAdminRepository.DeleteBusinessAsync(id);

        public Task<List<BranchDto>> GetAllBranchesAsync() => _atmAdminRepository.GetAllBranchesAsync();
        public Task<BranchDto?> GetBranchByIdAsync(short id) => _atmAdminRepository.GetBranchByIdAsync(id);
        public Task CreateBranchAsync(CreateBranchRequest req) => _atmAdminRepository.CreateBranchAsync(req);
        public Task<bool> UpdateBranchAsync(short id, UpdateBranchRequest req) => _atmAdminRepository.UpdateBranchAsync(id, req);
        public Task<bool> DeleteBranchAsync(short id) => _atmAdminRepository.DeleteBranchAsync(id);

        public Task<List<ClientAtmDto>> GetAllClientsAsync() => _atmAdminRepository.GetAllClientsAsync();
        public Task<ClientAtmDto?> GetClientByIdAsync(int id) => _atmAdminRepository.GetClientByIdAsync(id);
        public Task CreateClientAsync(CreateOrUpdateAtmRequest req) => _atmAdminRepository.CreateClientAsync(req);
        public Task<bool> UpdateClientAsync(int id, CreateOrUpdateAtmRequest req) => _atmAdminRepository.UpdateClientAsync(id, req);
        public Task<bool> DeleteClientAsync(int id) => _atmAdminRepository.DeleteClientAsync(id);

        public Task<List<HardwareTypeDto>> GetHardwareTypesAsync() => _atmAdminRepository.GetHardwareTypesAsync();
        public Task<List<HardwareTypeDto>> GetHardwareTypesByBusinessAsync(short businessId) => _atmAdminRepository.GetHardwareTypesByBusinessAsync(businessId);

        public Task<List<AtmComponentStatusDto>> GetAtmStatusAsync(int clientId) => _atmRepository.GetAtmStatusAsync(clientId);
        public Task<List<AppCounterDto>> GetApplicationCountersAsync(int clientId, short componentId) => _atmRepository.GetApplicationCountersAsync(clientId, componentId);
        public Task<List<ReplenishmentDto>> GetReplenishmentsAsync(int clientId, short componentId) => _atmRepository.GetReplenishmentsAsync(clientId, componentId);
        public Task<XfsCountersResponseDto> GetXfsCountersAsync(int clientId, short componentId) => _atmRepository.GetXfsCountersAsync(clientId, componentId);
        public Task<List<AtmActionDto>> GetClientActionsAsync(int clientId, DateTime? from, DateTime? to) => _atmRepository.GetClientActionsAsync(clientId, from, to);

        public Task<List<ElectronicJournalEntryDto>> GetElectronicJournalAsync(int clientId, DateTime from, DateTime to)
        {
            var fromSafe = from == default ? DateTime.UtcNow.AddDays(-30) : from;
            var toSafe = to == default ? DateTime.UtcNow.AddDays(1) : to;
            return _atmRepository.GetElectronicJournalAsync(clientId, fromSafe, toSafe);
        }

        public Task<List<LookupItemDto>> GetTransactionTypeLookupsAsync() => _atmRepository.GetTransactionTypeLookupsAsync();
        public Task<List<LookupItemDto>> GetTransactionReasonLookupsAsync() => _atmRepository.GetTransactionReasonLookupsAsync();
        public Task<List<LookupItemDto>> GetTransactionCompletionLookupsAsync() => _atmRepository.GetTransactionCompletionLookupsAsync();

        public Task<List<TransactionAuditDto>> SearchAtmTransactionsAsync(int clientId, TransactionSearchCriteria criteria)
        {
            criteria.ClientId = clientId;
            return _atmRepository.SearchAtmTransactionsAsync(criteria);
        }

        public Task<List<AtmAssetHistoryDto>> GetAtmAssetHistoryAsync(int clientId) => _atmRepository.GetAtmAssetHistoryAsync(clientId);
        public Task<LastClientContactDto?> GetLastClientContactAsync(int clientId) => _atmRepository.GetLastClientContactAsync(clientId);
        public Task<List<AtmSoftwareInfoDto>> GetAtmSoftwareInfoAsync(int clientId) => _atmRepository.GetAtmSoftwareInfoAsync(clientId);
        public Task<List<AtmCertificateDto>> GetAtmCertificatesAsync(int clientId) => _atmRepository.GetAtmCertificatesAsync(clientId);

        public Task<List<AtmTicketDto>> GetAtmTicketsAsync(int clientId, int days, string statusFilter)
        {
            if (days < 1 || days > 365) days = 14;
            if (!new[] { "All", "Open/Dispatched", "Closed" }.Contains(statusFilter))
            {
                statusFilter = "All";
            }

            return _atmRepository.GetAtmTicketsAsync(clientId, days, statusFilter);
        }

        public Task<TicketDebugDto> GetAtmTicketsDebugAsync(int clientId) => _atmAdminRepository.GetAtmTicketsDebugAsync(clientId);

        public Task<List<VideoJournalEventDto>> SearchVideoJournalAsync(int clientId, DateTime? from, DateTime? to, string? search)
        {
            var fromDate = from ?? DateTime.UtcNow.AddDays(-7);
            var toDate = to ?? DateTime.UtcNow.AddDays(1);
            return _atmRepository.SearchVideoJournalAsync(clientId, fromDate, toDate, search);
        }

        public async Task<MediaStreamDto?> GetVideoJournalMediaAsync(int clientId, long mediaId)
        {
            var media = await _atmRepository.GetVideoJournalMediaAsync(clientId, mediaId);
            if (media == null) return null;

            var (data, fileName) = media.Value;
            return new MediaStreamDto
            {
                Stream = new MemoryStream(data),
                FileName = fileName,
                ContentType = GuessContentType(fileName)
            };
        }

        public Task<AtmAvailabilityReportDto> GetAtmAvailabilityAsync(int clientId, DateTime? from, DateTime? to)
        {
            var fromDate = from ?? DateTime.UtcNow.AddDays(-7);
            var toDate = to ?? DateTime.UtcNow.AddDays(1);
            return _atmRepository.GetAtmAvailabilityAsync(clientId, fromDate, toDate);
        }

        private static string GuessContentType(string fileName)
        {
            var name = (fileName ?? string.Empty).ToLowerInvariant();
            if (name.EndsWith(".mp4")) return "video/mp4";
            if (name.EndsWith(".webm")) return "video/webm";
            if (name.EndsWith(".jpg") || name.EndsWith(".jpeg")) return "image/jpeg";
            if (name.EndsWith(".png")) return "image/png";
            return "application/octet-stream";
        }
    }
}

