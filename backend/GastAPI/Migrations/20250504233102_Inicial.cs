using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GastAPI.Migrations
{
    /// <inheritdoc />
    public partial class Inicial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "categorias",
                columns: table => new
                {
                    id_categorias = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre_categoria = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    descripcion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_categorias", x => x.id_categorias);
                });

            migrationBuilder.CreateTable(
                name: "metodos_de_pago",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NombreMetodo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_metodos_de_pago", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "usuarios",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Contrasena = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "etiquetas_personalizadas",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UsuarioId = table.Column<long>(type: "bigint", nullable: true),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_etiquetas_personalizadas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_etiquetas_personalizadas_usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "gastos",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UsuarioId = table.Column<long>(type: "bigint", nullable: false),
                    CategoriaId = table.Column<long>(type: "bigint", nullable: true),
                    MetodoPagoId = table.Column<long>(type: "bigint", nullable: true),
                    Cantidad = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Frecuencia = table.Column<int>(type: "integer", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    Notificar = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Nota = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gastos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_gastos_categorias_CategoriaId",
                        column: x => x.CategoriaId,
                        principalTable: "categorias",
                        principalColumn: "id_categorias");
                    table.ForeignKey(
                        name: "FK_gastos_metodos_de_pago_MetodoPagoId",
                        column: x => x.MetodoPagoId,
                        principalTable: "metodos_de_pago",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_gastos_usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "presupuestos",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UsuarioId = table.Column<long>(type: "bigint", nullable: false),
                    CategoriaId = table.Column<long>(type: "bigint", nullable: false),
                    Cantidad = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    FechaInicio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaFin = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_presupuestos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_presupuestos_categorias_CategoriaId",
                        column: x => x.CategoriaId,
                        principalTable: "categorias",
                        principalColumn: "id_categorias",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_presupuestos_usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "etiquetas_gasto",
                columns: table => new
                {
                    EtiquetaId = table.Column<long>(type: "bigint", nullable: false),
                    GastoId = table.Column<long>(type: "bigint", nullable: false),
                    EtiquetaPersonalizadaId = table.Column<long>(type: "bigint", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_etiquetas_gasto", x => new { x.EtiquetaId, x.GastoId });
                    table.ForeignKey(
                        name: "FK_etiquetas_gasto_etiquetas_personalizadas_EtiquetaPersonaliz~",
                        column: x => x.EtiquetaPersonalizadaId,
                        principalTable: "etiquetas_personalizadas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_etiquetas_gasto_gastos_GastoId",
                        column: x => x.GastoId,
                        principalTable: "gastos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "historial_de_cambios",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GastoId = table.Column<long>(type: "bigint", nullable: false),
                    FechaCambio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    descripcion_cambio = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsuarioId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_historial_de_cambios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_historial_de_cambios_gastos_GastoId",
                        column: x => x.GastoId,
                        principalTable: "gastos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_historial_de_cambios_usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "recordatorios_de_pago",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GastoId = table.Column<long>(type: "bigint", nullable: true),
                    FechaRecordatorio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Notificado = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsuarioId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_recordatorios_de_pago", x => x.Id);
                    table.ForeignKey(
                        name: "FK_recordatorios_de_pago_gastos_GastoId",
                        column: x => x.GastoId,
                        principalTable: "gastos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_recordatorios_de_pago_usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_etiquetas_gasto_EtiquetaPersonalizadaId",
                table: "etiquetas_gasto",
                column: "EtiquetaPersonalizadaId");

            migrationBuilder.CreateIndex(
                name: "IX_etiquetas_gasto_GastoId",
                table: "etiquetas_gasto",
                column: "GastoId");

            migrationBuilder.CreateIndex(
                name: "IX_etiquetas_personalizadas_UsuarioId",
                table: "etiquetas_personalizadas",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_gastos_CategoriaId",
                table: "gastos",
                column: "CategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_gastos_MetodoPagoId",
                table: "gastos",
                column: "MetodoPagoId");

            migrationBuilder.CreateIndex(
                name: "IX_gastos_UsuarioId_Fecha",
                table: "gastos",
                columns: new[] { "UsuarioId", "Fecha" });

            migrationBuilder.CreateIndex(
                name: "IX_historial_de_cambios_GastoId",
                table: "historial_de_cambios",
                column: "GastoId");

            migrationBuilder.CreateIndex(
                name: "IX_historial_de_cambios_UsuarioId",
                table: "historial_de_cambios",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_presupuestos_CategoriaId",
                table: "presupuestos",
                column: "CategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_presupuestos_UsuarioId_FechaInicio",
                table: "presupuestos",
                columns: new[] { "UsuarioId", "FechaInicio" });

            migrationBuilder.CreateIndex(
                name: "IX_recordatorios_de_pago_GastoId",
                table: "recordatorios_de_pago",
                column: "GastoId");

            migrationBuilder.CreateIndex(
                name: "IX_recordatorios_de_pago_UsuarioId",
                table: "recordatorios_de_pago",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_usuarios_Email",
                table: "usuarios",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "etiquetas_gasto");

            migrationBuilder.DropTable(
                name: "historial_de_cambios");

            migrationBuilder.DropTable(
                name: "presupuestos");

            migrationBuilder.DropTable(
                name: "recordatorios_de_pago");

            migrationBuilder.DropTable(
                name: "etiquetas_personalizadas");

            migrationBuilder.DropTable(
                name: "gastos");

            migrationBuilder.DropTable(
                name: "categorias");

            migrationBuilder.DropTable(
                name: "metodos_de_pago");

            migrationBuilder.DropTable(
                name: "usuarios");
        }
    }
}
