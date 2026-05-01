namespace KtcWeb.Application.DTOs
{
    public class BusinessDetailsDto
    {
        public short BusinessId { get; set; }
        public string BusinessName { get; set; } = string.Empty;
        public string DisplayId { get; set; } = string.Empty;
        public string? AdditionalInfo { get; set; }
    }
}



