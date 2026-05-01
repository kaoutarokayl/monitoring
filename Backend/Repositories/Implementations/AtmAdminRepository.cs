using KtcWeb.Application.DTOs;
using KtcWeb.Domain.Interfaces;
using KtcWeb.Infrastructure.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Xml.Linq;

namespace KtcWeb.Infrastructure.Repositories
{
    public class AtmAdminRepository : IAtmAdminRepository
    {
        private readonly KtcDbContext _context;

        public AtmAdminRepository(KtcDbContext context)
        {
            _context = context;
        }

        public async Task<ConnectionTestDto> TestConnectionAsync()
        {
            var canConnect = await _context.Database.CanConnectAsync();
            var count = await _context.Clients.CountAsync();

            if (canConnect)
            {
                return new ConnectionTestDto
                {
                    Status = "✅ Connexion réussie à KALKTCDB",
                    Message = "La base est bien liée",
                    NombreDAtm = count,
                    Database = "KALKTCDB"
                };
            }

            return new ConnectionTestDto
            {
                Status = "❌ Erreur de connexion",
                Message = "Connexion à la base impossible",
                NombreDAtm = 0,
                Database = "KALKTCDB"
            };
        }

        public Task<List<RegionListDto>> GetAllRegionsAsync()
            => _context.Database.SqlQueryRaw<RegionListDto>(@"
                SELECT
                    r.region_id              AS RegionId,
                    r.regionname             AS RegionName,
                    ISNULL(r.displayID,'')   AS DisplayId,
                    r.region_level           AS RegionLevel,
                    r.parent_region_id       AS ParentRegionId,
                    ISNULL(b.businessname,'—') AS BusinessName
                FROM dbo.Regions r
                LEFT JOIN dbo.Businesses b ON b.business_id = r.business_id
                ORDER BY r.regionname").ToListAsync();

        public async Task<RegionDetailsDto?> GetRegionByIdAsync(short id)
        {
            var rows = await _context.Database.SqlQueryRaw<RegionDetailsDto>(@"
                SELECT
                    region_id AS RegionId,
                    regionname AS RegionName,
                    ISNULL(displayID, '') AS DisplayId,
                    business_id AS BusinessId,
                    region_level AS RegionLevel,
                    parent_region_id AS ParentRegionId,
                    CAST(additionalinfo AS nvarchar(max)) AS AdditionalInfo
                FROM dbo.Regions
                WHERE region_id = {0}", id).ToListAsync();

            return rows.FirstOrDefault();
        }

        public Task CreateRegionAsync(CreateRegionRequest req)
        {
            var additionalInfoXml = BuildSimpleXml("PreConfigInfo", req.AdditionalInfo);
            return _context.Database.ExecuteSqlRawAsync(@"
                INSERT INTO dbo.Regions (displayID, regionname, business_id, region_level, parent_region_id, additionalinfo)
                VALUES (@displayId, @regionName, @businessId, @regionLevel, @parentRegionId, CONVERT(xml, @additionalInfoXml))",
                new[]
                {
                    new SqlParameter("@displayId", (object?)req.DisplayId ?? DBNull.Value),
                    new SqlParameter("@regionName", req.RegionName),
                    new SqlParameter("@businessId", req.BusinessId),
                    new SqlParameter("@regionLevel", req.RegionLevel),
                    new SqlParameter("@parentRegionId", req.ParentRegionId),
                    new SqlParameter("@additionalInfoXml", additionalInfoXml),
                });
        }

        public async Task<bool> UpdateRegionAsync(short id, UpdateRegionRequest req)
        {
            var additionalInfoXml = BuildSimpleXml("PreConfigInfo", req.AdditionalInfo);
            var rows = await _context.Database.ExecuteSqlRawAsync(@"
                UPDATE dbo.Regions
                SET displayID = @displayId,
                    regionname = @regionName,
                    business_id = @businessId,
                    region_level = @regionLevel,
                    parent_region_id = @parentRegionId,
                    additionalinfo = CONVERT(xml, @additionalInfoXml)
                WHERE region_id = @id",
                new[]
                {
                    new SqlParameter("@displayId", (object?)req.DisplayId ?? DBNull.Value),
                    new SqlParameter("@regionName", req.RegionName),
                    new SqlParameter("@businessId", req.BusinessId),
                    new SqlParameter("@regionLevel", req.RegionLevel),
                    new SqlParameter("@parentRegionId", req.ParentRegionId),
                    new SqlParameter("@additionalInfoXml", additionalInfoXml),
                    new SqlParameter("@id", id),
                });

            return rows > 0;
        }

        public async Task<bool> DeleteRegionAsync(short id)
            => await _context.Database.ExecuteSqlRawAsync("DELETE FROM dbo.Regions WHERE region_id = {0}", id) > 0;

        public Task<List<BusinessDto>> GetAllBusinessesAsync()
            => _context.Database.SqlQueryRaw<BusinessDto>(@"
                SELECT business_id AS BusinessId, businessname AS BusinessName, displayID AS DisplayId 
                FROM dbo.Businesses ORDER BY businessname").ToListAsync();

        public async Task<BusinessDetailsDto?> GetBusinessByIdAsync(short id)
        {
            var rows = await _context.Database.SqlQueryRaw<BusinessDetailsDto>(@"
                SELECT 
                    business_id AS BusinessId,
                    businessname AS BusinessName,
                    ISNULL(displayID, '') AS DisplayId,
                    CAST(additionalinfo AS nvarchar(max)) AS AdditionalInfo
                FROM dbo.Businesses
                WHERE business_id = {0}", id).ToListAsync();

            return rows.FirstOrDefault();
        }

        public Task CreateBusinessAsync(CreateBusinessRequest req)
        {
            var additionalInfoXml = BuildSimpleXml("PreConfigInfo", req.AdditionalInfo);
            return _context.Database.ExecuteSqlRawAsync(@"
                INSERT INTO dbo.Businesses (businessname, displayID, additionalinfo) 
                VALUES (@businessName, @displayId, CONVERT(xml, @additionalInfoXml))",
                new[]
                {
                    new SqlParameter("@businessName", req.BusinessName),
                    new SqlParameter("@displayId", (object?)req.DisplayId ?? DBNull.Value),
                    new SqlParameter("@additionalInfoXml", additionalInfoXml)
                });
        }

        public async Task<bool> UpdateBusinessAsync(short id, UpdateBusinessRequest req)
        {
            var additionalInfoXml = BuildSimpleXml("PreConfigInfo", req.AdditionalInfo);
            var rows = await _context.Database.ExecuteSqlRawAsync(@"
                UPDATE dbo.Businesses
                SET businessname = @businessName,
                    displayID = @displayId,
                    additionalinfo = CONVERT(xml, @additionalInfoXml)
                WHERE business_id = @id",
                new[]
                {
                    new SqlParameter("@businessName", req.BusinessName),
                    new SqlParameter("@displayId", (object?)req.DisplayId ?? DBNull.Value),
                    new SqlParameter("@additionalInfoXml", additionalInfoXml),
                    new SqlParameter("@id", id)
                });

            return rows > 0;
        }

        public async Task<bool> DeleteBusinessAsync(short id)
            => await _context.Database.ExecuteSqlRawAsync("DELETE FROM dbo.Businesses WHERE business_id = {0}", id) > 0;

        public Task<List<BranchDto>> GetAllBranchesAsync()
            => _context.Database.SqlQueryRaw<BranchDto>(@"
                SELECT 
                    b.branch_id AS BranchId, 
                    b.branchname AS BranchName, 
                    ISNULL(b.displayID, '') AS DisplayId,
                    CAST(b.additionalinfo AS nvarchar(max)) AS AdditionalInfo,
                    b.business_id AS BusinessId,
                    b.level1_region_id AS Level1RegionId,
                    b.level2_region_id AS Level2RegionId,
                    b.level3_region_id AS Level3RegionId,
                    b.level4_region_id AS Level4RegionId,
                    b.level5_region_id AS Level5RegionId
                FROM dbo.Branches b
                ORDER BY b.branchname").ToListAsync();

        public async Task<BranchDto?> GetBranchByIdAsync(short id)
        {
            var rows = await _context.Database.SqlQueryRaw<BranchDto>(@"
                SELECT 
                    b.branch_id AS BranchId, 
                    b.branchname AS BranchName, 
                    ISNULL(b.displayID, '') AS DisplayId,
                    CAST(b.additionalinfo AS nvarchar(max)) AS AdditionalInfo,
                    b.business_id AS BusinessId,
                    b.level1_region_id AS Level1RegionId,
                    b.level2_region_id AS Level2RegionId,
                    b.level3_region_id AS Level3RegionId,
                    b.level4_region_id AS Level4RegionId,
                    b.level5_region_id AS Level5RegionId
                FROM dbo.Branches b
                WHERE b.branch_id = {0}", id).ToListAsync();

            return rows.FirstOrDefault();
        }

        public Task CreateBranchAsync(CreateBranchRequest req)
        {
            var additionalInfoXml = BuildSimpleXml("PreConfigInfo", req.AdditionalInfo);
            return _context.Database.ExecuteSqlRawAsync(@"
                INSERT INTO dbo.Branches 
                    (branchname, displayID, additionalinfo, business_id, 
                     level1_region_id, level2_region_id, level3_region_id, 
                     level4_region_id, level5_region_id)
                VALUES 
                    (@branchName, @displayId, CONVERT(xml, @additionalInfoXml), @businessId,
                     @level1, @level2, @level3, @level4, @level5)",
                new[]
                {
                    new SqlParameter("@branchName", req.BranchName),
                    new SqlParameter("@displayId", (object?)req.DisplayId ?? DBNull.Value),
                    new SqlParameter("@additionalInfoXml", additionalInfoXml),
                    new SqlParameter("@businessId", req.BusinessId),
                    new SqlParameter("@level1", req.Level1RegionId),
                    new SqlParameter("@level2", req.Level2RegionId),
                    new SqlParameter("@level3", req.Level3RegionId),
                    new SqlParameter("@level4", req.Level4RegionId),
                    new SqlParameter("@level5", req.Level5RegionId)
                });
        }

        public async Task<bool> UpdateBranchAsync(short id, UpdateBranchRequest req)
        {
            var additionalInfoXml = BuildSimpleXml("PreConfigInfo", req.AdditionalInfo);
            var rows = await _context.Database.ExecuteSqlRawAsync(@"
                UPDATE dbo.Branches
                SET branchname          = @branchName,
                    displayID           = @displayId,
                    additionalinfo      = CONVERT(xml, @additionalInfoXml),
                    business_id         = @businessId,
                    level1_region_id    = @level1,
                    level2_region_id    = @level2,
                    level3_region_id    = @level3,
                    level4_region_id    = @level4,
                    level5_region_id    = @level5
                WHERE branch_id = @id",
                new[]
                {
                    new SqlParameter("@branchName", req.BranchName),
                    new SqlParameter("@displayId", (object?)req.DisplayId ?? DBNull.Value),
                    new SqlParameter("@additionalInfoXml", additionalInfoXml),
                    new SqlParameter("@businessId", req.BusinessId),
                    new SqlParameter("@level1", req.Level1RegionId),
                    new SqlParameter("@level2", req.Level2RegionId),
                    new SqlParameter("@level3", req.Level3RegionId),
                    new SqlParameter("@level4", req.Level4RegionId),
                    new SqlParameter("@level5", req.Level5RegionId),
                    new SqlParameter("@id", id)
                });

            return rows > 0;
        }

        public async Task<bool> DeleteBranchAsync(short id)
            => await _context.Database.ExecuteSqlRawAsync("DELETE FROM dbo.Branches WHERE branch_id = {0}", id) > 0;

        public Task<List<ClientAtmDto>> GetAllClientsAsync()
            => _context.Clients
                .FromSqlRaw(@"
                    SELECT 
                        c.client_id AS ClientId,
                        c.ktcguid AS KtcGuid,
                        c.clientname AS ClientName,
                        c.networkaddress AS NetworkAddress,
                        c.connectable AS Connectable,
                        c.detailsunknown AS DetailsUnknown,
                        c.latitude AS Latitude,
                        c.longitude AS Longitude,
                        c.timezone AS Timezone,
                        CAST(c.comments AS nvarchar(max)) AS Comments,
                        c.business_id AS BusinessId,
                        c.branch_id AS BranchId,
                        c.hardwaretype_id AS HardwareTypeId,
                        ht.name AS HardwareTypeName,
                        c.active AS Active,
                        c.clienttype AS ClientType
                    FROM dbo.Clients c
                    LEFT JOIN dbo.HardwareTypes ht ON c.hardwaretype_id = ht.hardwaretype_id
                    ORDER BY c.clientname")
                .AsNoTracking()
                .ToListAsync();

        public async Task<ClientAtmDto?> GetClientByIdAsync(int id)
        {
            var rows = await _context.Database.SqlQueryRaw<ClientAtmDto>(@"
                SELECT 
                    c.client_id AS ClientId,
                    c.ktcguid AS KtcGuid,
                    c.clientname AS ClientName,
                    c.networkaddress AS NetworkAddress,
                    c.connectable AS Connectable,
                    c.detailsunknown AS DetailsUnknown,
                    c.latitude AS Latitude,
                    c.longitude AS Longitude,
                    c.timezone AS Timezone,
                    CAST(c.comments AS nvarchar(max)) AS Comments,
                    c.business_id AS BusinessId,
                    c.branch_id AS BranchId,
                    c.hardwaretype_id AS HardwareTypeId,
                    ht.name AS HardwareTypeName,
                    c.active AS Active,
                    c.clienttype AS ClientType
                FROM dbo.Clients c
                LEFT JOIN dbo.HardwareTypes ht ON c.hardwaretype_id = ht.hardwaretype_id
                WHERE c.client_id = {0}", id).ToListAsync();

            return rows.FirstOrDefault();
        }

        public Task CreateClientAsync(CreateOrUpdateAtmRequest req)
        {
            var commentsXml = BuildSimpleXml("comments", req.Comments);
            return _context.Database.ExecuteSqlRawAsync(@"
                INSERT INTO dbo.Clients 
                    (ktcguid, connectable, networkaddress, clientname, detailsunknown,
                     latitude, longitude, timezone, comments, clienttype, gridposition,
                     business_id, branch_id, hardwaretype_id, owner_id, deletelater, active,
                     subnet, level1_region_id, level2_region_id, level3_region_id, level4_region_id, level5_region_id,
                     salt, authhash, hypervisor_active, mergeto_client_id, feature_flags)
                VALUES 
                    (CONVERT(nvarchar(36), NEWID()), @connectable, @networkAddress, @clientName, @detailsUnknown,
                     @latitude, @longitude, @timezone, CONVERT(xml, @commentsXml), @clientType, @gridPosition,
                     @businessId, @branchId, @hardwareTypeId, @ownerId, @deleteLater, @active,
                     @subnet, @level1RegionId, @level2RegionId, @level3RegionId, @level4RegionId, @level5RegionId,
                     @salt, @authHash, @hypervisorActive, @mergeToClientId, @featureFlags)",
                new[]
                {
                    new SqlParameter("@connectable", req.Connectable),
                    new SqlParameter("@networkAddress", req.NetworkAddress),
                    new SqlParameter("@clientName", req.ClientName),
                    new SqlParameter("@detailsUnknown", req.DetailsUnknown),
                    new SqlParameter("@latitude", req.Latitude),
                    new SqlParameter("@longitude", req.Longitude),
                    new SqlParameter("@timezone", req.Timezone),
                    new SqlParameter("@commentsXml", commentsXml),
                    new SqlParameter("@clientType", req.ClientType),
                    new SqlParameter("@gridPosition", req.GridPosition),
                    new SqlParameter("@businessId", req.BusinessId),
                    new SqlParameter("@branchId", req.BranchId),
                    new SqlParameter("@hardwareTypeId", req.HardwareTypeId),
                    new SqlParameter("@ownerId", req.OwnerId),
                    new SqlParameter("@deleteLater", req.DeleteLater),
                    new SqlParameter("@active", req.Active),
                    new SqlParameter("@subnet", req.Subnet),
                    new SqlParameter("@level1RegionId", req.Level1RegionId),
                    new SqlParameter("@level2RegionId", req.Level2RegionId),
                    new SqlParameter("@level3RegionId", req.Level3RegionId),
                    new SqlParameter("@level4RegionId", req.Level4RegionId),
                    new SqlParameter("@level5RegionId", req.Level5RegionId),
                    new SqlParameter("@salt", req.Salt),
                    new SqlParameter("@authHash", req.AuthHash),
                    new SqlParameter("@hypervisorActive", req.HypervisorActive),
                    new SqlParameter("@mergeToClientId", req.MergeToClientId),
                    new SqlParameter("@featureFlags", req.FeatureFlags)
                });
        }

        public async Task<bool> UpdateClientAsync(int id, CreateOrUpdateAtmRequest req)
        {
            var commentsXml = BuildSimpleXml("comments", req.Comments);
            var rows = await _context.Database.ExecuteSqlRawAsync(@"
                UPDATE dbo.Clients
                SET connectable = @connectable,
                    networkaddress = @networkAddress,
                    clientname = @clientName,
                    detailsunknown = @detailsUnknown,
                    latitude = @latitude,
                    longitude = @longitude,
                    timezone = @timezone,
                    comments = CONVERT(xml, @commentsXml),
                    clienttype = @clientType,
                    gridposition = @gridPosition,
                    business_id = @businessId,
                    branch_id = @branchId,
                    hardwaretype_id = @hardwareTypeId,
                    owner_id = @ownerId,
                    deletelater = @deleteLater,
                    active = @active,
                    subnet = @subnet,
                    level1_region_id = @level1RegionId,
                    level2_region_id = @level2RegionId,
                    level3_region_id = @level3RegionId,
                    level4_region_id = @level4RegionId,
                    level5_region_id = @level5RegionId,
                    salt = @salt,
                    authhash = @authHash,
                    hypervisor_active = @hypervisorActive,
                    mergeto_client_id = @mergeToClientId,
                    feature_flags = @featureFlags
                WHERE client_id = @id",
                new[]
                {
                    new SqlParameter("@connectable", req.Connectable),
                    new SqlParameter("@networkAddress", req.NetworkAddress),
                    new SqlParameter("@clientName", req.ClientName),
                    new SqlParameter("@detailsUnknown", req.DetailsUnknown),
                    new SqlParameter("@latitude", req.Latitude),
                    new SqlParameter("@longitude", req.Longitude),
                    new SqlParameter("@timezone", req.Timezone),
                    new SqlParameter("@commentsXml", commentsXml),
                    new SqlParameter("@clientType", req.ClientType),
                    new SqlParameter("@gridPosition", req.GridPosition),
                    new SqlParameter("@businessId", req.BusinessId),
                    new SqlParameter("@branchId", req.BranchId),
                    new SqlParameter("@hardwareTypeId", req.HardwareTypeId),
                    new SqlParameter("@ownerId", req.OwnerId),
                    new SqlParameter("@deleteLater", req.DeleteLater),
                    new SqlParameter("@active", req.Active),
                    new SqlParameter("@subnet", req.Subnet),
                    new SqlParameter("@level1RegionId", req.Level1RegionId),
                    new SqlParameter("@level2RegionId", req.Level2RegionId),
                    new SqlParameter("@level3RegionId", req.Level3RegionId),
                    new SqlParameter("@level4RegionId", req.Level4RegionId),
                    new SqlParameter("@level5RegionId", req.Level5RegionId),
                    new SqlParameter("@salt", req.Salt),
                    new SqlParameter("@authHash", req.AuthHash),
                    new SqlParameter("@hypervisorActive", req.HypervisorActive),
                    new SqlParameter("@mergeToClientId", req.MergeToClientId),
                    new SqlParameter("@featureFlags", req.FeatureFlags),
                    new SqlParameter("@id", id),
                });

            return rows > 0;
        }

        public async Task<bool> DeleteClientAsync(int id)
            => await _context.Database.ExecuteSqlRawAsync("DELETE FROM dbo.Clients WHERE client_id = {0}", id) > 0;

        public Task<List<HardwareTypeDto>> GetHardwareTypesAsync()
            => _context.Database.SqlQueryRaw<HardwareTypeDto>(@"
                SELECT
                    hardwaretype_id AS HardwareTypeId,
                    name AS Name,
                    description AS Description,
                    typegroup AS TypeGroup,
                    canbeconfigured AS CanBeConfigured,
                    canbemonitored AS CanBeMonitored
                FROM dbo.HardwareTypes
                ORDER BY name").ToListAsync();

        public Task<List<HardwareTypeDto>> GetHardwareTypesByBusinessAsync(short businessId)
            => _context.Database.SqlQueryRaw<HardwareTypeDto>(@"
                SELECT
                    ht.hardwaretype_id AS HardwareTypeId,
                    ht.name AS Name,
                    ht.description AS Description,
                    ht.typegroup AS TypeGroup,
                    ht.canbeconfigured AS CanBeConfigured,
                    ht.canbemonitored AS CanBeMonitored
                FROM dbo.BusinessHardwareTypes bht
                INNER JOIN dbo.HardwareTypes ht ON ht.hardwaretype_id = bht.hardwaretype_id
                WHERE bht.business_id = {0}
                ORDER BY ht.name", businessId).ToListAsync();

        public async Task<TicketDebugDto> GetAtmTicketsDebugAsync(int clientId)
        {
            var tables = await _context.Database.SqlQueryRaw<NameRow>(@"
                SELECT TABLE_NAME AS [Name]
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_NAME LIKE '%Ticket%' OR TABLE_NAME LIKE '%ticket%'").ToListAsync();

            var columns = await _context.Database.SqlQueryRaw<NameRow>(@"
                SELECT COLUMN_NAME AS [Name]
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'TroubleTickets'
                ORDER BY ORDINAL_POSITION").ToListAsync();

            var ticketCount = await _context.Database.SqlQueryRaw<CountRow>(@"
                SELECT COUNT(1) AS [Value] FROM dbo.TroubleTickets WHERE client_id = {0}", clientId).FirstOrDefaultAsync();

            return new TicketDebugDto
            {
                TablesFound = tables.Count,
                Tables = tables.Select(x => x.Name).Take(50).ToList(),
                ColumnCount = columns.Count,
                SampleColumns = columns.Select(x => x.Name).Take(10).ToList(),
                FirstTicketForClient = (ticketCount?.Value ?? 0) > 0 ? "Ticket(s) trouvé(s)" : "Aucun ticket trouvé"
            };
        }

        private static string BuildSimpleXml(string rootName, string? freeText)
        {
            if (!string.IsNullOrWhiteSpace(freeText))
            {
                var trimmed = freeText.Trim();
                if (trimmed.StartsWith("<") && trimmed.EndsWith(">"))
                {
                    try
                    {
                        _ = XDocument.Parse(trimmed);
                        return trimmed;
                    }
                    catch
                    {
                    }
                }
            }

            var doc = new XDocument(
                new XElement(rootName,
                    string.IsNullOrWhiteSpace(freeText) ? null : new XElement("note", freeText.Trim())
                )
            );

            return doc.ToString(SaveOptions.DisableFormatting);
        }

        private class NameRow
        {
            public string Name { get; set; } = string.Empty;
        }

        private class CountRow
        {
            public int Value { get; set; }
        }
    }
}

