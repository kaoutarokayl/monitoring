using KtcWeb.Application.DTOs;

namespace KtcWeb.Domain.Interfaces
{
    public interface IAtmAdminRepository
    {
        Task<ConnectionTestDto> TestConnectionAsync();

        Task<List<RegionListDto>> GetAllRegionsAsync();
        Task<RegionDetailsDto?> GetRegionByIdAsync(short id);
        Task CreateRegionAsync(CreateRegionRequest req);
        Task<bool> UpdateRegionAsync(short id, UpdateRegionRequest req);
        Task<bool> DeleteRegionAsync(short id);

        Task<List<BusinessDto>> GetAllBusinessesAsync();
        Task<BusinessDetailsDto?> GetBusinessByIdAsync(short id);
        Task CreateBusinessAsync(CreateBusinessRequest req);
        Task<bool> UpdateBusinessAsync(short id, UpdateBusinessRequest req);
        Task<bool> DeleteBusinessAsync(short id);

        Task<List<BranchDto>> GetAllBranchesAsync();
        Task<BranchDto?> GetBranchByIdAsync(short id);
        Task CreateBranchAsync(CreateBranchRequest req);
        Task<bool> UpdateBranchAsync(short id, UpdateBranchRequest req);
        Task<bool> DeleteBranchAsync(short id);

        Task<List<ClientAtmDto>> GetAllClientsAsync();
        Task<ClientAtmDto?> GetClientByIdAsync(int id);
        Task CreateClientAsync(CreateOrUpdateAtmRequest req);
        Task<bool> UpdateClientAsync(int id, CreateOrUpdateAtmRequest req);
        Task<bool> DeleteClientAsync(int id);

        Task<List<HardwareTypeDto>> GetHardwareTypesAsync();
        Task<List<HardwareTypeDto>> GetHardwareTypesByBusinessAsync(short businessId);

        Task<TicketDebugDto> GetAtmTicketsDebugAsync(int clientId);
    }
}

