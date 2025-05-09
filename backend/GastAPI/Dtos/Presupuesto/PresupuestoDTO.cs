using System.ComponentModel.DataAnnotations;

namespace GastAPI.Dtos.Presupuesto
{
    // DTO para devolver presupuesto
    public class PresupuestoDTO
    {
        public long Id { get; set; }
        public long CategoriaId { get; set; }
        public string CategoriaNombre { get; set; } = string.Empty;
        public decimal Cantidad { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime? FechaFin { get; set; }
    }
}