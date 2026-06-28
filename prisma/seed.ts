import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const plants = [
  {
    name: "Туя Смарагд",
    description:
      "Вечнозелёная колонновидная туя с насыщенной изумрудной хвоей. Идеальна для живых изгородей и солитерных посадок.",
    price: 3200,
    imageUrl:
      "https://images.unsplash.com/photo-1459411552885-9e45b934b92f?w=800&q=80",
    category: "Хвойные",
    stock: 18,
  },
  {
    name: "Можжевельник Блю Эрроу",
    description:
      "Стройный хвойный кустарник с серебристо-голубой хвоей. Зимостоек, неприхотлив, подходит для рокариев и альпинариев.",
    price: 2800,
    imageUrl:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
    category: "Хвойные",
    stock: 14,
  },
  {
    name: "Кустовая Роза",
    description:
      "Обильно цветущий кустарник с ароматными бутонами. Цветёт с июня по октябрь, устойчива к заболеваниям.",
    price: 1950,
    imageUrl:
      "https://images.unsplash.com/photo-1518709594023-6eab42af2546?w=800&q=80",
    category: "Цветущие",
    stock: 22,
  },
  {
    name: "Гортензия",
    description:
      "Пышные шапки соцветий от белого до насыщенно-фиолетового. Любит полутень и регулярный полив.",
    price: 2400,
    imageUrl:
      "https://images.unsplash.com/photo-1509423350714-97f9360b4e09?w=800&q=80",
    category: "Цветущие",
    stock: 16,
  },
  {
    name: "Спирея японская",
    description:
      "Декоративный кустарник с мелкими белыми цветами и изящной кроной. Отлично смотрится в групповых посадках.",
    price: 1650,
    imageUrl:
      "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=800&q=80",
    category: "Кустарники",
    stock: 20,
  },
  {
    name: "Самшит вечнозелёный",
    description:
      "Классический куст для формовой стрижки и бордюров. Медленный рост, плотная крона, теневынослив.",
    price: 2100,
    imageUrl:
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80",
    category: "Кустарники",
    stock: 12,
  },
];

const services = [
  {
    title: "Ландшафтный дизайн",
    description:
      "Проектирование сада под ключ: зонирование участка, подбор растений, 3D-визуализация и план посадок.",
    price: 35000,
  },
  {
    title: "Устройство газона",
    description:
      "Подготовка почвы, укладка рулонного или посевного газона, система полива и первичный уход.",
    price: 18000,
  },
  {
    title: "Сезонное обслуживание сада",
    description:
      "Весенняя и осенняя обрезка, подкормка, обработка от вредителей, санитарный уход за кустарниками.",
    price: 8500,
  },
];

async function main() {
  await prisma.callbackRequest.deleteMany();
  await prisma.plant.deleteMany();
  await prisma.service.deleteMany();

  await prisma.plant.createMany({ data: plants });
  await prisma.service.createMany({ data: services });

  console.log(`Seed completed: ${plants.length} plants, ${services.length} services.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
