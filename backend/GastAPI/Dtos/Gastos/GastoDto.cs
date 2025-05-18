namespace GastAPI.Dtos.Gastos
{
    public class GastoDto
    {
        public long Id { get; set; }
        public long UsuarioId { get; set; }
        public long? CategoriaId { get; set; }
        public long? MetodoPagoId { get; set; }
        public decimal Cantidad { get; set; }
        public string Descripcion { get; set; } = string.Empty;
        public DateTime Fecha { get; set; }
        public int Frecuencia { get; set; }
        public bool Activo { get; set; }
        public bool Notificar { get; set; }
        public string? Nota { get; set; } = string.Empty;
        public DateTime FechaCreacion { get; set; }
        public DateTime FechaActualizacion { get; set; }
        public List<long> EtiquetaIds { get; set; } = new();
    }
}