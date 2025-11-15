using Microsoft.EntityFrameworkCore;

namespace Poddynho;

public static class AmbienteHelper
{
    public static bool EstáEmMigration(this IHostEnvironment ambiente) => EF.IsDesignTime;
    
    public static string ObterVariavelAmbiente(string nome, IHostEnvironment ambiente)
    {
        var valorEnv = Environment.GetEnvironmentVariable(nome);
        
        if (valorEnv == null && ambiente.EstáEmMigration())
        {
            return string.Empty;
        }
        
        return valorEnv ??
               throw new Exception(
                   $"{nome} não foi configurada");
    }
}