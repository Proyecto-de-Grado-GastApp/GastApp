using System.ComponentModel.DataAnnotations;

namespace GastAPI.Dtos.RecordatoriosPago
{
    public class RecordatorioPagoCreateDTO
    {
        public long GastoId { get; set; }

        [Required]
        public DateTime FechaRecordatorio { get; set; }
    }

}