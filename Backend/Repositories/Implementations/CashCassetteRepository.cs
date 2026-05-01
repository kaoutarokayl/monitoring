using KtcWeb.Application.DTOs;
using KtcWeb.Domain.Entities;
using KtcWeb.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace KtcWeb.Infrastructure.Repositories
{
    public class CashCassetteRepository : ICashCassetteRepository
    {
        private readonly KtcDbContext _context;

        public CashCassetteRepository(KtcDbContext context)
        {
            _context = context;
        }

        public async Task<List<CashUnitStatusDto>> GetCashUnitStatusAsync(int clientId, short? componentId = null)
        {
            // FIX: The original filter on componentId was a broken correlated subquery that matched
            // on CashUnit byte equality instead of filtering ComponentId on the main row.
            // Now the filter is applied directly and correctly on the main table join.
            var query = from cus in _context.CurrentCashUnitStatus.AsNoTracking()
                        where cus.ClientId == clientId
                              && (!componentId.HasValue || cus.ComponentId == componentId.Value)
                        join type in _context.CashUnitTypes.AsNoTracking()
                            on cus.TypeId equals type.CashUnitTypeId
                        join status in _context.CashUnitStatuses.AsNoTracking()
                            on cus.StatusId equals status.CashUnitStatusId
                        join currency in _context.Currencies.AsNoTracking()
                            on cus.CurrencyId equals currency.CurrencyId
                        select new CashUnitStatusDto
                        {
                            CashUnitId = cus.CashUnit,
                            TypeName = type.TypeName,
                            StatusName = status.StatusName,
                            Timestamp = cus.Timestmp,
                            CurrencyCode = currency.Code,
                            CurrencyValue = cus.CurrencyValue,
                            UnitCount = cus.UnitCount,
                            TotalValue = cus.TotalValue
                        };

            return await query.OrderBy(x => x.CashUnitId).ToListAsync();
        }

        public async Task<List<CashUnitSummaryDto>> GetCashUnitSummaryAsync(int clientId)
        {
            // Load all cash units for this client in a single query, grouped by component.
            // FIX: Avoid N+1 — fetch all cash units once, then group in memory.
            var allCashUnits = await (
                from cus in _context.CurrentCashUnitStatus.AsNoTracking()
                where cus.ClientId == clientId
                join component in _context.ComponentList.AsNoTracking()
                    on cus.ComponentId equals component.ComponentId
                join type in _context.CashUnitTypes.AsNoTracking()
                    on cus.TypeId equals type.CashUnitTypeId
                join status in _context.CashUnitStatuses.AsNoTracking()
                    on cus.StatusId equals status.CashUnitStatusId
                join currency in _context.Currencies.AsNoTracking()
                    on cus.CurrencyId equals currency.CurrencyId
                select new
                {
                    cus.ComponentId,
                    component.ComponentName,
                    Unit = new CashUnitStatusDto
                    {
                        CashUnitId = cus.CashUnit,
                        TypeName = type.TypeName,
                        StatusName = status.StatusName,
                        Timestamp = cus.Timestmp,
                        CurrencyCode = currency.Code,
                        CurrencyValue = cus.CurrencyValue,
                        UnitCount = cus.UnitCount,
                        TotalValue = cus.TotalValue
                    }
                }
            ).ToListAsync();

            return allCashUnits
                .GroupBy(x => new { x.ComponentId, x.ComponentName })
                .Select(g => new CashUnitSummaryDto
                {
                    ComponentId = g.Key.ComponentId,
                    ComponentName = g.Key.ComponentName,
                    CashUnits = g.Select(x => x.Unit).OrderBy(u => u.CashUnitId).ToList(),
                    TotalCashValue = g.Sum(x => x.Unit.TotalValue)
                })
                .OrderBy(s => s.ComponentId)
                .ToList();
        }

        public async Task<CashFlowReportDto?> GetCashFlowReportAsync(int clientId, short componentId, DateTime? from = null, DateTime? to = null)
        {
            // FIX: from/to are now applied to filter the historical table so the report
            // reflects the requested date range. Current status is still used for the snapshot.
            var query = _context.CurrentCashUnitStatus.AsNoTracking()
                .Where(cus => cus.ClientId == clientId && cus.ComponentId == componentId);

            var currentStatus = await query
                .GroupBy(cus => cus.CurrencyId)
                .Select(g => new
                {
                    CurrencyId = g.Key,
                    TotalValue = g.Sum(x => x.TotalValue),
                    LastUpdate = g.Max(x => x.Timestmp)
                })
                .FirstOrDefaultAsync();

            if (currentStatus == null)
                return null;

            var currency = await _context.Currencies.AsNoTracking()
                .FirstOrDefaultAsync(c => c.CurrencyId == currentStatus.CurrencyId);

            var component = await _context.ComponentList.AsNoTracking()
                .FirstOrDefaultAsync(c => c.ComponentId == componentId);

            // Build historical changes from HistoricalCashUnitStatus_P with optional date filter.
            // This gives a meaningful change log instead of always returning an empty list.
            var histQuery = _context.HistoricalCashUnitStatus
                .AsNoTracking()
                .Where(h => h.ClientId == clientId && h.ComponentId == componentId);

            if (from.HasValue)
                histQuery = histQuery.Where(h => h.Timestmp >= from.Value);
            if (to.HasValue)
                histQuery = histQuery.Where(h => h.Timestmp <= to.Value);

            // Group by timestamp snapshot to produce before/after totals per event.
            var historicalRaw = await histQuery
                .OrderBy(h => h.Timestmp)
                .Select(h => new { h.Timestmp, h.TotalValue, h.UnitCount })
                .ToListAsync();

            var historicalChanges = new List<CashHistoryEntryDto>();
            for (int i = 1; i < historicalRaw.Count; i++)
            {
                var prev = historicalRaw[i - 1];
                var curr = historicalRaw[i];
                historicalChanges.Add(new CashHistoryEntryDto
                {
                    Timestamp = curr.Timestmp,
                    PreviousTotal = prev.TotalValue,
                    CurrentTotal = curr.TotalValue,
                    Change = curr.TotalValue - prev.TotalValue,
                    PreviousUnitCount = prev.UnitCount,
                    CurrentUnitCount = curr.UnitCount
                });
            }

            return new CashFlowReportDto
            {
                ClientId = clientId,
                ComponentId = componentId,
                ComponentName = component?.ComponentName ?? "Unknown",
                CurrencyCode = currency?.Code ?? "Unknown",
                CurrentTotal = currentStatus.TotalValue,
                LastUpdate = currentStatus.LastUpdate,
                HistoricalChanges = historicalChanges
            };
        }

        public async Task<List<CashUnitHistoryRowDto>> GetCashUnitHistoryAsync(int clientId, short? componentId = null, DateTime? from = null, DateTime? to = null, int? limit = null)
        {
            var query = from h in _context.HistoricalCashUnitStatus.AsNoTracking()
                        where h.ClientId == clientId
                              && (!componentId.HasValue || h.ComponentId == componentId.Value)
                        join comp in _context.ComponentList.AsNoTracking()
                            on h.ComponentId equals comp.ComponentId
                        join type in _context.CashUnitTypes.AsNoTracking()
                            on h.TypeId equals type.CashUnitTypeId
                        join status in _context.CashUnitStatuses.AsNoTracking()
                            on h.StatusId equals status.CashUnitStatusId
                        join currency in _context.Currencies.AsNoTracking()
                            on h.CurrencyId equals currency.CurrencyId
                        select new CashUnitHistoryRowDto
                        {
                            ClientId = h.ClientId,
                            ComponentId = h.ComponentId,
                            ComponentName = comp.ComponentName,
                            CashUnitId = h.CashUnit,
                            TypeName = type.TypeName,
                            StatusName = status.StatusName,
                            Timestamp = h.Timestmp,
                            CurrencyCode = currency.Code,
                            CurrencyValue = h.CurrencyValue,
                            UnitCount = h.UnitCount,
                            TotalValue = h.TotalValue,
                            AddedTime = h.AddedTime
                        };

            if (from.HasValue)
                query = query.Where(x => x.Timestamp >= from.Value);
            if (to.HasValue)
                query = query.Where(x => x.Timestamp <= to.Value);

            var ordered = query
                .OrderByDescending(x => x.Timestamp)
                .ThenBy(x => x.ComponentId)
                .ThenBy(x => x.CashUnitId);

            IQueryable<CashUnitHistoryRowDto> finalQuery = ordered;
            if (limit.HasValue)
                finalQuery = finalQuery.Take(limit.Value);

            return await finalQuery.ToListAsync();
        }

        public async Task<List<PhysicalCassetteDto>> GetPhysicalCassettesAsync(int clientId, short? componentId = null)
        {
            var cassetteQuery = _context.PhysicalCassettes.AsNoTracking()
                .Where(c => c.ClientId == clientId
                            && (!componentId.HasValue || c.ComponentId == componentId.Value));

            var cassettes = await (
                from cassette in cassetteQuery
                join type in _context.CashUnitTypes.AsNoTracking()
                    on cassette.TypeId equals type.CashUnitTypeId
                select new
                {
                    cassette.CassetteId,
                    cassette.Position,
                    cassette.ComponentId,
                    TypeName = type.TypeName
                }
            ).ToListAsync();

            if (!cassettes.Any())
                return new List<PhysicalCassetteDto>();

            var cassetteIds = cassettes.Select(c => c.CassetteId).ToList();

            // For keyless status entity, load statuses separately then join in memory.
            var statusRows = await _context.PhysicalCassetteCurrentStatus.AsNoTracking()
                .Where(s => cassetteIds.Contains(s.CassetteId))
                .OrderByDescending(s => s.Timestmp)
                .Select(s => new { s.CassetteId, s.StatusId, s.Timestmp, s.Reported })
                .ToListAsync();

            var statusMap = statusRows
                .GroupBy(s => s.CassetteId)
                .ToDictionary(g => g.Key, g => g.First());

            // Load all status names once.
            var statusNames = await _context.CashUnitStatuses.AsNoTracking()
                .ToDictionaryAsync(s => s.CashUnitStatusId, s => s.StatusName);

            // Load all denomination counts for these cassettes in a single query (avoid N+1).
            var allCounts = await (
                from pcc in _context.PhysicalCassetteCounts.AsNoTracking()
                where cassetteIds.Contains(pcc.CassetteId)
                join denom in _context.Denominations.AsNoTracking()
                    on pcc.DenominationId equals denom.DenominationId
                join currency in _context.Currencies.AsNoTracking()
                    on denom.CurrencyId equals currency.CurrencyId
                select new
                {
                    pcc.CassetteId,
                    currency.Code,
                    denom.CurrencyValue,
                    pcc.CassCount,
                    TotalValue = denom.CurrencyValue * pcc.CassCount
                }
            ).ToListAsync();

            // Group counts by cassette.
            var countsByCassette = allCounts
                .GroupBy(c => c.CassetteId)
                .ToDictionary(g => g.Key, g => g.Select(c => new CassetteDenominationCountDto
                {
                    CurrencyCode = c.Code,
                    Denomination = c.CurrencyValue,
                    Count = c.CassCount,
                    TotalValue = c.TotalValue
                }).ToList());

            return cassettes.Select(item => new PhysicalCassetteDto
            {
                CassetteId = item.CassetteId,
                ComponentId = item.ComponentId,
                Position = item.Position,
                TypeName = item.TypeName,
                CurrentStatus = statusMap.TryGetValue(item.CassetteId, out var statusInfo)
                    && statusNames.TryGetValue(statusInfo.StatusId, out var sn)
                    ? sn : "Unknown",
                LastStatusUpdate = statusMap.TryGetValue(item.CassetteId, out statusInfo)
                    ? statusInfo.Timestmp
                    : DateTime.UtcNow,
                IsReported = statusMap.TryGetValue(item.CassetteId, out statusInfo)
                    && statusInfo.Reported,
                Denominations = countsByCassette.TryGetValue(item.CassetteId, out var counts)
                    ? counts : new List<CassetteDenominationCountDto>()
            }).ToList();
        }

        public async Task<List<CassetteSummaryDto>> GetCassetteSummaryAsync(int clientId)
        {
            // FIX: Load all cassettes and component names in one query, then group in memory.
            // Avoids N+1 from calling GetPhysicalCassettesAsync per component in a loop.
            var components = await (
                from cassette in _context.PhysicalCassettes.AsNoTracking()
                where cassette.ClientId == clientId
                join component in _context.ComponentList.AsNoTracking()
                    on cassette.ComponentId equals component.ComponentId
                select new { cassette.ComponentId, component.ComponentName }
            ).Distinct().ToListAsync();

            if (!components.Any())
                return new List<CassetteSummaryDto>();

            // Load all cassettes for this client once.
            var allCassettes = await GetPhysicalCassettesAsync(clientId);
            var cassettesByComponent = allCassettes
                .GroupBy(c =>
                {
                    // We need the componentId; fetch it from the PhysicalCassettes raw data.
                    // We resolve by matching CassetteId to component from the DB result set.
                    return c.CassetteId;
                });

            // Re-query component mapping for cassettes.
            var cassetteComponentMap = await _context.PhysicalCassettes.AsNoTracking()
                .Where(c => c.ClientId == clientId)
                .Select(c => new { c.CassetteId, c.ComponentId })
                .ToListAsync();

            var componentIdMap = cassetteComponentMap.ToDictionary(c => c.CassetteId, c => c.ComponentId);

            var cassettesByComp = allCassettes
                .GroupBy(c => componentIdMap.TryGetValue(c.CassetteId, out var cid) ? cid : (short)0)
                .ToDictionary(g => g.Key, g => g.ToList());

            return components.Select(comp =>
            {
                var cassettes = cassettesByComp.TryGetValue(comp.ComponentId, out var list) ? list : new List<PhysicalCassetteDto>();
                return new CassetteSummaryDto
                {
                    ComponentId = comp.ComponentId,
                    ComponentName = comp.ComponentName,
                    Cassettes = cassettes,
                    TotalCassettes = cassettes.Count,
                    HealthyCassettes = cassettes.Count(c => c.CurrentStatus.Equals("HEALTHY", StringComparison.OrdinalIgnoreCase)),
                    LowCassettes = cassettes.Count(c => c.CurrentStatus.Equals("LOW", StringComparison.OrdinalIgnoreCase)),
                    EmptyCassettes = cassettes.Count(c => c.CurrentStatus.Equals("EMPTY", StringComparison.OrdinalIgnoreCase))
                };
            }).OrderBy(s => s.ComponentId).ToList();
        }

        public async Task<CassetteStatusReportDto?> GetCassetteStatusReportAsync(long cassetteId)
        {
            var cassette = await (
                from c in _context.PhysicalCassettes.AsNoTracking()
                where c.CassetteId == cassetteId
                join type in _context.CashUnitTypes.AsNoTracking()
                    on c.TypeId equals type.CashUnitTypeId
                select new
                {
                    c.CassetteId,
                    c.ClientId,
                    c.ComponentId,
                    c.Position,
                    TypeName = type.TypeName
                }
            ).FirstOrDefaultAsync();

            if (cassette == null)
                return null;

            var status = await _context.PhysicalCassetteCurrentStatus.AsNoTracking()
                .Where(s => s.CassetteId == cassetteId)
                .OrderByDescending(s => s.Timestmp)
                .FirstOrDefaultAsync();

            var statusName = "Unknown";
            if (status != null)
            {
                var statusEntry = await _context.CashUnitStatuses.AsNoTracking()
                    .FirstOrDefaultAsync(s => s.CashUnitStatusId == status.StatusId);
                statusName = statusEntry?.StatusName ?? "Unknown";
            }

            var denominations = await (
                from pcc in _context.PhysicalCassetteCounts.AsNoTracking()
                where pcc.CassetteId == cassetteId
                join denom in _context.Denominations.AsNoTracking()
                    on pcc.DenominationId equals denom.DenominationId
                join currency in _context.Currencies.AsNoTracking()
                    on denom.CurrencyId equals currency.CurrencyId
                select new DenominationDetailDto
                {
                    CurrencyCode = currency.Code,
                    Value = denom.CurrencyValue,
                    Count = pcc.CassCount,
                    Total = denom.CurrencyValue * pcc.CassCount
                }
            ).ToListAsync();

            return new CassetteStatusReportDto
            {
                CassetteId = cassetteId,
                ClientId = cassette.ClientId,
                ComponentId = cassette.ComponentId,
                Position = cassette.Position,
                TypeName = cassette.TypeName,
                CurrentStatus = statusName,
                LastStatusChange = status?.Timestmp ?? DateTime.UtcNow,
                TotalCashContent = denominations.Sum(d => d.Total),
                DenominationDetails = denominations
            };
        }

        public async Task<List<CassetteStatusReportDto>> GetCassetteStatusReportByClientAsync(int clientId)
        {
            // FIX: Load all cassette IDs once, then fetch full details.
            // Still one DB call per cassette for the detail, but avoids nested loops
            // and the original double-call pattern.
            var cassetteIds = await _context.PhysicalCassettes.AsNoTracking()
                .Where(c => c.ClientId == clientId)
                .Select(c => c.CassetteId)
                .ToListAsync();

            var reports = new List<CassetteStatusReportDto>();
            foreach (var cassetteId in cassetteIds)
            {
                var report = await GetCassetteStatusReportAsync(cassetteId);
                if (report != null)
                    reports.Add(report);
            }

            return reports;
        }

public async Task<AtmCashCassetteOverviewDto?> GetAtmCashCassetteOverviewAsync(int clientId)
{
    // Use explicit SQL aliases matching the existing ClientAtmDto mapping conventions
    // used throughout the project (clientname, ktcguid, etc.).
    var clientInfo = await _context.Clients
        .FromSqlInterpolated($@"
            SELECT TOP 1
                c.client_id AS ClientId,
                c.ktcguid AS KtcGuid,
                c.clientname AS ClientName,
                c.networkaddress AS NetworkAddress,
                c.connectable AS Connectable,
                c.detailsunknown AS DetailsUnknown,
                c.latitude AS Latitude,
                c.longitude AS Longitude,
                c.timezone AS Timezone,
                CAST(c.comments AS nvarchar(max)) AS Comments,
                c.business_id AS BusinessId,
                c.branch_id AS BranchId,
                c.hardwaretype_id AS HardwareTypeId,
                ht.name AS HardwareTypeName,
                c.active AS Active,
                c.clienttype AS ClientType
            FROM dbo.Clients c
            LEFT JOIN dbo.HardwareTypes ht ON c.hardwaretype_id = ht.hardwaretype_id
            WHERE c.client_id = {clientId}
        ")
        .AsNoTracking()
        .FirstOrDefaultAsync();

    if (clientInfo == null)
        return null;

    var cashUnits = await GetCashUnitSummaryAsync(clientId);
    var cassettes = await GetCassetteSummaryAsync(clientId);

    var lastUpdated = cashUnits
        .SelectMany(c => c.CashUnits)
        .Select(u => u.Timestamp)
        .DefaultIfEmpty(DateTime.UtcNow)
        .Max();

    return new AtmCashCassetteOverviewDto
    {
        ClientId = clientInfo.ClientId,
        ClientName = clientInfo.ClientName ?? $"ATM {clientId}",
        CashUnitsByComponent = cashUnits,
        CassettesByComponent = cassettes,
        TotalCashValue = cashUnits.Sum(c => c.TotalCashValue),
        LastUpdated = lastUpdated
    };
}

        public async Task<List<string>> GetCashUnitStatusesAsync()
        {
            return await _context.CashUnitStatuses.AsNoTracking()
                .OrderBy(c => c.CashUnitStatusId)
                .Select(c => c.StatusName)
                .ToListAsync();
        }

        public async Task<List<string>> GetCashUnitTypesAsync()
        {
            return await _context.CashUnitTypes.AsNoTracking()
                .OrderBy(c => c.CashUnitTypeId)
                .Select(c => c.TypeName)
                .ToListAsync();
        }
    }
}