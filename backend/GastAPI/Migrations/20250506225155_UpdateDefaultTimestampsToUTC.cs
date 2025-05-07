using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GastAPI.Migrations
{
    public partial class UpdateDefaultTimestampsToUTC : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            string[] tablas = new[]
            {
                "usuarios", "gastos", "categorias", "presupuestos", "historial_de_cambios",
                "etiquetas_personalizadas", "etiquetas_gasto", "recordatorios_de_pago", "metodos_de_pago"
            };

            foreach (var tabla in tablas)
            {
                migrationBuilder.AlterColumn<DateTime>(
                    name: "FechaCreacion",
                    table: tabla,
                    type: "timestamp without time zone",
                    nullable: false,
                    defaultValueSql: "now() at time zone 'utc'",
                    oldClrType: typeof(DateTime),
                    oldType: "timestamp without time zone",
                    oldDefaultValueSql: "now()");

                migrationBuilder.AlterColumn<DateTime>(
                    name: "FechaActualizacion",
                    table: tabla,
                    type: "timestamp without time zone",
                    nullable: false,
                    defaultValueSql: "now() at time zone 'utc'",
                    oldClrType: typeof(DateTime),
                    oldType: "timestamp without time zone",
                    oldDefaultValueSql: "now()");
            }
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            string[] tablas = new[]
            {
                "usuarios", "gastos", "categorias", "presupuestos", "historial_de_cambios",
                "etiquetas_personalizadas", "etiquetas_gasto", "recordatorios_de_pago", "metodos_de_pago"
            };

            foreach (var tabla in tablas)
            {
                migrationBuilder.AlterColumn<DateTime>(
                    name: "FechaCreacion",
                    table: tabla,
                    type: "timestamp without time zone",
                    nullable: false,
                    defaultValueSql: "now()",
                    oldClrType: typeof(DateTime),
                    oldType: "timestamp without time zone",
                    oldDefaultValueSql: "now() at time zone 'utc'");

                migrationBuilder.AlterColumn<DateTime>(
                    name: "FechaActualizacion",
                    table: tabla,
                    type: "timestamp without time zone",
                    nullable: false,
                    defaultValueSql: "now()",
                    oldClrType: typeof(DateTime),
                    oldType: "timestamp without time zone",
                    oldDefaultValueSql: "now() at time zone 'utc'");
            }
        }
    }
}
