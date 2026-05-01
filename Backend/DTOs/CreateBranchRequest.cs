namespace KtcWeb.Application.DTOs
{
    public class CreateBranchRequest
    {
        public string BranchName { get; set; } = string.Empty;     // NOT NULL
        public string? DisplayId { get; set; }                     // nullable
        public short BusinessId { get; set; }                      // NOT NULL

        // Niveaux régionaux obligatoires (même si souvent à 0 dans le legacy)
        public short Level1RegionId { get; set; } = 0;
        public short Level2RegionId { get; set; } = 0;
        public short Level3RegionId { get; set; } = 0;
        public short Level4RegionId { get; set; } = 0;
        public short Level5RegionId { get; set; } = 0;

        public string? AdditionalInfo { get; set; }                // XML ou texte libre
    }
}

