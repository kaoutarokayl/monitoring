namespace KtcWeb.Application.DTOs
{
    public class DispatchRemoteActionsRequest
    {
        public byte CommandId { get; set; }
        public List<int> ClientIds { get; set; } = new();
        /// <summary>Affiché dans Actions.comments (attribut User du dernier Comment).</summary>
        public string? InitiatedBy { get; set; }
    }
}
