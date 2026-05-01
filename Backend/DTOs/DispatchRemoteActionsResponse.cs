namespace KtcWeb.Application.DTOs
{
    public class DispatchRemoteActionsResponse
    {
        public int Created { get; set; }
        public List<string> SkippedClientIds { get; set; } = new();
    }
}
