using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GastAPI.Models 
{
    public class Gasto 
    {
        [Key]
        public long Id { get; set; }

        // Relación con Usuario (requerida)
        [ForeignKey(nameof(Usuario))]
        public long UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;

        // Relación con Categoría (puede ser opcional)
        [ForeignKey(nameof(Categoria))]
        public long? CategoriaId { get; set; }
        public Categoria? Categoria { get; set; }

        // Relación con Método de Pago (puede ser opcional)
        [ForeignKey(nameof(MetodoPago))]
        public long? MetodoPagoId { get; set; }
        public MetodoPago? MetodoPago { get; set; }

        // Propiedades principales
        [Column(TypeName = "decimal(18,2)")]
        [Required]
        public decimal Cantidad { get; set; }

        [MaxLength(500)]
        public string Descripcion { get; set; } = string.Empty;

        [Required]
        public DateTime Fecha { get; set; }

        // Frecuencia (0: No recurrente, 1: Diaria, 2: Semanal, 3: Mensual, 4: Anual)
        public int Frecuencia { get; set; } = 0;

        public bool Activo { get; set; } = true;
        public bool Notificar { get; set; } = false;

        [MaxLength(1000)]
        public string Nota { get; set; } = string.Empty;

        // Auditoría
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;

        // Relaciones inversas
        public ICollection<RecordatorioPago> Recordatorios { get; set; } = new HashSet<RecordatorioPago>();
        public ICollection<HistorialCambio> HistorialCambios { get; set; } = new HashSet<HistorialCambio>();
        public ICollection<EtiquetaGasto> Etiquetas { get; set; } = new HashSet<EtiquetaGasto>();
    }
}
