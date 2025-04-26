namespace GastAPI.Models {
    public class Gasto {
        public int Id { get; set; }
        public int IdUsuario {get; set; }
        public int IdCategoria { get; set; }
        public required decimal Cantidad { get; set; }
        public string Descripcion { get; set; } = string.Empty;
        public required DateTime Fecha { get; set; } = DateTime.Now;
        public int Frecuencia { get; set; } = 0; // 0: No recurrente, 1: Diaria, 2: Semanal, 3: Mensual, 4: Anual
        public bool Activo { get; set; } = true; // Indica si el gasto es recurrente o no
        public bool Notificar { get; set; } = false; // Indica si se debe notificar al usuario sobre el gasto recurrente
        public int IdMetodoPago { get; set; }
        public string Nota {get; set;} = string.Empty; // Nota adicional para el gasto
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        public DateTime FechaActualizacion { get; set; } = DateTime.Now;
    }
}