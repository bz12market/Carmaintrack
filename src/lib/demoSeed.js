// Dados de exemplo para o modo demonstração. As datas são relativas a hoje
// para que os estados (em dia / a vencer / atrasado) façam sempre sentido.

const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export function demoSeed() {
  const now = new Date().toISOString();
  const c = (id, name, phone) => ({ id, name, phone, email: "", notes: "", created_at: now });
  const v = (id, client_id, plate, make, model, year, current_km, token) => ({
    id,
    client_id,
    plate,
    make,
    model,
    year,
    current_km,
    photo_url: "",
    reminders_enabled: true,
    public_token: token,
    created_at: now,
  });
  const s = (id, vehicle_id, date, km, oil, filters, next_km, next_date, extra = {}) => ({
    id,
    vehicle_id,
    date,
    km,
    title: "Mudança de óleo",
    oil,
    filters,
    extras: [],
    notes: "",
    next_km,
    next_date,
    created_at: now,
    ...extra,
  });

  return {
    workshop: {
      id: "demo-workshop",
      name: "Oficina Exemplo",
      tagline: "Manutenção auto desde 1998",
      logo_url: "",
      primary_color: "#0f766e",
      theme: null,
      phone: "+351 912 345 678",
      whatsapp: "+351 912 345 678",
      address: "Rua das Oficinas 12, Lisboa",
      default_interval_km: 15000,
      default_interval_months: 12,
      warn_km: 3000,
      warn_days: 30,
    },
    clients: [
      c("c1", "Inês Martins", "912000001"),
      c("c2", "Ricardo Costa", "913000002"),
      c("c3", "Ana Ferreira", "914000003"),
      c("c4", "João Silva", ""),
    ],
    vehicles: [
      v("v1", "c1", "BE-61-LM", "Renault", "Captur 1.3 TCe", 2022, 46400, "demo0000000000000000001a"),
      v("v2", "c2", "BC-39-HV", "Fiat", "500 Hybrid", 2022, 22600, "demo0000000000000000002b"),
      v("v3", "c3", "AT-12-ZX", "Volkswagen", "Golf 2.0 TDI", 2019, 118200, "demo0000000000000000003c"),
      v("v4", "c4", "88-QP-41", "Peugeot", "208 1.2 PureTech", 2017, 97300, "demo0000000000000000004d"),
    ],
    services: [
      s("s1", "v1", day(-530), 31400, "Elf Evolution 900 SXR 5W-30", ["Filtro de óleo"], 46400, day(-165)),
      s("s2", "v1", day(-310), 46400, "Elf Evolution 900 SXR 5W-30", ["Filtro de óleo", "Filtro de ar"], 61400, day(-45), {
        title: "Revisão",
        notes: "Pastilhas da frente a 40%.",
      }),
      s("s3", "v2", day(-420), 7600, "Selenia K Pure Energy 0W-30", ["Filtro de óleo"], 22600, day(-55)),
      s("s4", "v2", day(-20), 22600, "Selenia K Pure Energy 0W-30", ["Filtro de óleo", "Filtro de habitáculo"], 37600, day(345)),
      s("s5", "v3", day(-340), 103900, "Castrol Edge 5W-30 LL", ["Filtro de óleo", "Filtro de combustível"], 118900, day(25), {
        title: "Revisão",
        extras: [{ name: "Diagnóstico eletrónico", note: "Aviso de manutenção reposto" }],
      }),
      s("s6", "v4", day(-200), 89000, "Total Quartz Ineo 0W-30", ["Filtro de óleo", "Filtro de ar"], 104000, day(165)),
    ],
  };
}
