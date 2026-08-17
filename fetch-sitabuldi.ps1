# CityTwin - Fetch Sitabuldi study-area OSM GeoJSON
# Run this script from the CityTwin project root or place it in the project root.
# Source: OpenStreetMap via Overpass API (ODbL).

$ErrorActionPreference = 'Stop'

$ProjectRoot = (Get-Location).Path
$DataRoot = Join-Path $ProjectRoot 'data\json\sitabuldi'
$PublicRoot = Join-Path $ProjectRoot 'public\data\sitabuldi'
$SourceFile = Join-Path $DataRoot 'SOURCE.txt'

# Sitabuldi study area: covers Sitabuldi Fort, Empress Mall, central Sitabuldi roads,
# Nagpur Junction vicinity and surrounding urban context.
$South = 21.1370
$West  = 79.0750
$North = 21.1580
$East  = 79.1050
$BBox = "$South,$West,$North,$East"

$OverpassUrl = 'https://overpass.private.coffee/api/interpreter'
$Headers = @{
    'User-Agent' = 'CityTwin-Nagpur-Hackathon/1.0 (OpenStreetMap Overpass data extract)'
}

New-Item -ItemType Directory -Force $DataRoot | Out-Null
New-Item -ItemType Directory -Force $PublicRoot | Out-Null

function Invoke-OverpassJson {
    param(
        [Parameter(Mandatory=$true)][string]$Query,
        [Parameter(Mandatory=$true)][string]$Name
    )

    Write-Host "Fetching $Name ..." -ForegroundColor Cyan
    $body = @{ data = $Query }
    $response = Invoke-RestMethod -Method Post -Uri $OverpassUrl -Headers $Headers -Body $body -TimeoutSec 240
    if (-not $response.elements) {
        throw "No OSM elements returned for $Name."
    }
    Write-Host ("  Received {0} elements" -f $response.elements.Count) -ForegroundColor Green
    return $response
}

function WayToFeature {
    param([object]$Element, [string]$GeometryKind = 'LineString')
    if (-not $Element.geometry -or $Element.geometry.Count -lt 2) { return $null }
    $coords = @()
    foreach ($p in $Element.geometry) {
        $coords += ,@([double]$p.lon, [double]$p.lat)
    }

    $props = @{}
    if ($Element.tags) {
        foreach ($p in $Element.tags.psobject.Properties) {
            $props[$p.Name] = $p.Value
        }
    }
    $props['osm_id'] = $Element.id
    $props['osm_type'] = $Element.type

    if ($GeometryKind -eq 'Polygon') {
        if ($coords.Count -lt 4) { return $null }
        $first = $coords[0]
        $last = $coords[$coords.Count - 1]
        if ($first[0] -ne $last[0] -or $first[1] -ne $last[1]) {
            $coords += ,@($first[0], $first[1])
        }
        $geometry = @{ type = 'Polygon'; coordinates = @(@($coords)) }
    }
    else {
        $geometry = @{ type = 'LineString'; coordinates = @($coords) }
    }

    return [ordered]@{
        type = 'Feature'
        properties = $props
        geometry = $geometry
    }
}

function NodeToFeature {
    param([object]$Element)
    if ($null -eq $Element.lat -or $null -eq $Element.lon) { return $null }
    $props = @{}
    if ($Element.tags) {
        foreach ($p in $Element.tags.psobject.Properties) {
            $props[$p.Name] = $p.Value
        }
    }
    $props['osm_id'] = $Element.id
    $props['osm_type'] = $Element.type
    return [ordered]@{
        type = 'Feature'
        properties = $props
        geometry = @{ type = 'Point'; coordinates = @([double]$Element.lon, [double]$Element.lat) }
    }
}

function SaveGeoJson {
    param(
        [Parameter(Mandatory=$true)][string]$FileName,
        [Parameter(Mandatory=$true)][array]$Features
    )
    $clean = @($Features | Where-Object { $_ -ne $null })
    $geojson = [ordered]@{
        type = 'FeatureCollection'
        name = [IO.Path]::GetFileNameWithoutExtension($FileName)
        features = $clean
    }
    $json = $geojson | ConvertTo-Json -Depth 20
    $dst1 = Join-Path $DataRoot $FileName
    $dst2 = Join-Path $PublicRoot $FileName
    Set-Content -Path $dst1 -Value $json -Encoding UTF8
    Set-Content -Path $dst2 -Value $json -Encoding UTF8
    Write-Host "  Saved $FileName" -ForegroundColor Green
}

# 1) Buildings
$qBuildings = @"
[out:json][timeout:180];
way[building]($BBox);
out body geom;
"@
$b = Invoke-OverpassJson $qBuildings 'buildings'
$buildingFeatures = @()
foreach ($e in $b.elements) {
    $f = WayToFeature $e 'Polygon'
    if ($f) { $buildingFeatures += $f }
}
SaveGeoJson 'buildings_clean.json' $buildingFeatures

# 2) Roads
$qRoads = @"
[out:json][timeout:180];
way[highway]($BBox);
out body geom;
"@
$r = Invoke-OverpassJson $qRoads 'roads'
$roadFeatures = @()
foreach ($e in $r.elements) {
    $f = WayToFeature $e 'LineString'
    if ($f) { $roadFeatures += $f }
}
SaveGeoJson 'roads_clean.json' $roadFeatures

