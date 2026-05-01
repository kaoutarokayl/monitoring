using KtcWeb.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace KtcWeb.API.Controllers
{
    [ApiController]
    [Route("api/atm")]
    public class AtmController : ControllerBase
    {
        private readonly IAtmApplicationService _service;

        public AtmController(IAtmApplicationService service)
        {
            _service = service;
        }

        [HttpGet("clients/{id}/videojournal/search")]
        public async Task<ActionResult<List<VideoJournalEventDto>>> SearchVideoJournal(
            int id,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] string? search)
        {
            try
            {
                var fromDate = from ?? DateTime.UtcNow.AddDays(-7);
                var toDate = to ?? DateTime.UtcNow.AddDays(1);

                var rows = await _service.SearchVideoJournalAsync(id, fromDate, toDate, search);
                return Ok(rows);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("clients/{id}/videojournal/media/{mediaId:long}")]
        public async Task<IActionResult> GetVideoJournalMedia(int id, long mediaId)
        {
            try
            {
                var media = await _service.GetVideoJournalMediaAsync(id, mediaId);
                if (media == null) return NotFound(new { message = "Media introuvable" });

                return File(media.Stream, media.ContentType, media.FileName);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("clients/{id}/availability")]
        public async Task<ActionResult<AtmAvailabilityReportDto>> GetAvailability(
            int id,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to)
        {
            try
            {
                var fromDate = from ?? DateTime.UtcNow.AddDays(-7);
                var toDate = to ?? DateTime.UtcNow.AddDays(1);
                return Ok(await _service.GetAtmAvailabilityAsync(id, fromDate, toDate));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ====================== TEST CONNEXION ======================
        [HttpGet("test-connection")]
        public async Task<IActionResult> TestConnection()
        {
            try
            {
                return Ok(await _service.TestConnectionAsync());
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ====================== REGION ======================
[HttpGet("regions")]
public async Task<ActionResult<List<RegionListDto>>> GetAllRegions()
{
    try
    {
        return Ok(await _service.GetAllRegionsAsync());
    }
    catch (Exception ex)
    {
        return BadRequest(new { message = ex.Message });
    }
}
        [HttpGet("regions/{id}")]
        public async Task<ActionResult<RegionDetailsDto>> GetRegionById(short id)
        {
            try
            {
                var region = await _service.GetRegionByIdAsync(id);
                if (region == null) return NotFound(new { message = "Région introuvable" });

                return Ok(region);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("regions")]
        public async Task<IActionResult> CreateRegion([FromBody] CreateRegionRequest req)
        {
            try
            {
                await _service.CreateRegionAsync(req);
                return Ok(new { message = "Région créée avec succès" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("regions/{id}")]
        public async Task<IActionResult> UpdateRegion(short id, [FromBody] UpdateRegionRequest req)
        {
            try
            {
                var rows = await _service.UpdateRegionAsync(id, req);
                if (!rows) return NotFound(new { message = "Région introuvable" });
                return Ok(new { message = "Région modifiée avec succès" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("regions/{id}")]
        public async Task<IActionResult> DeleteRegion(short id)
        {
            try
            {
                var rows = await _service.DeleteRegionAsync(id);

                if (!rows) return NotFound(new { message = "Région introuvable" });
                return Ok(new { message = "Région supprimée avec succès" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ====================== BUSINESS ======================
        [HttpGet("businesses")]
        public async Task<ActionResult<List<BusinessDto>>> GetAllBusinesses()
        {
            try
            {
                return Ok(await _service.GetAllBusinessesAsync());
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("businesses/{id}")]
        public async Task<ActionResult<BusinessDetailsDto>> GetBusinessById(short id)
        {
            try
            {
                var business = await _service.GetBusinessByIdAsync(id);
                if (business == null) return NotFound(new { message = "Business introuvable" });

                return Ok(business);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("businesses")]
        public async Task<IActionResult> CreateBusiness([FromBody] CreateBusinessRequest req)
        {
            try
            {
                await _service.CreateBusinessAsync(req);
                return Ok(new { message = "Business créée avec succès" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("businesses/{id}")]
        public async Task<IActionResult> UpdateBusiness(short id, [FromBody] UpdateBusinessRequest req)
        {
            try
            {
                var rows = await _service.UpdateBusinessAsync(id, req);
                if (!rows) return NotFound(new { message = "Business introuvable" });
                return Ok(new { message = "Business modifiée avec succès" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("businesses/{id}")]
        public async Task<IActionResult> DeleteBusiness(short id)
        {
            try
            {
                var rows = await _service.DeleteBusinessAsync(id);

                if (!rows) return NotFound(new { message = "Business introuvable" });
                return Ok(new { message = "Business supprimée avec succès" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ====================== BRANCH ======================
        [HttpGet("branches")]
        public async Task<ActionResult<List<BranchDto>>> GetAllBranches()
        {
            try
            {
                return Ok(await _service.GetAllBranchesAsync());
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("branches/{id}")]
        public async Task<ActionResult<BranchDto>> GetBranchById(short id)
        {
            try
            {
                var branch = await _service.GetBranchByIdAsync(id);
                if (branch == null) return NotFound(new { message = "Branche introuvable" });

                return Ok(branch);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

[HttpPost("branches")]
public async Task<IActionResult> CreateBranch([FromBody] CreateBranchRequest req)
{
    try
    {
        await _service.CreateBranchAsync(req);
        return Ok(new { message = "Branche créée avec succès" });
    }
    catch (Exception ex)
    {
        return BadRequest(new { message = ex.Message });
    }
}

[HttpDelete("branches/{id}")]
public async Task<IActionResult> DeleteBranch(short id)
{
    try
    {
        var rows = await _service.DeleteBranchAsync(id);

        if (!rows) return NotFound(new { message = "Branche introuvable" });
        return Ok(new { message = "Branche supprimée avec succès" });
    }
    catch (Exception ex)
    {
        return BadRequest(new { message = ex.Message });
    }
}
[HttpPut("branches/{id}")]
public async Task<IActionResult> UpdateBranch(short id, [FromBody] UpdateBranchRequest req)
{
    try
    {
        var rows = await _service.UpdateBranchAsync(id, req);
        if (!rows) return NotFound(new { message = "Branche introuvable" });
        return Ok(new { message = "Branche modifiée avec succès" });
    }
    catch (Exception ex)
    {
        return BadRequest(new { message = ex.Message });
    }
}
        // ====================== CLIENT / ATM ======================
        [HttpGet("clients")]
        public async Task<ActionResult<List<ClientAtmDto>>> GetAllClients()
        {
            try
            {
                return Ok(await _service.GetAllClientsAsync());
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("clients")]
        public async Task<IActionResult> CreateClient([FromBody] CreateOrUpdateAtmRequest req)
        {
            try
            {
                await _service.CreateClientAsync(req);
                return Ok(new { message = "ATM créé avec succès" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("clients/{id}")]
        public async Task<ActionResult<ClientAtmDto>> GetClientById(int id)
        {
            try
            {
                var client = await _service.GetClientByIdAsync(id);
                if (client == null) return NotFound(new { message = "ATM introuvable" });
                return Ok(client);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("clients/{id}/status")]
        public async Task<ActionResult<List<AtmComponentStatusDto>>> GetAtmStatus(int id)
        {
            try
            {
                var status = await _service.GetAtmStatusAsync(id);
                return Ok(status);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("clients/{clientId}/components/{componentId}/application-counters")]
        public async Task<ActionResult<List<AppCounterDto>>> GetApplicationCounters(int clientId, short componentId)
        {
            try
            {
                var counters = await _service.GetApplicationCountersAsync(clientId, componentId);
                return Ok(counters);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("clients/{clientId}/components/{componentId}/replenishments")]
        public async Task<ActionResult<List<ReplenishmentDto>>> GetReplenishments(int clientId, short componentId)
        {
            try
            {
                var replenishments = await _service.GetReplenishmentsAsync(clientId, componentId);
                return Ok(replenishments);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("clients/{clientId}/components/{componentId}/xfs-counters")]
        public async Task<ActionResult<XfsCountersResponseDto>> GetXfsCounters(int clientId, short componentId)
        {
            try
            {
                var counters = await _service.GetXfsCountersAsync(clientId, componentId);
                return Ok(counters);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("clients/{id}/actions")]
        public async Task<ActionResult<List<AtmActionDto>>> GetClientActions(
            int id,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null)
        {
            try
            {
                var actions = await _service.GetClientActionsAsync(id, from, to);
                return Ok(actions);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("clients/{id}/electronic-journal")]
        public async Task<ActionResult<List<ElectronicJournalEntryDto>>> GetElectronicJournal(
            int id,
            [FromQuery] DateTime from,
            [FromQuery] DateTime to)
        {
            try
            {
                // Default window if not provided
                var entries = await _service.GetElectronicJournalAsync(id, from, to);
                return Ok(entries);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("transactions/lookups/type-codes")]
        public async Task<ActionResult<List<LookupItemDto>>> GetTransactionTypeCodes()
        {
            try
            {
                return Ok(await _service.GetTransactionTypeLookupsAsync());
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("transactions/lookups/reason-codes")]
        public async Task<ActionResult<List<LookupItemDto>>> GetTransactionReasonCodes()
        {
            try
            {
                return Ok(await _service.GetTransactionReasonLookupsAsync());
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("transactions/lookups/completion-codes")]
        public async Task<ActionResult<List<LookupItemDto>>> GetTransactionCompletionCodes()
        {
            try
            {
                return Ok(await _service.GetTransactionCompletionLookupsAsync());
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("clients/{id}/transactions/search")]
        public async Task<ActionResult<List<TransactionAuditDto>>> SearchAtmTransactions(int id, [FromBody] TransactionSearchCriteria criteria)
        {
            try
            {
                var rows = await _service.SearchAtmTransactionsAsync(id, criteria);
                return Ok(rows);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("clients/{id}/assethistory")]
        public async Task<ActionResult<List<AtmAssetHistoryDto>>> GetAtmAssetHistory(int id)
        {
            try
            {
                var history = await _service.GetAtmAssetHistoryAsync(id);
                return Ok(history);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("clients/{id}/lastcontact")]
        public async Task<ActionResult<LastClientContactDto>> GetLastClientContact(int id)
        {
            try
            {
                var lastContact = await _service.GetLastClientContactAsync(id);
                if (lastContact == null)
                {
                    return NotFound(new { message = "Aucun dernier contact trouvé pour cet ATM." });
                }
                return Ok(lastContact);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("clients/{id}/softwareinfo")]
        public async Task<ActionResult<List<AtmSoftwareInfoDto>>> GetAtmSoftwareInfo(int id)
        {
            try
            {
                var softwareInfo = await _service.GetAtmSoftwareInfoAsync(id);
                return Ok(softwareInfo);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("clients/{id}/certificates")]
        public async Task<ActionResult<List<AtmCertificateDto>>> GetAtmCertificates(int id)
        {
            try
            {
                var certificates = await _service.GetAtmCertificatesAsync(id);
                return Ok(certificates);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("clients/{id}/tickets")]
        public async Task<ActionResult<List<AtmTicketDto>>> GetAtmTickets(int id, [FromQuery] int days = 14, [FromQuery] string statusFilter = "All")
        {
            try
            {
                // Validate parameters
                var tickets = await _service.GetAtmTicketsAsync(id, days, statusFilter);
                return Ok(tickets);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Erreur: {ex.Message}", details = ex.InnerException?.Message });
            }
        }

        [HttpGet("clients/{id}/tickets-debug")]
        public async Task<ActionResult> GetAtmTicketsDebug(int id)
        {
            try
            {
                return Ok(await _service.GetAtmTicketsDebugAsync(id));
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message, innerError = ex.InnerException?.Message });
            }
        }

        [HttpPut("clients/{id}")]
        public async Task<IActionResult> UpdateClient(int id, [FromBody] CreateOrUpdateAtmRequest req)
        {
            try
            {
                var rows = await _service.UpdateClientAsync(id, req);

                if (!rows) return NotFound(new { message = "ATM introuvable" });
                return Ok(new { message = "ATM modifié avec succès" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("clients/{id}")]
        public async Task<IActionResult> DeleteClient(int id)
        {
            try
            {
                var rows = await _service.DeleteClientAsync(id);

                if (!rows) return NotFound(new { message = "ATM introuvable" });
                return Ok(new { message = "ATM supprimé avec succès" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("hardwaretypes")]
        public async Task<ActionResult<List<HardwareTypeDto>>> GetHardwareTypes()
        {
            try
            {
                return Ok(await _service.GetHardwareTypesAsync());
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("businesses/{businessId}/hardwaretypes")]
        public async Task<ActionResult<List<HardwareTypeDto>>> GetHardwareTypesByBusiness(short businessId)
        {
            try
            {
                return Ok(await _service.GetHardwareTypesByBusinessAsync(businessId));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}

