const clothingNames = [
  'T-shirt',
  'Pants',
  'Skirt',
  'Dress',
  'Jacket',
  'Blouse',
  'Jeans',
  'Shorts',
  'Sweater',
  'Coat',
  'Hoodie',
  'Cardigan',
  'Tank Top',
  'Leggings',
  'Jumpsuit',
  'Romper',
  'Kimono',
  'Bikini',
  'Swimsuit',
  'Poncho',
  'Peacoat',
  'Windbreaker',
  'Raincoat',
  'Cargo Pants',
  'Chinos',
  'Capri Pants',
  'Crop Top',
  'Bodysuit',
  'Sarong',
  'Suspenders',
];

const clothingCategories = ['Tops', 'Bottoms', 'Dresses', 'Outerwear'];

const clothingTags = [
  'Casual',
  'Formal',
  'Summer',
  'Winter',
  'Work',
  'Party',
  'Travel',
];

const prices = [1000, 2000, 3000, 4000, 5000, 6000];

export const generateProduct = () => {
  const products = [];
  for (let i = 0; i < clothingNames.length; i++) {
    const product = {
      name: clothingNames[i],
      price: prices[Math.floor(Math.random() * prices.length)],
      amount: Math.floor(Math.random() * 20) + 1,
      tags: [
        clothingNames[i],
        ...clothingTags.slice(0, Math.random() * clothingTags.length),
      ],
      categories: [
        clothingCategories[
          Math.floor(Math.random() * clothingCategories.length)
        ],
      ],
    };

    products.push(product);
  }

  return products;
};
