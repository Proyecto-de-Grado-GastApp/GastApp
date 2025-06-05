using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
using GastAPI.Services;
using GastAPI.Dtos;
using System;
using System.IO;
using System.Text.Json;

[ApiController]
[Route("api/[controller]")] // Ruta base sería /api/Ocr
public class OcrController : ControllerBase
{
    private readonly IOcrApiClient _ocrApiClient;
    private readonly ILogger<OcrController> _logger; // Inyectar ILogger

    public OcrController(IOcrApiClient ocrApiClient, ILogger<OcrController> logger)
    {
        _ocrApiClient = ocrApiClient;
        _logger = logger;
    }

    [HttpPost("process-ticket")] // Endpoint: POST /api/Ocr/process-ticket
    public async Task<IActionResult> ProcessTicket([FromForm] IFormFile imageFile)
    {
        if (imageFile == null || imageFile.Length == 0)
        {
            return BadRequest("No se proporcionó ningún archivo de imagen o el archivo está vacío.");
        }

        // Podrías añadir validaciones de tamaño de archivo, tipo de contenido, etc. aquí
        if (!imageFile.ContentType.StartsWith("image/"))
        {
             return BadRequest("El archivo proporcionado no es un tipo de imagen válido.");
        }

        try
        {
            _logger.LogInformation($"Procesando ticket: {imageFile.FileName}, Tamaño: {imageFile.Length}, Tipo: {imageFile.ContentType}");

            OcrServiceResponseDto ocrResult;
            await using (var imageStream = imageFile.OpenReadStream())
            {
                ocrResult = await _ocrApiClient.ProcessTicketImageAsync(imageStream, imageFile.FileName, imageFile.ContentType);
            }

            if (ocrResult?.ExtractedInformation == null)
            {
                _logger.LogWarning("El servicio OCR devolvió una respuesta vacía o sin información extraída.");
                return Ok(new { Message = "El servicio OCR procesó la imagen pero no extrajo información.", OcrRawOutput = ocrResult });
            }

            // Aquí puedes mapear ocrResult.ExtractedInformation a tus modelos de dominio de GastApp
            // y realizar acciones (guardar en BD, etc.)
            _logger.LogInformation($"Información extraída: Tienda='{ocrResult.ExtractedInformation.Tienda}', Fecha='{ocrResult.ExtractedInformation.Fecha}', Total='{ocrResult.ExtractedInformation.Total}'");

            // Devuelve la información extraída al cliente de GastApp
            return Ok(ocrResult.ExtractedInformation); 
        }
        catch (HttpRequestException httpEx)
        {
            _logger.LogError(httpEx, "Error de comunicación con el microservicio OCR.");
            return StatusCode(StatusCodes.Status503ServiceUnavailable, $"Error de comunicación con el servicio OCR: {httpEx.Message}");
        }
        catch (JsonException jsonEx)
        {
             _logger.LogError(jsonEx, "Error al deserializar la respuesta del microservicio OCR.");
            return StatusCode(StatusCodes.Status500InternalServerError, $"Error al interpretar la respuesta del servicio OCR: {jsonEx.Message}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado al procesar el ticket.");
            return StatusCode(StatusCodes.Status500InternalServerError, $"Ocurrió un error inesperado: {ex.Message}");
        }
    }
}