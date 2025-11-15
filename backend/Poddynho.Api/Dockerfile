FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["Poddynho.Api/Poddynho.Api.csproj", "Poddynho.Api/"]
COPY ["Poddynho.Domain/Poddynho.Domain.csproj", "Poddynho.Domain/"]
COPY ["Poddynho.Petrobras/Poddynho.Petrobras.csproj", "Poddynho.Petrobras/"]
RUN dotnet restore "Poddynho.Api/Poddynho.Api.csproj"
COPY . .
WORKDIR "/src/Poddynho.Api"
RUN dotnet build "./Poddynho.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Poddynho.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Poddynho.Api.dll"]
