using Google.Maps.Routing.V2;
using Google.Type;
using Poddynho.Domain.Modelos;

namespace Poddynho.Extensoes;

public static class ExtensoesModelos
{
    public static LatLng ParaLatLng(this PontoGeografico ponto)
    {
        return new LatLng
        {
            Latitude = (double)ponto.Latitude,
            Longitude = (double)ponto.Longitude
        };
    }
    
    public static Location ParaLocation(this PontoGeografico ponto)
    {
        return new Location
        {
            LatLng = ponto.ParaLatLng()
        };
    }
}