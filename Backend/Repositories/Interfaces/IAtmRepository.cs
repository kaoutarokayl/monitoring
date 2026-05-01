
using System.Collections.Generic;
using System.Threading.Tasks;
using KtcWeb.Application.DTOs;

namespace KtcWeb.Domain.Interfaces
{
    public interface IAtmRepository
    {
        Task<List<AtmComponentStatusDto>> GetAtmStatusAsync(int clientId);
        Task<List<AtmAssetHistoryDto>> GetAtmAssetHistoryAsync(int clientId);
        Task<LastClientContactDto?> GetLastClientContactAsync(int clientId);
        Task<List<AtmSoftwareInfoDto>> GetAtmSoftwareInfoAsync(int clientId);
        Task<List<AtmCertificateDto>> GetAtmCertificatesAsync(int clientId);
        Task<List<AtmTicketDto>> GetAtmTicketsAsync(int clientId, int days, string statusFilter);
        Task<List<AppCounterDto>> GetApplicationCountersAsync(int clientId, short componentId);
        Task<List<ReplenishmentDto>> GetReplenishmentsAsync(int clientId, short componentId);
        Task<XfsCountersResponseDto> GetXfsCountersAsync(int clientId, short componentId);
        Task<List<AtmActionDto>> GetClientActionsAsync(int clientId, DateTime? from, DateTime? to);
        Task<List<ElectronicJournalEntryDto>> GetElectronicJournalAsync(int clientId, DateTime from, DateTime to);
        Task<List<LookupItemDto>> GetTransactionTypeLookupsAsync();
        Task<List<LookupItemDto>> GetTransactionReasonLookupsAsync();
        Task<List<LookupItemDto>> GetTransactionCompletionLookupsAsync();
        Task<List<TransactionAuditDto>> SearchAtmTransactionsAsync(TransactionSearchCriteria criteria);
        Task<List<VideoJournalEventDto>> SearchVideoJournalAsync(int clientId, DateTime from, DateTime to, string? search);
        Task<(byte[] Data, string FileName)?> GetVideoJournalMediaAsync(int clientId, long mediaId);
        Task<AtmAvailabilityReportDto> GetAtmAvailabilityAsync(int clientId, DateTime from, DateTime to);
    }
}


