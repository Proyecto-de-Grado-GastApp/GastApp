using System.ComponentModel.DataAnnotations;

namespace GastAPI.Dtos.Presupuesto
{
    // DTO para crear un presupuesto
    public class PresupuestoCreateDTO
    {
        public long CategoriaId { get; set; }

        [Required]
        public decimal Cantidad { get; set; }

        [Required]
        public DateTime FechaInicio { get; set; }

        public DateTime? FechaFin { get; set; }
    }

}