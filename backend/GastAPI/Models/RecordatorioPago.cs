using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GastAPI.Models
{
    public class RecordatorioPago
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long Id { get; set; } 

        // Relación con Gasto
        public long? GastoId { get; set; }  // Cambiado a long
        public Gasto Gasto { get; set; } = null!;

        [Required]
        public DateTime FechaRecordatorio { get; set; }

        public bool? Notificado { get; set; } = false;

        // Auditoría
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        public DateTime FechaActualizacion { get; set; } = DateTime.Now;
    }
}