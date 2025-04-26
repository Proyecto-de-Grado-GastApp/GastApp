using GastAPI.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Agrega servicios al contenedor
builder.Services.AddControllers(); // <- Importante para habilitar controladores
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(); // <- Swagger para ver la documentación de la API

// Configura el contexto con PostgreSQL
builder.Services.AddDbContext<AppDbContext>(
    options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
);

var app = builder.Build();

// Configura el pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();           // <- Habilita Swagger
    app.UseSwaggerUI();         // <- Muestra la interfaz gráfica
}

app.UseHttpsRedirection();
app.UseAuthorization();

// Mapea tus controladores (CRUDs)
app.MapControllers(); // <- Aquí se activan tus endpoints tipo /usuarios, etc.

app.Run();
