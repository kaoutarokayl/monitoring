namespace KtcWeb.Application.DTOs
{
    public class UpdateBusinessRequest
    {
        public string BusinessName { get; set; } = string.Empty;
        public string? DisplayId { get; set; }
        public string? AdditionalInfo { get; set; }
    }
}



