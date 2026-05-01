namespace KtcWeb.Application.DTOs
{
    /// <summary>
    /// DTO for cash unit status information
    /// </summary>
    public class CashUnitStatusDto
    {
        public byte CashUnitId { get; set; }
        public string TypeName { get; set; } = string.Empty;
        public string StatusName { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string CurrencyCode { get; set; } = string.Empty;
        public decimal CurrencyValue { get; set; }
        public int UnitCount { get; set; }
        public decimal TotalValue { get; set; }
    }

    /// <summary>
    /// DTO for cash unit summary by component
    /// </summary>
    public class CashUnitSummaryDto
    {
        public short ComponentId { get; set; }
        public string ComponentName { get; set; } = string.Empty;
        public List<CashUnitStatusDto> CashUnits { get; set; } = new();
        public decimal TotalCashValue { get; set; }
    }

    /// <summary>
    /// DTO for physical cassette information
    /// </summary>
    public class PhysicalCassetteDto
    {
        public long CassetteId { get; set; }
        public short ComponentId { get; set; }           
        public string Position { get; set; } = string.Empty;
        public string TypeName { get; set; } = string.Empty;
        public string CurrentStatus { get; set; } = string.Empty;
        public DateTime LastStatusUpdate { get; set; }
        public bool IsReported { get; set; }
        public List<CassetteDenominationCountDto> Denominations { get; set; } = new();
    }

    /// <summary>
    /// DTO for denomination counts in a physical cassette
    /// </summary>
    public class CassetteDenominationCountDto
    {
        public string CurrencyCode { get; set; } = string.Empty;
        public decimal Denomination { get; set; }
        public int Count { get; set; }
        public decimal TotalValue { get; set; }
    }

    /// <summary>
    /// DTO for cassette status summary
    /// </summary>
    public class CassetteSummaryDto
    {
        public short ComponentId { get; set; }
        public string ComponentName { get; set; } = string.Empty;
        public List<PhysicalCassetteDto> Cassettes { get; set; } = new();
        public int TotalCassettes { get; set; }
        public int HealthyCassettes { get; set; }
        public int LowCassettes { get; set; }
        public int EmptyCassettes { get; set; }
    }

    /// <summary>
    /// DTO for ATM cash and cassette overview
    /// </summary>
    public class AtmCashCassetteOverviewDto
    {
        public int ClientId { get; set; }
        public string ClientName { get; set; } = string.Empty;
        public List<CashUnitSummaryDto> CashUnitsByComponent { get; set; } = new();
        public List<CassetteSummaryDto> CassettesByComponent { get; set; } = new();
        public decimal TotalCashValue { get; set; }
        public DateTime LastUpdated { get; set; }
    }

    /// <summary>
    /// DTO for cash flow report
    /// </summary>
    public class CashFlowReportDto
    {
        public int ClientId { get; set; }
        public short ComponentId { get; set; }
        public string ComponentName { get; set; } = string.Empty;
        public string CurrencyCode { get; set; } = string.Empty;
        public decimal CurrentTotal { get; set; }
        public DateTime? LastUpdate { get; set; }
        public List<CashHistoryEntryDto> HistoricalChanges { get; set; } = new();
    }

    /// <summary>
    /// DTO for historical cash changes
    /// </summary>
    public class CashHistoryEntryDto
    {
        public DateTime Timestamp { get; set; }
        public decimal PreviousTotal { get; set; }
        public decimal CurrentTotal { get; set; }
        public decimal Change { get; set; }
        public int PreviousUnitCount { get; set; }
        public int CurrentUnitCount { get; set; }
    }

    /// <summary>
    /// DTO for raw historical cash-unit rows from HistoricalCashUnitStatus_P.
    /// </summary>
    public class CashUnitHistoryRowDto
    {
        public int ClientId { get; set; }
        public short ComponentId { get; set; }
        public string ComponentName { get; set; } = string.Empty;
        public byte CashUnitId { get; set; }
        public string TypeName { get; set; } = string.Empty;
        public string StatusName { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string CurrencyCode { get; set; } = string.Empty;
        public decimal CurrencyValue { get; set; }
        public int UnitCount { get; set; }
        public decimal TotalValue { get; set; }
        public DateTime? AddedTime { get; set; }
    }

    /// <summary>
    /// DTO for cassette status report
    /// </summary>
    public class CassetteStatusReportDto
    {
        public long CassetteId { get; set; }
        public int ClientId { get; set; }
        public short ComponentId { get; set; }
        public string Position { get; set; } = string.Empty;
        public string TypeName { get; set; } = string.Empty;
        public string CurrentStatus { get; set; } = string.Empty;
        public DateTime LastStatusChange { get; set; }
        public decimal TotalCashContent { get; set; }
        public List<DenominationDetailDto> DenominationDetails { get; set; } = new();
    }

    /// <summary>
    /// DTO for denomination details
    /// </summary>
    public class DenominationDetailDto
    {
        public string CurrencyCode { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public int Count { get; set; }
        public decimal Total { get; set; }
    }
}
