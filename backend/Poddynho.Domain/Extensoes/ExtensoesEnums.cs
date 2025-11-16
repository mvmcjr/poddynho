using System.Reflection;
using Poddynho.Domain.Modelos;

namespace Poddynho.Domain.Extensoes;

public static class ExtensoesEnums
{
    private static T? ObterAtributo<T>(this Enum enumValue) where T : Attribute
    {
        var type = enumValue.GetType();
        // Use GetField to get the field info for the enum value
        var memInfo = type.GetField(enumValue.ToString(), BindingFlags.Public | BindingFlags.Static);

        if (memInfo == null)
            return null;

        // Retrieve the custom attributes of type T
        var attributes = memInfo.GetCustomAttributes<T>(false);
        return attributes.FirstOrDefault();
    }

    public static string ObterNome(this TipoCombustivel combustivel) =>
        combustivel.ObterAtributo<System.ComponentModel.DataAnnotations.DisplayAttribute>()?.Name ??
        combustivel.ToString();
}