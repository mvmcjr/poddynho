# syntax=docker/dockerfile:1.6
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY backend/Poddynho.sln ./
COPY backend/Poddynho.Api/Poddynho.Api.csproj backend/Poddynho.Api/
COPY backend/Poddynho.Domain/Poddynho.Domain.csproj backend/Poddynho.Domain/
COPY backend/Poddynho.Petrobras/Poddynho.Petrobras.csproj backend/Poddynho.Petrobras/
RUN dotnet restore backend/Poddynho.Api/Poddynho.Api.csproj
COPY backend/ ./backend/
RUN dotnet publish backend/Poddynho.Api/Poddynho.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "Poddynho.Api.dll"]
