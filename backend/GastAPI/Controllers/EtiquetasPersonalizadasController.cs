using GastAPI.Data;
using GastAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GastAPI.Dtos.EtiquetasPersonalizada;

[ApiController]
[Route("api/[controller]")]
public class EtiquetasPersonalizadasController : ControllerBase
{
    private readonly AppDbContext _context;

    public EtiquetasPersonalizadasController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EtiquetaPersonalizadaDto>>> GetAll()
    {
        var etiquetas = await _context.EtiquetasPersonalizadas
            .Select(e => new EtiquetaPersonalizadaDto
            {
                Id = e.Id,
                Nombre = e.Nombre,
                UsuarioId = e.UsuarioId
            })
            .ToListAsync();

        return Ok(etiquetas);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EtiquetaPersonalizadaDto>> GetById(long id)
    {
        var etiqueta = await _context.EtiquetasPersonalizadas
            .Where(e => e.Id == id)
            .Select(e => new EtiquetaPersonalizadaDto
            {
                Id = e.Id,
                Nombre = e.Nombre,
                UsuarioId = e.UsuarioId
            })
            .FirstOrDefaultAsync();

        if (etiqueta == null)
            return NotFound();

        return Ok(etiqueta);
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CrearEtiquetaPersonalizadaDto dto)
    {
        var etiqueta = new EtiquetaPersonalizada
        {
            Nombre = dto.Nombre,
            UsuarioId = dto.UsuarioId,
            FechaCreacion = DateTime.UtcNow,
            FechaActualizacion = DateTime.UtcNow
        };

        _context.EtiquetasPersonalizadas.Add(etiqueta);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = etiqueta.Id }, new EtiquetaPersonalizadaDto
        {
            Id = etiqueta.Id,
            Nombre = etiqueta.Nombre,
            UsuarioId = etiqueta.UsuarioId
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(long id, [FromBody] ActualizarEtiquetaPersonalizadaDto dto)
    {
        var etiqueta = await _context.EtiquetasPersonalizadas.FindAsync(id);
        if (etiqueta == null)
            return NotFound();

        etiqueta.Nombre = dto.Nombre;
        etiqueta.FechaActualizacion = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(long id)
    {
        var etiqueta = await _context.EtiquetasPersonalizadas.FindAsync(id);
        if (etiqueta == null)
            return NotFound();

        _context.EtiquetasPersonalizadas.Remove(etiqueta);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
