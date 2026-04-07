# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj files and restore as distinct layers
COPY ["Markopilot.Api/Markopilot.Api.csproj", "Markopilot.Api/"]
COPY ["Markopilot.Core/Markopilot.Core.csproj", "Markopilot.Core/"]
COPY ["Markopilot.Infrastructure/Markopilot.Infrastructure.csproj", "Markopilot.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "Markopilot.Api/Markopilot.Api.csproj"

# Copy remaining source code
COPY . .

# Build and publish
WORKDIR "/src/Markopilot.Api"
RUN dotnet publish "Markopilot.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Railway defaults to port 8080 or the PORT env var
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "Markopilot.Api.dll"]
