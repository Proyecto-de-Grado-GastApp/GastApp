using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GastAPI.Data;
using GastAPI.Models;
using GastAPI.Dtos.RecordatoriosPago;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class RecordatoriosPagoController : ControllerBase
{
    private readonly AppDbContext _context;

    public RecordatoriosPagoController(AppDbContext context)
    {
        _context = context;
    }

    private long GetUserId() =>
        long.Parse(User.FindFirst("id")!.Value);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RecordatorioPagoDTO>>> GetRecordatorios()
    {
        var userId = GetUserId();

        var recordatorios = await _context.RecordatoriosPago
            .Include(r => r.Gasto)
            .Where(r => r.Gasto.UsuarioId == userId)
            .Select(r => new RecordatorioPagoDTO
            {
                Id = r.Id,
                GastoId = r.GastoId!.Value,
                FechaRecordatorio = r.FechaRecordatorio,
                Notificado = r.Notificado
            })
            .ToListAsync();

        return Ok(recordatorios);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RecordatorioPagoDTO>> GetRecordatorio(long id)
    {
        var userId = GetUserId();

        var recordatorio = await _context.RecordatoriosPago
            .Include(r => r.Gasto)
            .FirstOrDefaultAsync(r => r.Id == id && r.Gasto.UsuarioId == userId);

        if (recordatorio == null)
            return NotFound();

        return new RecordatorioPagoDTO
        {
            Id = recordatorio.Id,
            GastoId = recordatorio.GastoId!.Value,
            FechaRecordatorio = recordatorio.FechaRecordatorio,
            Notificado = recordatorio.Notificado
        };
    }

    [HttpPost]
    public async Task<ActionResult<RecordatorioPagoDTO>> PostRecordatorio(RecordatorioPagoCreateDTO dto)
    {
        var userId = GetUserId();

        var gasto = await _context.Gastos.FirstOrDefaultAsync(g => g.Id == dto.GastoId && g.UsuarioId == userId);
        if (gasto == null)
            return BadRequest("El gasto no existe o no pertenece al usuario.");

        var recordatorio = new RecordatorioPago
        {
            GastoId = dto.GastoId,
            FechaRecordatorio = dto.FechaRecordatorio
        };

        _context.RecordatoriosPago.Add(recordatorio);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetRecordatorio), new { id = recordatorio.Id }, new RecordatorioPagoDTO
        {
            Id = recordatorio.Id,
            GastoId = recordatorio.GastoId!.Value,
            FechaRecordatorio = recordatorio.FechaRecordatorio,
            Notificado = recordatorio.Notificado
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutRecordatorio(long id, RecordatorioPagoCreateDTO dto)
    {
        var userId = GetUserId();

        var recordatorio = await _context.RecordatoriosPago
            .Include(r => r.Gasto)
            .FirstOrDefaultAsync(r => r.Id == id && r.Gasto.UsuarioId == userId);

        if (recordatorio == null)
            return NotFound();

        recordatorio.FechaRecordatorio = dto.FechaRecordatorio;
        recordatorio.FechaActualizacion = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRecordatorio(long id)
    {
        var userId = GetUserId();

        var recordatorio = await _context.RecordatoriosPago
            .Include(r => r.Gasto)
            .FirstOrDefaultAsync(r => r.Id == id && r.Gasto.UsuarioId == userId);

        if (recordatorio == null)
            return NotFound();

        _context.RecordatoriosPago.Remove(recordatorio);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
