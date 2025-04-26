namespace GastAPI {
    public class EtiquetaPersonalizada {
        public int Id { get; set; }
        public int IdUsuario { get; set; }
        public required string Nombre {get; set;} 
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        public DateTime FechaActualizacion { get; set; } = DateTime.Now;
    }
}   