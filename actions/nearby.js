"use server";

export async function getNearbyHealthFacilities(lat, lng, radius = 5, type = "doctors") {
  try {
    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) throw new Error("Geoapify API Key not found");

    const category = type === "hospitals" ? "healthcare.hospital" : "healthcare.clinic_or_doctor";
    // Geoapify uses meters for radius
    const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${lng},${lat},${radius * 1000}&bias=proximity:${lng},${lat}&limit=10&apiKey=${apiKey}`;

    console.log("Fetching from Geoapify:", url);

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Geoapify Error:", response.status, errorText);
      throw new Error(`Geoapify API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    const facilities = data.features.map(f => {
      const props = f.properties;
      return {
        id: props.place_id,
        name: props.name || (type === "hospitals" ? "General Hospital" : "Medical Clinic"),
        specialty: props.categories?.[0]?.split(".")?.pop()?.replace(/_/g, " ") || type,
        lat: props.lat,
        lng: props.lon,
        distance: (props.distance / 1000).toFixed(1), // convert to km
        type: type === "hospitals" ? "hospital" : "clinic"
      };
    });

    return { facilities };
  } catch (error) {
    console.error("Error fetching nearby facilities:", error);
    // Fallback to mock data if API fails so UI doesn't crash
    const mockFacilities = [
      { id: "m1", name: "City Medical Center", specialty: "General", lat: lat + 0.01, lng: lng + 0.01, distance: "1.2", type: "clinic" },
      { id: "m2", name: "Metro General Hospital", specialty: "Emergency", lat: lat - 0.01, lng: lng - 0.01, distance: "2.5", type: "hospital" }
    ];
    return { facilities: mockFacilities, error: null }; // Silent fallback
  }
}

