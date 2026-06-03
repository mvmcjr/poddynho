using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using CliFx;
using CliFx.Binding;
using CliFx.Infrastructure;

namespace Poddynho.Fetch;

[Command(Description = "Busca todos os postos Petrobras via API e exporta JSON compatível com ImportadorPetrobras")]
public partial class FetchCommand : ICommand
{
    [CommandOption("token", Description = "Token de autorização (valor do header Authorization)", EnvironmentVariable = "TOKEN")]
    public required string Token { get; set; }

    [CommandOption("latitude", 'a', Description = "Latitude do centro da busca")]
    public double Latitude { get; set; } = -22.737978794443222;

    [CommandOption("longitude", 'o', Description = "Longitude do centro da busca")]
    public double Longitude { get; set; } = -47.227411810308695;

    [CommandOption("limit", 'l', Description = "Postos por página (padrão: 100)")]
    public int Limit { get; set; } = 100;

    [CommandOption("distance", 'd', Description = "Raio de busca em km (padrão: 300k)")]
    public int DistanceKm { get; set; } = 300_000;

    [CommandOption("output", Description = "Caminho do arquivo de saída (padrão: stdout)")]
    public string? OutputPath { get; set; }

    private const string GraphQlUrl = "https://appb2c.petrobraspremmia.com.br/graphql";

    private const string Query =
        """
        query gasStationsV3($filters: GasStationFiltersV3) {
          gasStationsV3(filters: $filters) {
            page
            total
            lastPage
            gasStations {
              id
              name
              cnpj
              favorite
              phone
              latitude
              longitude
              zipCode
              state
              city
              neighborhood
              street
              tipStatus
              distance
              closeToGasStation
              fuels {
                id
                name
                code
                icon
                __typename
              }
              paymentMethods {
                paymentMethodName
                __typename
              }
              services {
                id
                name
                code
                __typename
              }
              __typename
            }
            __typename
          }
        }
        """;

    public async ValueTask ExecuteAsync(IConsole console)
    {
        using var http = BuildHttpClient();

        var allStations = new List<JsonNode>();
        var page = 1;
        bool lastPage;

        do
        {
            var body = BuildRequestBody(page);
            var response = await http.PostAsJsonAsync(GraphQlUrl, body);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadFromJsonAsync<JsonNode>();
            var result = json?["data"]?["gasStationsV3"]
                         ?? throw new InvalidOperationException($"Resposta inesperada na página {page}.");

            lastPage = result["lastPage"]?.GetValue<bool>() ?? true;

            var stations = result["gasStations"]?.AsArray();
            if (stations != null)
                foreach (var station in stations)
                    if (station != null)
                        allStations.Add(station.DeepClone());

            var total = result["total"]?.GetValue<int>() ?? 0;
            await console.Error.WriteLineAsync(
                $"[{page}] {stations?.Count ?? 0} postos | acumulado: {allStations.Count}/{total}");

            page++;
        } while (!lastPage);

        await console.Error.WriteLineAsync($"Concluído. {allStations.Count} postos no total.");

        var outputJson = JsonSerializer.Serialize(allStations, new JsonSerializerOptions { WriteIndented = true });

        if (OutputPath != null)
            await File.WriteAllTextAsync(OutputPath, outputJson);
        else
            await console.Output.WriteAsync(outputJson);
    }

    private HttpClient BuildHttpClient()
    {
        var http = new HttpClient();
        http.DefaultRequestHeaders.Add("accept", "application/graphql-response+json,application/json;q=0.9");
        http.DefaultRequestHeaders.Add("x-app-version", "7.9.0+30301844");
        http.DefaultRequestHeaders.Add("platform-os", "android");
        http.DefaultRequestHeaders.Add("platform-sdk", "28");
        http.DefaultRequestHeaders.Add("platform-version", "9");
        http.DefaultRequestHeaders.Add("platform-model", "moto g(7) power");
        http.DefaultRequestHeaders.Add("device-id", "866d76c0d85705c8");
        http.DefaultRequestHeaders.Add("user-agent", "BRApp/7.9.0 (moto g(7) power; Android 9; Build/30301844)");
        http.DefaultRequestHeaders.Add("authorization", Token);
        return http;
    }

    private object BuildRequestBody(int page)
    {
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var locationInfo = new
        {
            timestamp = now,
            provider = "fused",
            accuracy = 16.509000778198242,
            altitude = 640.2999877929688,
            altitudeAccuracy = 37.742950439453125,
            heading = 0,
            speed = 0.0
        };

        return new
        {
            operationName = "gasStationsV3",
            variables = new
            {
                filters = new
                {
                    page,
                    limit = Limit,
                    location = new { latitude = Latitude, longitude = Longitude, locationInfo },
                    deviceLocation = new { latitude = Latitude, longitude = Longitude, locationInfo },
                    services = Array.Empty<string>(),
                    fuels = Array.Empty<string>(),
                    exclusiveCoupons = false,
                    topRated = false,
                    enableProximityRadius = true,
                    distanceKm = DistanceKm
                }
            },
            extensions = new
            {
                clientLibrary = new { name = "@apollo/client", version = "4.0.6" }
            },
            query = Query
        };
    }
}
