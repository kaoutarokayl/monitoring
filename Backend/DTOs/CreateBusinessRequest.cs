namespace KtcWeb.Application.DTOs
{
    public class CreateBusinessRequest
    {
        public string BusinessName { get; set; } = string.Empty;
        public string? DisplayId { get; set; }
        // dbo.Businesses.additionalinfo est souvent de type XML.
        // On accepte un string JSON/XML/text côté API et on le convertit en XML valide.
        public string? AdditionalInfo { get; set; }
    }
}

