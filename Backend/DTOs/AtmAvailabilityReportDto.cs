namespace KtcWeb.Application.DTOs
{
    public class ServiceStateMetricDto
    {
        public string State { get; set; } = string.Empty;
        public int Seconds { get; set; }
        public string Duration { get; set; } = string.Empty;
        public decimal Percent { get; set; }
    }

    public class ErrorCodeMetricDto
    {
        public short ErrorCodeTypeId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public int Seconds { get; set; }
        public string Duration { get; set; } = string.Empty;
        public decimal Percent { get; set; }
    }

    public class UnavailableReasonMetricDto
    {
        public short ReasonId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public int Seconds { get; set; }
        public string Duration { get; set; } = string.Empty;
        public decimal Percent { get; set; }
    }

    public class AtmAvailabilityReportDto
    {
        public DateTime From { get; set; }
        public DateTime To { get; set; }

        public int TotalSeconds { get; set; }
        public string TotalDuration { get; set; } = string.Empty;

        public List<ServiceStateMetricDto> ServiceStates { get; set; } = new();

        public int UptimeSeconds { get; set; }
        public string UptimeDuration { get; set; } = string.Empty;
        public decimal UptimePercent { get; set; }

        public int DowntimeSeconds { get; set; }
        public string DowntimeDuration { get; set; } = string.Empty;
        public decimal DowntimePercent { get; set; }

        public List<UnavailableReasonMetricDto> TopUnavailableReasons { get; set; } = new();
        public List<ErrorCodeMetricDto> TopErrorCodes { get; set; } = new();

        public string CoveringText { get; set; } = string.Empty;
    }
}

