using KtcWeb.Application.DTOs;
using KtcWeb.Application.Interfaces;
using KtcWeb.Domain.Interfaces;

namespace KtcWeb.Application.Services
{
    public class CashCassetteService : ICashCassetteService
    {
        private readonly ICashCassetteRepository _repository;

        public CashCassetteService(ICashCassetteRepository repository)
        {
            _repository = repository;
        }

        public Task<List<CashUnitStatusDto>> GetCashUnitStatusAsync(int clientId, short? componentId = null)
        {
            return _repository.GetCashUnitStatusAsync(clientId, componentId);
        }

        public Task<List<CashUnitSummaryDto>> GetCashUnitSummaryAsync(int clientId)
        {
            return _repository.GetCashUnitSummaryAsync(clientId);
        }

        // FIX: Added from/to parameters and forwarded them to the repository so date filtering actually works.
        public Task<CashFlowReportDto?> GetCashFlowReportAsync(int clientId, short componentId, DateTime? from = null, DateTime? to = null)
        {
            return _repository.GetCashFlowReportAsync(clientId, componentId, from, to);
        }

        public Task<List<CashUnitHistoryRowDto>> GetCashUnitHistoryAsync(int clientId, short? componentId = null, DateTime? from = null, DateTime? to = null, int? limit = null)
        {
            return _repository.GetCashUnitHistoryAsync(clientId, componentId, from, to, limit);
        }

        public Task<List<PhysicalCassetteDto>> GetPhysicalCassettesAsync(int clientId, short? componentId = null)
        {
            return _repository.GetPhysicalCassettesAsync(clientId, componentId);
        }

        public Task<List<CassetteSummaryDto>> GetCassetteSummaryAsync(int clientId)
        {
            return _repository.GetCassetteSummaryAsync(clientId);
        }

        public Task<CassetteStatusReportDto?> GetCassetteStatusReportAsync(long cassetteId)
        {
            return _repository.GetCassetteStatusReportAsync(cassetteId);
        }

        public Task<List<CassetteStatusReportDto>> GetCassetteStatusReportByClientAsync(int clientId)
        {
            return _repository.GetCassetteStatusReportByClientAsync(clientId);
        }

        public Task<AtmCashCassetteOverviewDto?> GetAtmCashCassetteOverviewAsync(int clientId)
        {
            return _repository.GetAtmCashCassetteOverviewAsync(clientId);
        }

        public Task<List<string>> GetCashUnitStatusesAsync()
        {
            return _repository.GetCashUnitStatusesAsync();
        }

        public Task<List<string>> GetCashUnitTypesAsync()
        {
            return _repository.GetCashUnitTypesAsync();
        }
    }
}