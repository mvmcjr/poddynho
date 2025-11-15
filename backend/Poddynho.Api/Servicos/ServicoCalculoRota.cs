using Google.Api.Gax.Grpc;
using Google.Maps.Routing.V2;
using LightResults;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using Poddynho.DbContexts;
using Poddynho.Domain.Modelos;
using Poddynho.Extensoes;
using Poddynho.Modelos;
using Location = Google.Maps.Routing.V2.Location;

namespace Poddynho.Servicos;

public class ServicoCalculoRota(PostosDbContext postosDbContext)
{
    public async ValueTask<Result<RespostaCalculoRotaDto>> CalcularRota(RequisicaoComputarRota requisicao)
    {
        var client = await RoutesClient.CreateAsync();

        var request = new ComputeRoutesRequest
        {
            Origin = new Waypoint
            {
                Location = new Location { LatLng = requisicao.Origem.ParaLatLng() }
            },
            Destination = new Waypoint
            {
                Location = new Location { LatLng = requisicao.Destino.ParaLatLng() }
            },
            TravelMode = requisicao.ModoViagem,
            RoutingPreference = requisicao.PreferenciasRota
        };

        if (requisicao.PontosIntermediarios.Count > 0)
        {
            foreach (var parada in requisicao.PontosIntermediarios)
            {
                request.Intermediates.Add(new Waypoint
                {
                    Location = parada.ParaLocation()
                });
            }
        }

        const string fieldMask = "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline";

        var resposta = await client.ComputeRoutesAsync(request, CallSettings.FromHeader("X-Goog-FieldMask", fieldMask));

        var rota = resposta.Routes.First();
        var decodedPath = rota.Polyline.Decode()
            .Select(x => new Coordinate(x.Longitude, x.Latitude));
        var routeLineString = new LineString(decodedPath.ToArray());

        var postos = await postosDbContext.Postos
            .AsAsyncEnumerable()
            .Where(x => requisicao.TiposCombustivel.Count == 0 ||
                        x.Combustiveis.Any(c => requisicao.TiposCombustivel.Contains(c)))
            .ToListAsync();
        var postosProximos = new List<Posto>();

        const double degreesToKm = 111.132;

        foreach (var station in postos)
        {
            var stationPoint = new Point((double)station.Localizacao.Longitude, (double)station.Localizacao.Latitude);
            var distanceInDegrees = routeLineString.Distance(stationPoint);
            var distanceInKm = distanceInDegrees * degreesToKm;

            if (distanceInKm <= requisicao.DistanciaMaximaEmKm)
            {
                postosProximos.Add(station);
            }
        }

        return new RespostaCalculoRotaDto(
            new RotaDto(rota.DistanceMeters, rota.Duration.ToTimeSpan(), rota.Polyline.EncodedPolyline),
            postosProximos);
    }
}