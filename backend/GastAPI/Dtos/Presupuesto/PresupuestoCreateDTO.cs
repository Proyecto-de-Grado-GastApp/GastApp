using System.ComponentModel.DataAnnotations;

namespace GastAPI.Dtos.Presupuesto
{
    public class PresupuestoCreateDTO
    {
        [Required]
        public long CategoriaId { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Cantidad { get; set; }

        [Required]
        public DateTime FechaInicio { get; set; }

        [Required]
        public DateTime FechaFin { get; set; }
    }

}