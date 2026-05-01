namespace KtcWeb.Application.DTOs
{
    public class AtmActionsResponseDto
    {
        public List<AtmActionDto> Items { get; set; } = new();
        public List<string> AddedByUsers { get; set; } = new();
    }
}
