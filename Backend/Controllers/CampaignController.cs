using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


#pragma warning disable CS8604 // Possible null reference argument.

namespace KtcWeb.API.Controllers
{
    [ApiController]
    [Route("api/campaign")]
    public class CampaignController : ControllerBase
    {
        private readonly KtcDbContext _context;

        public CampaignController(KtcDbContext context)
        {
            _context = context;
        }

        // ====================== GET ALL CAMPAIGNS ======================
        [HttpGet]
        public async Task<ActionResult<List<CampaignDto>>> GetAllCampaigns()
        {
            try
            {
                var campaigns = await _context.Database.SqlQueryRaw<CampaignDto>(@"
                    SELECT 
                        campaign_id AS CampaignId,
                        name AS Name,
                        package_name AS PackageName,
                        start_date AS StartDate,
                        end_date AS EndDate,
                        purge_date AS PurgeDate,
                        priority AS Priority,
                        campaign_type AS CampaignType,
                        campaign_status AS CampaignStatus,
                        campaign_in_testmode AS CampaignInTestmode,
                        download_id AS DownloadId,
                        CampaignData AS CampaignData,
                        DynamicCampaignData AS DynamicCampaignData,
                        external_id AS ExternalId,
                        max_shows AS MaxShows,
                        rest_hours AS RestHours,
                        interactive AS Interactive,
                        max_show_me_later_shows AS MaxShowMeLaterShows,
                        show_me_later_rest_hours AS ShowMeLaterRestHours
                    FROM [KALKTCCustomer].[dbo].[Campaigns]
                    ORDER BY name
                ").ToListAsync();

                return Ok(campaigns);
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "✗ Erreur lors du chargement des campagnes", error = ex.Message });
            }
        }

