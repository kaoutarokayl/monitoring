namespace KtcWeb.Application.DTOs
{
    public class XfsCounterDto
    {
        public string ViewType { get; set; } = string.Empty;
        public short ComponentId { get; set; }
        public string Number { get; set; } = string.Empty;
        public byte TypeId { get; set; }
        public string CurrencyCode { get; set; } = string.Empty;
        public short? DenominationId { get; set; }
        public decimal? DenominationValue { get; set; }
        public decimal? CurrencyValue { get; set; }
        public int? UnitCount { get; set; }
        public decimal? TotalValue { get; set; }
        public int? Count { get; set; }
        public byte StatusId { get; set; }
        public DateTime Timestmp { get; set; }
    }

    public class XfsCountersResponseDto
    {
        public List<XfsCounterDto> LogicalView { get; set; } = [];
        public List<XfsCounterDto> PhysicalView { get; set; } = [];
    }
}