# 3) Green spaces / parks
$qGreen = @"
[out:json][timeout:180];
(
  way[leisure~"^(park|garden|playground|recreation_ground)$"]($BBox);
  way[landuse~"^(grass|recreation_ground|forest)$"]($BBox);
  way[natural~"^(wood|scrub)$"]($BBox);
);
out body geom;
"@
$g = Invoke-OverpassJson $qGreen 'green spaces'
$greenFeatures = @()
foreach ($e in $g.elements) {
    $f = WayToFeature $e 'Polygon'
    if ($f) { $greenFeatures += $f }
}
SaveGeoJson 'green_spaces_clean.json' $greenFeatures

# 4) Water surfaces + waterway lines
$qWater = @"
[out:json][timeout:180];
(
  way[natural=water]($BBox);
  way[waterway]($BBox);
);
out body geom;
"@
$w = Invoke-OverpassJson $qWater 'water'
$waterFeatures = @()
foreach ($e in $w.elements) {
    $isArea = $e.tags -and (($e.tags.natural -eq 'water') -or ($e.tags.water -ne $null))
    $kind = if ($isArea -and $e.geometry.Count -ge 4) { 'Polygon' } else { 'LineString' }
    $f = WayToFeature $e $kind
    if ($f) { $waterFeatures += $f }
}
SaveGeoJson 'water_bodies_clean.json' $waterFeatures

# 5) Important places / POIs / named landmarks
$qPois = @"
[out:json][timeout:180];
(
  nwr[amenity]($BBox);
  nwr[tourism]($BBox);
  nwr[historic]($BBox);
  nwr[shop]($BBox);
  nwr[public_transport]($BBox);
  nwr[railway~"^(station|halt|tram_stop)$"]($BBox);
  nwr[leisure~"^(stadium|park|garden)$"]($BBox);
  nwr["name"~"Sitabuldi Fort|Empress Mall",i]($BBox);
);
out body center geom;
"@
$p = Invoke-OverpassJson $qPois 'POIs and landmarks'
$poiFeatures = @()
foreach ($e in $p.elements) {
    if ($e.type -eq 'node') {
        $f = NodeToFeature $e
    }
    elseif ($e.type -eq 'way') {
        # Use a point for UI markers; retain tags and the OSM reference.
        $center = $e.center
        if ($center) {
            $fakeNode = [pscustomobject]@{lat=$center.lat; lon=$center.lon; tags=$e.tags; id=$e.id; type=$e.type}
            $f = NodeToFeature $fakeNode
        }
        else { $f = $null }
    }
    else { $f = $null }
    if ($f) { $poiFeatures += $f }
}
SaveGeoJson 'important_places_clean.json' $poiFeatures

# 6) Exact landmark geometry: Sitabuldi Fort + Empress Mall
$qLandmarks = @"
[out:json][timeout:120];
(
  way(246262219);
  way(398516190);
);
out body geom;
"@
$l = Invoke-OverpassJson $qLandmarks 'exact landmark geometry'
$landmarkFeatures = @()
foreach ($e in $l.elements) {
    $f = WayToFeature $e 'Polygon'
    if ($f) { $landmarkFeatures += $f }
}
SaveGeoJson 'landmarks_clean.json' $landmarkFeatures

# 7) Study boundary - exact extract bbox used for this dataset
$boundary = [ordered]@{
    type = 'FeatureCollection'
    name = 'study_boundary'
    features = @(
        [ordered]@{
            type = 'Feature'
            properties = [ordered]@{
                name = 'Sitabuldi_Study_Area'
                source = 'CityTwin development bbox'
                south = $South; west = $West; north = $North; east = $East
            }
            geometry = [ordered]@{
                type = 'Polygon'
                coordinates = @(
                    @(
                        @([double]$West, [double]$South),
                        @([double]$East, [double]$South),
                        @([double]$East, [double]$North),
                        @([double]$West, [double]$North),
                        @([double]$West, [double]$South)
                    )
                )
            }
        }
    )
}
$boundaryJson = $boundary | ConvertTo-Json -Depth 20
Set-Content (Join-Path $DataRoot 'study_boundary.json') $boundaryJson -Encoding UTF8
Set-Content (Join-Path $PublicRoot 'study_boundary.json') $boundaryJson -Encoding UTF8

$sourceText = @"
CityTwin Sitabuldi study-area extract

Source: OpenStreetMap contributors
Accessed through Overpass API: $OverpassUrl
Bounding box: south=$South west=$West north=$North east=$East
Extract generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')

OSM data is licensed under the Open Database License (ODbL).
Provide OpenStreetMap attribution in the application and documentation.

Important landmarks included by OSM object IDs:
- Sitabuldi Fort: way/246262219
- Empress Mall: way/398516190

Note: this is an OSM-based planning/MVP dataset. It does not represent a surveyed or engineering-certified digital twin.
"@
Set-Content -Path $SourceFile -Value $sourceText -Encoding UTF8

Write-Host ''
Write-Host 'DONE.' -ForegroundColor Green
Write-Host "Dataset written to:" -ForegroundColor Cyan
Write-Host "  $DataRoot"
Write-Host "  $PublicRoot"
Write-Host ''
Write-Host 'Next: inspect the files in QGIS / CityTwin before building the 3D renderer.' -ForegroundColor Yellow
