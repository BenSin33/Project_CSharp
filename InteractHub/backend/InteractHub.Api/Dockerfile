FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["InteractHub.Api/InteractHub.Api.csproj", "InteractHub.Api/"]
RUN dotnet restore "InteractHub.Api/InteractHub.Api.csproj"
COPY . .
WORKDIR "/src/InteractHub.Api"
RUN dotnet build "InteractHub.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "InteractHub.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 5000
ENTRYPOINT ["dotnet", "InteractHub.Api.dll"]