using System.ComponentModel.DataAnnotations;

namespace GastAPI.Dtos.EtiquetasGasto
{
    public class CrearEtiquetaGastoDto
    {
        [Required]
        public long GastoId { get; set; }

        [Required]
        public long EtiquetaPersonalizadaId { get; set; }
    }
}