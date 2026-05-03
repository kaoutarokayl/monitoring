namespace KtcWeb.Application.DTOs
{
    public class CreateScheduleRequest
    {
        public string ScheduleName { get; set; } = string.Empty;
        public string Frequency { get; set; } = string.Empty;
        public DateTime NextDue { get; set; }
        public int GroupId { get; set; }
        public int CommandId { get; set; }
        public string Comments { get; set; } = string.Empty;
        public int BusinessId { get; set; }
        public bool PerformActionEveryTime { get; set; }
    }
}
