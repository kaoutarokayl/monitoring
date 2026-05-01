namespace KtcWeb.Application.DTOs
{
    public class TicketDebugDto
    {
        public int TablesFound { get; set; }
        public List<string> Tables { get; set; } = new();
        public int ColumnCount { get; set; }
        public List<string> SampleColumns { get; set; } = new();
        public string FirstTicketForClient { get; set; } = "Aucun ticket trouvé";
    }
}

