using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GastAPI.Models
{
    public class HistorialCambio
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long Id { get; set; }  // Cambiado a long para coincidir con bigint en SQL

        // Relación con Gasto
        [ForeignKey(nameof(Gasto))]
        public long GastoId { get; set; }
        public Gasto Gasto { get; set; } = null!;

        public required DateTime FechaCambio { get; set; } = DateTime.Now;

        [Required]
        [MaxLength(500)]  // Limitar la longitud del campo a 500 caracteres
        [Column("DescripcionCambio")]  // Mapea correctamente al nombre en la BD
        public string Descripcion { get; set; } = string.Empty;

        // Auditoría
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        public DateTime FechaActualizacion { get; set; } = DateTime.Now;
    }
}