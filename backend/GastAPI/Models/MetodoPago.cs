namespace GastAPI {
    public class MetodoPago {
        public int Id { get; set; }
        public required string Nombre { get; set; }
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        public DateTime FechaActualizacion { get; set; } = DateTime.Now;
    }
}