        // ====================== GET CAMPAIGN BY ID ======================
        [HttpGet("{campaignId}")]
        public async Task<ActionResult<CampaignDto>> GetCampaignById(int campaignId)
        {
            try
            {
                var campaign = await _context.Database.SqlQueryRaw<CampaignDto>(@"
                    SELECT 
                        campaign_id AS CampaignId,
                        name AS Name,
                        package_name AS PackageName,
                        start_date AS StartDate,
                        end_date AS EndDate,
                        purge_date AS PurgeDate,
                        priority AS Priority,
                        campaign_type AS CampaignType,
                        campaign_status AS CampaignStatus,
                        campaign_in_testmode AS CampaignInTestmode,
                        download_id AS DownloadId,
                        CampaignData AS CampaignData,
                        DynamicCampaignData AS DynamicCampaignData,
                        external_id AS ExternalId,
                        max_shows AS MaxShows,
                        rest_hours AS RestHours,
                        interactive AS Interactive,
                        max_show_me_later_shows AS MaxShowMeLaterShows,
                        show_me_later_rest_hours AS ShowMeLaterRestHours
                    FROM [KALKTCCustomer].[dbo].[Campaigns]
                    WHERE campaign_id = {0}
                ", campaignId).FirstOrDefaultAsync();

                if (campaign == null)
                {
                    return NotFound(new { error = $"Campagne {campaignId} non trouvée" });
                }

                return Ok(campaign);
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "✗ Erreur lors du chargement de la campagne", error = ex.Message });
            }
        }

        // ====================== CREATE CAMPAIGN ======================
        [HttpPost]
        public async Task<ActionResult<CampaignDto>> CreateCampaign([FromBody] CreateCampaignRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Name))
                {
                    return BadRequest(new { error = "Le nom de la campagne est obligatoire" });
                }

                var result = await _context.Database.ExecuteSqlRawAsync(@"
                    INSERT INTO [KALKTCCustomer].[dbo].[Campaigns]
                    (name, package_name, start_date, end_date, purge_date, priority, campaign_type, 
                     campaign_status, campaign_in_testmode, download_id, CampaignData, DynamicCampaignData, 
                     external_id, max_shows, rest_hours, interactive, max_show_me_later_shows, show_me_later_rest_hours)
                    VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9}, {10}, {11}, {12}, {13}, {14}, {15}, {16}, {17})
                ",
                    request.Name,
                    request.PackageName ?? "",
                    request.StartDate ?? DateTime.Now,
                    request.EndDate ?? DateTime.Now.AddMonths(1),
                    request.PurgeDate ?? DateTime.Now.AddMonths(2),
                    request.Priority ?? 5,
                    request.CampaignType ?? 0,
                    request.CampaignStatus ?? 0,
                    request.CampaignInTestmode ?? false,
                    request.DownloadId ?? 0,
                    request.CampaignData ?? "",
                    request.DynamicCampaignData ?? "",
                    request.ExternalId ?? "",
                    request.MaxShows ?? 0,
                    request.RestHours ?? 0,
                    request.Interactive ?? false,
                    request.MaxShowMeLaterShows ?? 0,
                    request.ShowMeLaterRestHours ?? 0
                );

                // Get the created campaign
                var campaign = await _context.Database.SqlQueryRaw<CampaignDto>(@"
                    SELECT 
                        campaign_id AS CampaignId,
                        name AS Name,
                        package_name AS PackageName,
                        start_date AS StartDate,
                        end_date AS EndDate,
                        purge_date AS PurgeDate,
                        priority AS Priority,
                        campaign_type AS CampaignType,
                        campaign_status AS CampaignStatus,
                        campaign_in_testmode AS CampaignInTestmode,
                        download_id AS DownloadId,
                        CampaignData AS CampaignData,
                        DynamicCampaignData AS DynamicCampaignData,
                        external_id AS ExternalId,
                        max_shows AS MaxShows,
                        rest_hours AS RestHours,
                        interactive AS Interactive,
                        max_show_me_later_shows AS MaxShowMeLaterShows,
                        show_me_later_rest_hours AS ShowMeLaterRestHours
                    FROM [KALKTCCustomer].[dbo].[Campaigns]
                    WHERE name = {0}
                    ORDER BY campaign_id DESC
                ", request.Name).FirstOrDefaultAsync();

                return Ok(new { status = "✓ Campagne créée avec succès", campaign });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "✗ Erreur lors de la création de la campagne", error = ex.Message });
            }
        }

        // ====================== UPDATE CAMPAIGN ======================
        [HttpPut("{campaignId}")]
        public async Task<ActionResult<CampaignDto>> UpdateCampaign(int campaignId, [FromBody] CreateCampaignRequest request)
        {
            try
            {
                var result = await _context.Database.ExecuteSqlRawAsync(@"
                    UPDATE [KALKTCCustomer].[dbo].[Campaigns]
                    SET 
                        name = {0},
                        package_name = {1},
                        start_date = {2},
                        end_date = {3},
                        purge_date = {4},
                        priority = {5},
                        campaign_type = {6},
                        campaign_status = {7},
                        campaign_in_testmode = {8},
                        download_id = {9},
                        CampaignData = {10},
                        DynamicCampaignData = {11},
                        external_id = {12},
                        max_shows = {13},
                        rest_hours = {14},
                        interactive = {15},
                        max_show_me_later_shows = {16},
                        show_me_later_rest_hours = {17}
                    WHERE campaign_id = {18}
                ",
                    request.Name ?? "",
                    request.PackageName ?? "",
                    request.StartDate ?? DateTime.Now,
                    request.EndDate ?? DateTime.Now.AddMonths(1),
                    request.PurgeDate ?? DateTime.Now.AddMonths(2),
                    request.Priority ?? 5,
                    request.CampaignType ?? 0,
                    request.CampaignStatus ?? 0,
                    request.CampaignInTestmode ?? false,
                    request.DownloadId ?? 0,
                    request.CampaignData ?? "",
                    request.DynamicCampaignData ?? "",
                    request.ExternalId ?? "",
                    request.MaxShows ?? 0,
                    request.RestHours ?? 0,
                    request.Interactive ?? false,
                    request.MaxShowMeLaterShows ?? 0,
                    request.ShowMeLaterRestHours ?? 0,
                    campaignId
                );

                var campaign = await GetCampaignById(campaignId);
                return Ok(new { status = "✓ Campagne mise à jour avec succès", campaign });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "✗ Erreur lors de la mise à jour de la campagne", error = ex.Message });
            }
        }

        // ====================== DELETE CAMPAIGN ======================
        [HttpDelete("{campaignId}")]
        public async Task<ActionResult> DeleteCampaign(int campaignId)
        {
            try
            {
                var result = await _context.Database.ExecuteSqlRawAsync(@"
                    DELETE FROM [KALKTCCustomer].[dbo].[Campaigns]
                    WHERE campaign_id = {0}
                ", campaignId);

                if (result == 0)
                {
                    return NotFound(new { error = $"Campagne {campaignId} non trouvée" });
                }

                return Ok(new { status = "✓ Campagne supprimée avec succès" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "✗ Erreur lors de la suppression de la campagne", error = ex.Message });
            }
        }

        // ====================== GET CAMPAIGN BUSINESSES ======================
        [HttpGet("{campaignId}/businesses")]
        public async Task<ActionResult<List<CampaignBusinessDto>>> GetCampaignBusinesses(int campaignId)
        {
            try
            {
                var businesses = await _context.Database.SqlQueryRaw<CampaignBusinessDto>(@"
                    SELECT 
                        cb.campaign_id AS CampaignId,
                        cb.business_id AS BusinessId,
                        b.businessname AS BusinessName
                    FROM [KALKTCCustomer].[dbo].[CampaignBusinesses] cb
                    LEFT JOIN [KALKTCDB].[dbo].[Businesses] b ON cb.business_id = b.business_id
                    WHERE cb.campaign_id = {0}
                ", campaignId).ToListAsync();

                return Ok(businesses);
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "✗ Erreur lors du chargement des entreprises de la campagne", error = ex.Message });
            }
        }

        // ====================== GET CAMPAIGN GROUPS ======================
        [HttpGet("{campaignId}/groups")]
        public async Task<ActionResult<List<CampaignGroupDto>>> GetCampaignGroups(int campaignId)
        {
            try
            {
                var groups = await _context.Database.SqlQueryRaw<CampaignGroupDto>(@"
                    SELECT 
                        cg.campaign_id AS CampaignId,
                        cg.group_id AS GroupId,
                        g.groupname AS GroupName,
                        cg.group_included AS GroupIncluded
                    FROM [KALKTCCustomer].[dbo].[CampaignGroups] cg
                    LEFT JOIN [KALKTCDB].[dbo].[Groups] g ON cg.group_id = g.group_id
                    WHERE cg.campaign_id = {0}
                ", campaignId).ToListAsync();

                return Ok(groups);
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "✗ Erreur lors du chargement des groupes de la campagne", error = ex.Message });
            }
        }

        // ====================== GET CAMPAIGN BIN RANGES ======================
        [HttpGet("{campaignId}/bin-ranges")]
        public async Task<ActionResult<List<CampaignBINRangeDto>>> GetCampaignBINRanges(int campaignId)
        {
            try
            {
                var binRanges = await _context.Database.SqlQueryRaw<CampaignBINRangeDto>(@"
                    SELECT 
                        campaign_id AS CampaignId,
                        bin_min AS BinMin,
                        bin_max AS BinMax
                    FROM [KALKTCCustomer].[dbo].[CampaignBINRanges]
                    WHERE campaign_id = {0}
                ", campaignId).ToListAsync();

                return Ok(binRanges);
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "✗ Erreur lors du chargement des plages BIN de la campagne", error = ex.Message });
            }
        }

        // ====================== GET CAMPAIGN SHOWN COUNTS ======================
        [HttpGet("{campaignId}/shown-counts")]
        public async Task<ActionResult<List<CampaignShownCountDto>>> GetCampaignShownCounts(int campaignId)
        {
            try
            {
                var counts = await _context.Database.SqlQueryRaw<CampaignShownCountDto>(@"
                    SELECT 
                        csc.campaign_id AS CampaignId,
                        csc.business_id AS BusinessId,
                        b.businessname AS BusinessName,
                        csc.count AS Count
                    FROM [KALKTCCustomer].[dbo].[CampaignShownCounts] csc
                    LEFT JOIN [KALKTCDB].[dbo].[Businesses] b ON csc.business_id = b.business_id
                    WHERE csc.campaign_id = {0}
                ", campaignId).ToListAsync();

                return Ok(counts);
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "✗ Erreur lors du chargement des comptes d'affichage de la campagne", error = ex.Message });
            }
        }
    }
}
