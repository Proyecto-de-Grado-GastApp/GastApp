using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GastAPI.Models
{
    public class EtiquetaPersonalizada
    {
        [Key]
        public long Id { get; set; }

        // Relación con Usuario
        [ForeignKey(nameof(Usuario))]
        public long? UsuarioId { get; set; }
        public Usuario? Usuario { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; } = null!;

        // Auditoría
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;

        // Relación con EtiquetaGasto (tabla de unión para N-N con Gastos)
        public ICollection<EtiquetaGasto> GastosEtiquetados { get; set; } = new HashSet<EtiquetaGasto>();
    }
}