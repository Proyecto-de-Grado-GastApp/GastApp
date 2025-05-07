using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GastAPI.Models
{
    public class Presupuesto
    {
        [Key]
        public long Id { get; set; }

        // Relación con Usuario (requerida)
        [ForeignKey(nameof(Usuario))]
        public long UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;

        // Relación con Categoría (requerida)
        [ForeignKey(nameof(Categoria))]
        public long CategoriaId { get; set; }
        public Categoria Categoria { get; set; } = null!;

        // Propiedades principales
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Cantidad { get; set; }

        [Required]
        public DateTime FechaInicio { get; set; }

        public DateTime? FechaFin { get; set; }

        // Auditoría
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;
    }
}
