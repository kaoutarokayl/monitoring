namespace KtcWeb.Application.DTOs
{
    public class BusinessDto
    {
        public short BusinessId { get; set; }         // changé en short
        public string BusinessName { get; set; } = string.Empty;
        public string DisplayId { get; set; } = string.Empty;
    }
}

