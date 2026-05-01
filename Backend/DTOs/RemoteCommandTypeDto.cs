namespace KtcWeb.Application.DTOs
{
    public class RemoteCommandTypeDto
    {
        public byte CommandId { get; set; }
        public string CommandName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
