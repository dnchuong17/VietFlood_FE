type WindyMapProps = {
    lat?: number;
    lon?: number;
    zoom?: number;
    overlay?: "rain" | "wind" | "temp" | "clouds" | "pressure" | "rh";
    product?: "ecmwf" | "gfs";
    mapOnlyMode?: boolean;
};

export function WindyMap({
    lat = 16.0,
    lon = 106.5,
    zoom = 6,
    overlay = "rain",
    product = "ecmwf",
    mapOnlyMode = false,
}: WindyMapProps) {
    const menu = mapOnlyMode ? "false" : "true";
    const message = mapOnlyMode ? "false" : "true";
    const marker = mapOnlyMode ? "false" : "true";
    const detail = mapOnlyMode ? "false" : "true";

    const embedUrl = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=${zoom}&level=surface&overlay=${overlay}&product=${product}&menu=${menu}&message=${message}&marker=${marker}&calendar=now&pressure=true&type=map&location=coordinates&detail=${detail}&detailLat=${lat}&detailLon=${lon}&metricWind=default&metricTemp=default&radarRange=-1`;

    return (
        <section className="relative h-full w-full bg-[#071726]">
            <iframe
                title="Windy interactive map"
                src={embedUrl}
                className="h-full w-full border-0"
                loading="eager"
                referrerPolicy="no-referrer-when-downgrade"
                allow="fullscreen"
            />
        </section>
    );
}
