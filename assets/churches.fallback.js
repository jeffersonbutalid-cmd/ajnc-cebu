/* =====================================================
   AJNC — Built-in church dataset (fallback)
   Used when Supabase isn't configured (or a fetch fails). Only AJNC Cebu is
   live today. The other cities are placeholders for AJNC's growing family:
   they carry NO invented address, phone, pastor, or service time. They are
   marked comingSoon so the finder shows them honestly until real details are
   confirmed. Keep in sync with supabase/schema.sql.
   ===================================================== */
window.AJNC_FALLBACK_CHURCHES = [
  {
    id: "cebu", slug: "cebu", name: "AJNC Cebu",
    region: "visayas", province: "Cebu", city: "Mandaue City",
    address: "2nd Floor, Un Heng Building, Casuntingan, Mandaue City, Cebu",
    pastor: "Pastor Mario Doromal",
    services: ["Sunday 10:00 AM", "Sunday 3:00 PM", "Thursday 6:30 PM"],
    phone: "+63 917 555 4673", website: "/microsite/?church=cebu", coords: [10.3242, 123.9398]
  },

  // Coming soon: real cities, no invented details yet.
  { id: "manila",   slug: "manila",   name: "AJNC Manila",         region: "luzon",    province: "Metro Manila",      city: "Quezon City",    comingSoon: true, coords: [14.6760, 121.0437] },
  { id: "davao",    slug: "davao",    name: "AJNC Davao",          region: "mindanao", province: "Davao del Sur",     city: "Davao City",     comingSoon: true, coords: [7.0731, 125.6128] },
  { id: "iloilo",   slug: "iloilo",   name: "AJNC Iloilo",         region: "visayas",  province: "Iloilo",            city: "Iloilo City",    comingSoon: true, coords: [10.7202, 122.5621] },
  { id: "cdo",      slug: "cdo",      name: "AJNC Cagayan de Oro", region: "mindanao", province: "Misamis Oriental",  city: "Cagayan de Oro", comingSoon: true, coords: [8.4542, 124.6319] },
  { id: "baguio",   slug: "baguio",   name: "AJNC Baguio",         region: "luzon",    province: "Benguet",           city: "Baguio City",    comingSoon: true, coords: [16.4023, 120.5960] },
  { id: "bacolod",  slug: "bacolod",  name: "AJNC Bacolod",        region: "visayas",  province: "Negros Occidental", city: "Bacolod City",   comingSoon: true, coords: [10.6770, 122.9500] },
  { id: "pampanga", slug: "pampanga", name: "AJNC Pampanga",       region: "luzon",    province: "Pampanga",          city: "Angeles City",   comingSoon: true, coords: [15.1450, 120.5887] }
];
