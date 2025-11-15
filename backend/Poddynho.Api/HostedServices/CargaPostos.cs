using Poddynho.DbContexts;
using Poddynho.Domain.Infra;

namespace Poddynho.HostedServices;

internal class CargaPostos(
    IServiceProvider provedor,
    ILogger<CargaPostos> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = provedor.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PostosDbContext>();
        var importadores = scope.ServiceProvider.GetServices<IImportadorPostos>();

        foreach (var importador in importadores)
        {
            var nomeImportador = importador.GetType().Name;
            
            try
            {
                var registros = await importador.ImportarPostosAsync(cancellationToken);
                logger.LogInformation("Importados {Quantidade} postos de {Importador}", registros.Count,
                    nomeImportador);
                
                dbContext.Postos.AddRange(registros);
            }
            catch (Exception e)
            {
                logger.LogError(e, "Erro ao importar postos de {Importador}", nomeImportador);
            }
        }
        
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}