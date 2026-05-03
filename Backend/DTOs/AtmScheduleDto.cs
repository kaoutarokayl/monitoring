namespace KtcWeb.Application.DTOs
{
    public class AtmScheduleDto
    {
        public int ScheduleId { get; set; }
        public string ScheduleName { get; set; } = string.Empty;
        public string Frequency { get; set; } = string.Empty;
        public string NextDue { get; set; } = string.Empty;
        public int GroupId { get; set; }
        public string GroupName { get; set; } = string.Empty;
        public int CommandId { get; set; }
        public string CommandName { get; set; } = string.Empty;
        public string Comments { get; set; } = string.Empty;
        public string? LastActioned { get; set; }
        public int BusinessId { get; set; }
        public string BusinessName { get; set; } = string.Empty;
        public bool PerformActionEveryTime { get; set; }
    }
}
