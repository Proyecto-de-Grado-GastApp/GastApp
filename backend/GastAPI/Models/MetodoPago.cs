using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GastAPI.Models
{
    public class MetodoPago
    {
        [Key]
        public long Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string NombreMetodo { get; set; } = null!;

        // Auditoría
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;

        // Relación con Gastos
        public ICollection<Gasto> Gastos { get; set; } = new HashSet<Gasto>();
    }
}
