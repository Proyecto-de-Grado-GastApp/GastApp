namespace GastAPI {
    public class Categoria {
        public int Id { get; set; }
        public required string Nombre { get; set; }
        public string Descripcion {get; set;} = string.Empty;
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        public DateTime FechaActualizacion { get; set; } = DateTime.Now;
    }
}