using GastAPI.Data;
using GastAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GastAPI.Dtos.EtiquetasPersonalizada;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Asegura que solo usuarios autenticados puedan acceder
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
        // Obtener el ID del usuario actual
        var usuarioId = GetUsuarioId();
        
        // Filtrar etiquetas por el usuario actual
        var etiquetas = await _context.EtiquetasPersonalizadas
            .Where(e => e.UsuarioId == usuarioId)
            .Select(e => new EtiquetaPersonalizadaDto
            {
                Id = e.Id,
                Nombre = e.Nombre,
                Color = e.Color,
                UsuarioId = e.UsuarioId
            })
            .ToListAsync();

        return Ok(etiquetas);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EtiquetaPersonalizadaDto>> GetById(long id)
    {
        var usuarioId = GetUsuarioId();
        
        var etiqueta = await _context.EtiquetasPersonalizadas
            .Where(e => e.Id == id && e.UsuarioId == usuarioId)
            .Select(e => new EtiquetaPersonalizadaDto
            {
                Id = e.Id,
                Nombre = e.Nombre,
                Color = e.Color,
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
        var usuarioId = GetUsuarioId();
        
        var etiqueta = new EtiquetaPersonalizada
        {
            Nombre = dto.Nombre,
            Color = string.IsNullOrEmpty(dto.Color) ? "#3b82f6" : dto.Color,
            UsuarioId = usuarioId, // Asignar el ID del usuario autenticado
            FechaCreacion = DateTime.UtcNow,
            FechaActualizacion = DateTime.UtcNow
        };

        _context.EtiquetasPersonalizadas.Add(etiqueta);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = etiqueta.Id }, new EtiquetaPersonalizadaDto
        {
            Id = etiqueta.Id,
            Nombre = etiqueta.Nombre,
            Color = etiqueta.Color,
            UsuarioId = etiqueta.UsuarioId
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(long id, [FromBody] ActualizarEtiquetaPersonalizadaDto dto)
    {
        var usuarioId = GetUsuarioId();
        
        var etiqueta = await _context.EtiquetasPersonalizadas
            .FirstOrDefaultAsync(e => e.Id == id && e.UsuarioId == usuarioId);
            
        if (etiqueta == null)
            return NotFound();

        etiqueta.Nombre = dto.Nombre;
        etiqueta.Color = string.IsNullOrEmpty(dto.Color) ? "#3b82f6" : dto.Color;
        etiqueta.FechaActualizacion = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(long id)
    {
        var usuarioId = GetUsuarioId();
        
        var etiqueta = await _context.EtiquetasPersonalizadas
            .FirstOrDefaultAsync(e => e.Id == id && e.UsuarioId == usuarioId);
            
        if (etiqueta == null)
            return NotFound();

        _context.EtiquetasPersonalizadas.Remove(etiqueta);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // Método auxiliar para obtener el ID del usuario autenticado
    private long GetUsuarioId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim))
        {
            throw new UnauthorizedAccessException("Usuario no autenticado");
        }
        return long.Parse(userIdClaim);
    }
}