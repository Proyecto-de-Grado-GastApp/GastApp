using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GastAPI.Data;
using GastAPI.Models;

namespace GastAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MetodosPagoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MetodosPagoController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/MetodosPago
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MetodoPago>>> GetMetodosPago()
        {
            return await _context.MetodosPago.ToListAsync();
        }

        // GET: api/MetodosPago/id
        [HttpGet("{id}")]
        public async Task<ActionResult<MetodoPago>> GetMetodoPago(long id)
        {
            var metodo = await _context.MetodosPago.FindAsync(id);

            if (metodo == null)
                return NotFound();

            return metodo;
        }

        // POST: api/MetodosPago
        [HttpPost]
        public async Task<ActionResult<MetodoPago>> PostMetodoPago(MetodoPago metodoPago)
        {
            metodoPago.FechaCreacion = DateTime.UtcNow;
            metodoPago.FechaActualizacion = DateTime.UtcNow;

            _context.MetodosPago.Add(metodoPago);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMetodoPago), new { id = metodoPago.Id }, metodoPago);
        }

        // PUT: api/MetodosPago/id
        [HttpPut("{id}")]
        public async Task<IActionResult> PutMetodoPago(long id, MetodoPago metodoPago)
        {
            if (id != metodoPago.Id)
                return BadRequest("ID no coincide");

            var existente = await _context.MetodosPago.FindAsync(id);
            if (existente == null)
                return NotFound();

            existente.NombreMetodo = metodoPago.NombreMetodo;
            existente.FechaActualizacion = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/MetodosPago/id
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMetodoPago(long id)
        {
            var metodo = await _context.MetodosPago.FindAsync(id);
            if (metodo == null)
                return NotFound();

            _context.MetodosPago.Remove(metodo);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
