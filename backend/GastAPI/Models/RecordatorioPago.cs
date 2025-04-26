namespace GastAPI.Models{
    public class RecordatorioPago {
        public int Id { get; set; }
        public int IdGasto { get; set; } // Relación con el gasto
        public required DateTime FechaRecordatorio { get; set; } // Fecha del recordatorio
        public bool Notificado { get; set; } = false; // Indica si se ha notificado al usuario
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        public DateTime FechaActualizacion { get; set; } = DateTime.Now;
    }
}