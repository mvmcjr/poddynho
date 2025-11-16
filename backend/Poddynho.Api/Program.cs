using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Poddynho;
using Poddynho.DbContexts;
using Poddynho.HostedServices;
using Poddynho.Petrobras;
using Poddynho.Servicos;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddScoped<ServicoCalculoRota>();
builder.Services.Configure<RouteOptions>(options => { options.LowercaseUrls = true; });

builder.Services.AddDbContext<PostosDbContext>(o => o.UseInMemoryDatabase(nameof(PostosDbContext)));

builder.Services.AddHostedService<CargaPostos>();
builder.Services.AdicionarServicosPetrobras();

builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

builder.Services.AddCors();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference("/docs", o => { o.Title = "Poddynho API"; });
    
    app.UseCors(o => o
        .AllowAnyOrigin()
        .AllowAnyMethod()
        .AllowAnyHeader());
}
else
{
    app.UseCors(x =>
    {
        x.WithOrigins(AmbienteHelper.ObterVariavelAmbiente("PUBLIC_URL", app.Environment))
            .AllowAnyHeader()
            .AllowAnyMethod()
            .WithExposedHeaders("X-Logout");
    });
}

app.UseAuthorization();

app.MapControllers();

app.Run();