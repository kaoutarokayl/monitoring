using KtcWeb.Application.DTOs;

namespace KtcWeb.Application.Interfaces
{
    public interface ICashCassetteService
    {
        // Cash Unit Status methods
        Task<List<CashUnitStatusDto>> GetCashUnitStatusAsync(int clientId, short? componentId = null);
        Task<List<CashUnitSummaryDto>> GetCashUnitSummaryAsync(int clientId);

        // FIX: Added from/to parameters to match ICashCassetteRepository and allow date filtering.
        Task<CashFlowReportDto?> GetCashFlowReportAsync(int clientId, short componentId, DateTime? from = null, DateTime? to = null);
        Task<List<CashUnitHistoryRowDto>> GetCashUnitHistoryAsync(int clientId, short? componentId = null, DateTime? from = null, DateTime? to = null, int? limit = null);

        // Physical Cassette methods
        Task<List<PhysicalCassetteDto>> GetPhysicalCassettesAsync(int clientId, short? componentId = null);
        Task<List<CassetteSummaryDto>> GetCassetteSummaryAsync(int clientId);
        Task<CassetteStatusReportDto?> GetCassetteStatusReportAsync(long cassetteId);
        Task<List<CassetteStatusReportDto>> GetCassetteStatusReportByClientAsync(int clientId);

        // ATM Overview
        Task<AtmCashCassetteOverviewDto?> GetAtmCashCassetteOverviewAsync(int clientId);

        // Lookup methods
        Task<List<string>> GetCashUnitStatusesAsync();
        Task<List<string>> GetCashUnitTypesAsync();
    }
}