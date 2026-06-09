/* =====================================================
   AJNC — Built-in church dataset (fallback)
   Used when Supabase isn't configured (or a fetch fails). AJNC Cebu and the
   Negros Occidental family are live. The remaining cities are placeholders for
   AJNC's growing family: they carry NO invented address, pastor, or service
   time, and are marked comingSoon so the finder shows them honestly until real
   details are confirmed. We do not publish phone numbers or emails per church.
   Coordinates for the Negros churches are approximate town/city centers.
   Keep in sync with supabase/schema.sql.
   ===================================================== */
window.AJNC_FALLBACK_CHURCHES = [
  {
    id: "cebu", slug: "cebu", name: "AJNC Cebu",
    region: "visayas", province: "Cebu", city: "Mandaue City",
    address: "2nd Floor, Un Heng Building, Casuntingan, Mandaue City, Cebu",
    pastor: "Pastor Mario Doromal",
    services: ["Sunday 10:00 AM", "Sunday 3:00 PM", "Thursday 6:30 PM"],
    website: "/microsite/?church=cebu", coords: [10.3242, 123.9398]
  },
  {
    id: "bacolod", slug: "bacolod", name: "AJNC Bacolod",
    region: "visayas", province: "Negros Occidental", city: "Bacolod City",
    address: "2nd Floor, Javelosa Building, Luzuriaga Street, Bacolod City",
    pastor: "Ptr. Erwin H. Espera",
    services: ["Sunday 10:00 AM", "Sunday 3:30 PM", "Bible Study Tuesday 6:30 PM", "Prayer Meeting Mon (Men), Thu (Ladies), Fri (Youth) 6:30 PM"],
    website: "/microsite/?church=bacolod", coords: [10.6770, 122.9500]
  },
  {
    id: "cadiz", slug: "cadiz", name: "AJNC Cadiz",
    region: "visayas", province: "Negros Occidental", city: "Cadiz City",
    address: "Narra 2, Brgy. Tinampaan, Cadiz City",
    pastor: "Ptr. Alfredo Z. Lopez Jr.",
    services: ["Sunday 10:00 AM", "Sunday 4:00 PM", "Bible Study Thursday 6:00 PM", "Prayer Meeting Tuesday 6:00 PM"],
    website: "/microsite/?church=cadiz", coords: [10.9476, 123.3072]
  },
  {
    id: "saravia", slug: "saravia", name: "AJNC Saravia",
    region: "visayas", province: "Negros Occidental", city: "Saravia",
    address: "Boulevard, Saravia, Negros Occidental",
    pastor: "Bro. Leonil Batadlan",
    services: ["Sunday 10:00 AM", "Sunday 2:00 PM", "Prayer Meeting & Bible Study Wednesday 5:30 PM"],
    website: "/microsite/?church=saravia", coords: [10.8190, 123.0386]
  },
  {
    id: "atipuluan", slug: "atipuluan", name: "AJNC Atipuluan",
    region: "visayas", province: "Negros Occidental", city: "Atipuluan",
    address: "Prk. Greenhills, Brgy. Atipuluan, Bago City",
    pastor: "Bro. Jovin Gonzaga Jr.",
    services: ["Sunday 10:00 AM", "Sunday 3:30 PM", "Bible Study Thursday 6:00 PM", "Prayer Meeting Tuesday 6:00 PM"],
    website: "/microsite/?church=atipuluan", coords: [10.5552, 122.8649]
  },
  {
    id: "hinobaan", slug: "hinobaan", name: "AJNC Hinoba-an",
    region: "visayas", province: "Negros Occidental", city: "Hinoba-an",
    address: "Prk. 4, Brgy. 2, Hinoba-an, Negros Occidental",
    pastor: "Ptr. Lewis Lidres",
    services: ["Sunday 9:00 AM", "Bible Study 6:30 PM", "Prayer Meeting Tuesday 6:30 PM"],
    website: "/microsite/?church=hinobaan", coords: [9.5947, 122.4694]
  },
  {
    id: "kabankalan", slug: "kabankalan", name: "AJNC Kabankalan",
    region: "visayas", province: "Negros Occidental", city: "Kabankalan City",
    address: "Across NoCeCo Main Office, Sitio Naga, Brgy. Binicuil, Kabankalan City",
    pastor: "Bro. Mario G. Doromal",
    services: ["Sunday 10:00 AM", "Sunday 3:00 PM", "Bible Study Thursday 6:30 PM", "Prayer Meeting Tuesday 6:30 PM"],
    website: "/microsite/?church=kabankalan", coords: [9.9889, 122.8131]
  },

  // Coming soon: real cities, no invented details yet.
  { id: "manila",   slug: "manila",   name: "AJNC Manila",         region: "luzon",    province: "Metro Manila",      city: "Quezon City",    comingSoon: true, coords: [14.6760, 121.0437] },
  { id: "davao",    slug: "davao",    name: "AJNC Davao",          region: "mindanao", province: "Davao del Sur",     city: "Davao City",     comingSoon: true, coords: [7.0731, 125.6128] },
  { id: "iloilo",   slug: "iloilo",   name: "AJNC Iloilo",         region: "visayas",  province: "Iloilo",            city: "Iloilo City",    comingSoon: true, coords: [10.7202, 122.5621] },
  { id: "cdo",      slug: "cdo",      name: "AJNC Cagayan de Oro", region: "mindanao", province: "Misamis Oriental",  city: "Cagayan de Oro", comingSoon: true, coords: [8.4542, 124.6319] },
  { id: "baguio",   slug: "baguio",   name: "AJNC Baguio",         region: "luzon",    province: "Benguet",           city: "Baguio City",    comingSoon: true, coords: [16.4023, 120.5960] },
  { id: "pampanga", slug: "pampanga", name: "AJNC Pampanga",       region: "luzon",    province: "Pampanga",          city: "Angeles City",   comingSoon: true, coords: [15.1450, 120.5887] }
];
