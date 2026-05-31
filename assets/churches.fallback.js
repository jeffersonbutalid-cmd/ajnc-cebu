/* =====================================================
   AJNC — Built-in church dataset (fallback)
   Used when Supabase isn't configured (or a fetch fails), so the
   Find-a-Church widget and every microsite render correct per-city
   content offline. When Supabase IS configured, live rows take
   precedence and these are ignored. Keep in sync with
   supabase/schema.sql seed data.
   ===================================================== */
window.AJNC_FALLBACK_CHURCHES = [
  {
    id: "cebu", slug: "cebu", name: "AJNC Cebu",
    region: "visayas", province: "Cebu", city: "Mandaue City",
    address: "2nd Floor Un Heng Building, Casuntingan, Mandaue City, Cebu 6014",
    pastor: "Bro. Mario Doromal",
    services: ["Sunday 10:00 AM", "Sunday 3:00 PM", "Thursday 6:30 PM"],
    phone: "+63 917 555 4673", website: "/churches/cebu", coords: [10.3242, 123.9398]
  },
  {
    id: "manila", slug: "manila", name: "AJNC Manila",
    region: "luzon", province: "Metro Manila", city: "Quezon City",
    address: "Sample Street, Quezon City, Metro Manila",
    pastor: "Pastor Cruz",
    services: ["Sunday 9:00 AM", "Sunday 6:00 PM"],
    phone: "+63 2 0000 0000", website: "/churches/manila", coords: [14.6760, 121.0437]
  },
  {
    id: "davao", slug: "davao", name: "AJNC Davao",
    region: "mindanao", province: "Davao del Sur", city: "Davao City",
    address: "Sample Street, Davao City",
    pastor: "Pastor Mendoza",
    services: ["Sunday 8:00 AM", "Sunday 5:00 PM"],
    phone: "+63 82 000 0000", website: "/churches/davao", coords: [7.0731, 125.6128]
  },
  {
    id: "iloilo", slug: "iloilo", name: "AJNC Iloilo",
    region: "visayas", province: "Iloilo", city: "Iloilo City",
    address: "Sample Street, Iloilo City",
    pastor: "Pastor Santos",
    services: ["Sunday 9:00 AM", "Sunday 5:00 PM"],
    phone: "+63 33 000 0000", website: "/churches/iloilo", coords: [10.7202, 122.5621]
  },
  {
    id: "cdo", slug: "cdo", name: "AJNC Cagayan de Oro",
    region: "mindanao", province: "Misamis Oriental", city: "Cagayan de Oro",
    address: "Sample Street, Cagayan de Oro",
    pastor: "Pastor Ramos",
    services: ["Sunday 8:30 AM", "Sunday 5:00 PM"],
    phone: "+63 88 000 0000", website: "/churches/cagayan-de-oro", coords: [8.4542, 124.6319]
  },
  {
    id: "baguio", slug: "baguio", name: "AJNC Baguio",
    region: "luzon", province: "Benguet", city: "Baguio City",
    address: "Sample Street, Baguio City",
    pastor: "Pastor Garcia",
    services: ["Sunday 9:00 AM", "Sunday 5:00 PM"],
    phone: "+63 74 000 0000", website: "/churches/baguio", coords: [16.4023, 120.5960]
  },
  {
    id: "bacolod", slug: "bacolod", name: "AJNC Bacolod",
    region: "visayas", province: "Negros Occidental", city: "Bacolod City",
    address: "Sample Street, Bacolod City",
    pastor: "Pastor Dela Cruz",
    services: ["Sunday 8:00 AM", "Sunday 5:00 PM"],
    phone: "+63 34 000 0000", website: "/churches/bacolod", coords: [10.6770, 122.9500]
  },
  {
    id: "pampanga", slug: "pampanga", name: "AJNC Pampanga",
    region: "luzon", province: "Pampanga", city: "Angeles City",
    address: "Sample Street, Angeles City, Pampanga",
    pastor: "Pastor Lim",
    services: ["Sunday 9:00 AM", "Sunday 5:00 PM"],
    phone: "+63 45 000 0000", website: "/churches/pampanga", coords: [15.1450, 120.5887]
  }
];
