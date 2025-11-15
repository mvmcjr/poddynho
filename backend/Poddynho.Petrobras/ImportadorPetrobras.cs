using System.Text.Json;
using System.Text.Json.Serialization;
using Poddynho.Domain.Infra;
using Poddynho.Domain.Modelos;

namespace Poddynho.Petrobras;

internal class ImportadorPetrobras : IImportadorPostos
{
    private record PostoCombustivel
    {
        [JsonPropertyName("id")]
        [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
        public int Id { get; init; }
        
        [JsonPropertyName("icon")]
        public Uri? Url { get; init; }
    }
    
    private record PostoJson
    {
        [JsonPropertyName("id")]
        public required string Id { get; init; }
        
        [JsonPropertyName("name")]
        public string? Nome { get; init; }
        
        [JsonPropertyName("latitude")]
        public decimal Latitude { get; init; }
        
        [JsonPropertyName("longitude")]
        public decimal Longitude { get; init; }
        
        [JsonPropertyName("fuels")]
        public List<PostoCombustivel>? Combustiveis { get; init; }
    }
    
    private static string? CaminhoJson { get; } = Environment.GetEnvironmentVariable("PETROBRAS_JSON_PATH");

    public async ValueTask<IReadOnlyCollection<Posto>> ImportarPostosAsync(
        CancellationToken cancellationToken = default)
    {
        if (CaminhoJson == null)
            return [];

        var info = new FileInfo(CaminhoJson);

        if (!info.Exists)
            throw new Exception("Caminho do arquivo JSON da Petrobras inválido.");

        await using var jsonStream = info.OpenRead();
        var postosPetrobras =
            await JsonSerializer.DeserializeAsync<IReadOnlyCollection<PostoJson>>(jsonStream, cancellationToken: cancellationToken);

        if(postosPetrobras == null)
            throw new Exception("Não foi possível desserializar o arquivo JSON da Petrobras.");
        
        return postosPetrobras
            .Where(x => x.Nome is not null)
            .Select(x => new Posto
            {
                Id = x.Id,
                Nome = x.Nome!,
                Bandeira = "Petrobras",
                Localizacao = new PontoGeografico(x.Latitude, x.Longitude),
                Combustiveis = x.Combustiveis?
                    .Select(c => c.Id switch
                    {
                        1 => Combustivel.Gasolina,
                        9 => Combustivel.Etanol,
                        3 => Combustivel.Premium,
                        _ => (Combustivel?)null
                    })
                    .Where(c => c != null)
                    .Select(c => c!.Value)
                    .ToList() ?? []
            })
            .ToList();
    }
}