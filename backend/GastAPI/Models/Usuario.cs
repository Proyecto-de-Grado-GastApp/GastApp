using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GastAPI.Models
{
    public class Usuario
    {
        public Usuario()
        {
            Gastos = new HashSet<Gasto>();
            Presupuestos = new HashSet<Presupuesto>();
            EtiquetasPersonalizadas = new HashSet<EtiquetaPersonalizada>();
            Recordatorios = new HashSet<RecordatorioPago>();
            Historiales = new HashSet<HistorialCambio>();
        }

        [Key]
        public long Id { get; set; }

        [MaxLength(100)]
        public required string Nombre { get; set; }

        [EmailAddress]
        [MaxLength(255)]
        public required string Email { get; set; }

        [MaxLength(255)]
        public required string Contrasena { get; set; }

        //Auditoría
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;

        // Relaciones
        public ICollection<Gasto> Gastos { get; set; }
        public ICollection<Presupuesto> Presupuestos { get; set; }
        public ICollection<EtiquetaPersonalizada> EtiquetasPersonalizadas { get; set; }
        public ICollection<RecordatorioPago> Recordatorios { get; set; }
        public ICollection<HistorialCambio> Historiales { get; set; }
    }
}