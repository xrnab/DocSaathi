"use server";

// Geoapify Geocoding API
export async function geocodeLocation(query) {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  
  if (!apiKey) {
    return { error: "API_KEY_MISSING" };
  }

  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query)}&apiKey=${apiKey}&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.features && data.features.length > 0) {
      const props = data.features[0].properties;
      return { 
        lat: props.lat, 
        lng: props.lon, 
        displayName: props.formatted 
      };
    }
    return { error: "Location not found" };
  } catch (error) {
    return { error: error.message };
  }
}

// Geoapify Places API for pharmacies
export async function getNearbyPharmacies(lat, lng, radiusKm, keyword = "") {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  
  if (!apiKey) {
    return { error: "API_KEY_MISSING", pharmacies: [] };
  }

  try {
    const radiusMeters = radiusKm * 1000;
    
    // Geoapify filter uses LONGITUDE then LATITUDE (lon,lat)
    const filter = `circle:${lng},${lat},${radiusMeters}`;
    
    // Base URL for healthcare.pharmacy
    let url = `https://api.geoapify.com/v2/places?categories=healthcare.pharmacy&filter=${filter}&bias=proximity:${lng},${lat}&limit=15&apiKey=${apiKey}`;
    
    // If a keyword is provided, we can use the 'name' parameter to filter
    if (keyword) {
      url += `&name=${encodeURIComponent(keyword)}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    
    if (data.statusCode) {
       // Geoapify returns statusCode on error
       return { error: data.message || "Geoapify API Error", pharmacies: [] };
    }
    
    if (!data.features) {
      return { pharmacies: [] };
    }

    let pharmacies = data.features.map(feature => {
      const props = feature.properties;
      
      // Calculate distance in km from Geoapify's exact distance in meters
      const distanceKm = props.distance ? Number((props.distance / 1000).toFixed(1)) : 0;
      
      const name = props.name || "Unnamed Pharmacy";
      
      // Construct address
      const address = props.address_line2 || props.formatted || "Address not available";
      
      const phone = props.contact?.phone || null;
      const openingHours = props.opening_hours || "Hours not specified";

      // Pseudo-random status for demo
      const statusSeed = name.length % 3;
      const status = statusSeed === 0 ? "Verified" : (statusSeed === 1 ? "24/7 Available" : "Home Delivery");

      return {
        id: props.place_id,
        name,
        address,
        distance: distanceKm,
        lat: props.lat,
        lng: props.lon,
        phone,
        hours: openingHours,
        status: status
      };
    });

    return { pharmacies };
  } catch (error) {
    console.error("Pharmacy fetch error:", error);
    return { error: "Failed to connect to Geoapify API.", pharmacies: [] };
  }
}
