const MOCK_DETAIL_DATA = {
  planned_date: "2026-05-01",
  items: [
    {
      id: 1,
      food: { name: "Cà chua bi", category: "Rau củ" },
      quantity: 0.5,
      unit: "kg",
      is_purchased: false,
      assignee: { name: "Mẹ" },
    },
    {
      id: 2,
      food: { name: "Rau muống", category: "Rau củ" },
      quantity: 2,
      unit: "bó",
      is_purchased: true,
      assignee: { name: "Bố" },
    },
    {
      id: 3,
      food: { name: "Cá hồi phi lê", category: "Thịt & Hải sản" },
      quantity: 1,
      unit: "kg",
      is_purchased: false,
      assignee: { name: "Mẹ" },
    },
    {
      id: 4,
      food: { name: "Trứng gà ta", category: "Sữa & Trứng" },
      quantity: 10,
      unit: "quả",
      is_purchased: false,
      assignee: { name: "Xuân" },
    },
  ],
};

export default MOCK_DETAIL_DATA;
