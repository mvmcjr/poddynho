using System.Text;
using Google.Maps.Routing.V2;
using Google.Type;

namespace Poddynho.Modelos;

/// Taken from: https://stackoverflow.com/a/38583403
/// <summary>
/// Google Polyline Converter (Encoder and Decoder)
/// </summary>
public static class ExtensoesPolyline
{
    /// <summary>
    /// Decodes the specified polyline string.
    /// </summary>
    /// <param name="polyline"></param>
    /// <returns>A list with Locations</returns>
    public static IEnumerable<LatLng> Decode(this Polyline polyline)
    {
        var polylineString = polyline.EncodedPolyline;
        
        if (string.IsNullOrEmpty(polylineString))
            throw new ArgumentNullException(nameof(polylineString));

        var polylineChars = polylineString.ToCharArray();
        var index = 0;

        var currentLat = 0;
        var currentLng = 0;

        while (index < polylineChars.Length)
        {
            // Next lat
            var sum = 0;
            var shifter = 0;
            int nextFiveBits;
            do
            {
                nextFiveBits = polylineChars[index++] - 63;
                sum |= (nextFiveBits & 31) << shifter;
                shifter += 5;
            } while (nextFiveBits >= 32 && index < polylineChars.Length);

            if (index >= polylineChars.Length)
                break;

            currentLat += (sum & 1) == 1 ? ~(sum >> 1) : (sum >> 1);

            // Next lng
            sum = 0;
            shifter = 0;
            do
            {
                nextFiveBits = polylineChars[index++] - 63;
                sum |= (nextFiveBits & 31) << shifter;
                shifter += 5;
            } while (nextFiveBits >= 32 && index < polylineChars.Length);

            if (index >= polylineChars.Length && nextFiveBits >= 32)
                break;

            currentLng += (sum & 1) == 1 ? ~(sum >> 1) : (sum >> 1);

            yield return new LatLng
            {
                Latitude = Convert.ToDouble(currentLat) / 1E5,
                Longitude = Convert.ToDouble(currentLng) / 1E5
            };
        }
    }

    /// <summary>
    /// Encodes the specified locations list.
    /// </summary>
    /// <param name="locations">The locations.</param>
    /// <returns>The polyline string.</returns>
    public static string Encode(IEnumerable<Location> locations)
    {
        var str = new StringBuilder();

        var encodeDiff = (Action<int>)(diff =>
        {
            var shifted = diff << 1;
            if (diff < 0)
                shifted = ~shifted;

            var rem = shifted;

            while (rem >= 0x20)
            {
                str.Append((char)((0x20 | (rem & 0x1f)) + 63));

                rem >>= 5;
            }

            str.Append((char)(rem + 63));
        });

        var lastLat = 0;
        var lastLng = 0;

        foreach (var point in locations)
        {
            var lat = (int)Math.Round(point.LatLng.Latitude * 1E5);
            var lng = (int)Math.Round(point.LatLng.Longitude * 1E5);

            encodeDiff(lat - lastLat);
            encodeDiff(lng - lastLng);

            lastLat = lat;
            lastLng = lng;
        }

        return str.ToString();
    }
}