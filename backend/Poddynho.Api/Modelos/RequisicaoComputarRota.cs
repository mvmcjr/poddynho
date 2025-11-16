using Google.Maps.Routing.V2;
using Poddynho.Domain.Modelos;

namespace Poddynho.Modelos;

public record RequisicaoComputarRota
{
    public required PontoGeografico Origem { get; init; }

    public required PontoGeografico Destino { get; init; }

    public double DistanciaMaximaEmKm { get; init; } = 20.0;

    public ICollection<TipoCombustivel> TiposCombustivel { get; init; } =
    [
    ];
    
    public ICollection<PontoGeografico> PontosIntermediarios { get; init; } =
    [
    ];

    public RouteTravelMode ModoViagem { get; set; } = RouteTravelMode.Drive;

    public RoutingPreference PreferenciasRota { get; set; } = RoutingPreference.Unspecified;
}