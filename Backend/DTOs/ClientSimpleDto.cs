namespace KtcWeb.Application.DTOs
{
public class ClientSimpleDto
{
    public int ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string NetworkAddress { get; set; } = string.Empty;
    public bool Active { get; set; }
}
}


