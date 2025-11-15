using Microsoft.Extensions.DependencyInjection;
using Poddynho.Domain.Infra;

namespace Poddynho.Petrobras;

public static class ExtensoesAplicacao
{
    public static void AdicionarServicosPetrobras(this IServiceCollection services)
    {
        services.AddSingleton<IImportadorPostos, ImportadorPetrobras>();
    }
}