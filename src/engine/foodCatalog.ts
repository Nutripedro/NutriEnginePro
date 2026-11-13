/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FoodItem } from './types';

// =========================================================================
// BASE DE DADOS NUTRICIONAL REAL: TACO / TBCA (Tabela Brasileira de Composição de Alimentos)
// Dados per 100g de alimento comestível
// =========================================================================

export const INITIAL_FOOD_CATALOG: FoodItem[] = [
  {
    foodId: 'FOOD_001',
    name: 'Arroz integral cozido',
    source: 'TACO',
    category: 'Cereais e derivados',
    referenceWeightGrams: 100,
    energyKcal: 124,
    carbohydratesG: 25.8,
    proteinG: 2.6,
    lipidsG: 1.0,
    fiberG: 2.7,
    sodiumMg: 1,
    potassiumMg: 79,
    calciumMg: 5,
    ironMg: 0.3,
    allergens: [],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Colher de sopa cheia', grams: 25 },
      { name: 'Xícara de chá', grams: 150 },
      { name: 'Escumadeira média', grams: 100 }
    ],
    preparationTips: 'Cozido em água com pouco sal e alho.'
  },
  {
    foodId: 'FOOD_002',
    name: 'Arroz branco cozido',
    source: 'TACO',
    category: 'Cereais e derivados',
    referenceWeightGrams: 100,
    energyKcal: 128,
    carbohydratesG: 28.1,
    proteinG: 2.5,
    lipidsG: 0.2,
    fiberG: 1.6,
    sodiumMg: 1,
    potassiumMg: 28,
    calciumMg: 4,
    ironMg: 0.2,
    allergens: [],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Colher de sopa cheia', grams: 25 },
      { name: 'Xícara de chá', grams: 150 }
    ]
  },
  {
    foodId: 'FOOD_003',
    name: 'Feijão carioca cozido',
    source: 'TACO',
    category: 'Leguminosas',
    referenceWeightGrams: 100,
    energyKcal: 76,
    carbohydratesG: 13.6,
    proteinG: 4.8,
    lipidsG: 0.5,
    fiberG: 8.5,
    sodiumMg: 2,
    potassiumMg: 255,
    calciumMg: 27,
    ironMg: 1.3,
    allergens: [],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Concha média cheia (grão + caldo)', grams: 130 },
      { name: 'Colher de sopa cheia', grams: 20 }
    ]
  },
  {
    foodId: 'FOOD_004',
    name: 'Feijão preto cozido',
    source: 'TACO',
    category: 'Leguminosas',
    referenceWeightGrams: 100,
    energyKcal: 77,
    carbohydratesG: 14.0,
    proteinG: 4.5,
    lipidsG: 0.5,
    fiberG: 8.4,
    sodiumMg: 2,
    potassiumMg: 240,
    calciumMg: 29,
    ironMg: 1.5,
    allergens: [],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Concha média cheia', grams: 130 }
    ]
  },
  {
    foodId: 'FOOD_005',
    name: 'Peito de frango grelhado',
    source: 'TACO',
    category: 'Carnes e ovos',
    referenceWeightGrams: 100,
    energyKcal: 159,
    carbohydratesG: 0.0,
    proteinG: 32.0,
    lipidsG: 2.5,
    fiberG: 0.0,
    sodiumMg: 50,
    potassiumMg: 350,
    calciumMg: 12,
    ironMg: 0.4,
    allergens: [],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: false,
    isVegan: false,
    householdMeasures: [
      { name: 'Bife médio', grams: 100 },
      { name: 'Filé grande', grams: 150 },
      { name: 'Frango desfiado (colher de sopa)', grams: 25 }
    ],
    preparationTips: 'Grelhado com antiaderente e ervas finas.'
  },
  {
    foodId: 'FOOD_006',
    name: 'Ovo de galinha cozido',
    source: 'TACO',
    category: 'Carnes e ovos',
    referenceWeightGrams: 100,
    energyKcal: 146,
    carbohydratesG: 0.6,
    proteinG: 13.3,
    lipidsG: 9.5,
    fiberG: 0.0,
    sodiumMg: 146,
    potassiumMg: 120,
    calciumMg: 49,
    ironMg: 1.5,
    allergens: ['egg'],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: false,
    householdMeasures: [
      { name: 'Unidade média', grams: 50 },
      { name: 'Unidade grande', grams: 60 }
    ]
  },
  {
    foodId: 'FOOD_007',
    name: 'Ovo de galinha mexido',
    source: 'TBCA',
    category: 'Carnes e ovos',
    referenceWeightGrams: 100,
    energyKcal: 167,
    carbohydratesG: 1.2,
    proteinG: 12.8,
    lipidsG: 12.1,
    fiberG: 0.0,
    sodiumMg: 180,
    allergens: ['egg'],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: false,
    householdMeasures: [
      { name: 'Colher de sopa cheia', grams: 30 },
      { name: 'Porção (2 ovos)', grams: 100 }
    ]
  },
  {
    foodId: 'FOOD_008',
    name: 'Patinho bovino grelhado',
    source: 'TACO',
    category: 'Carnes e ovos',
    referenceWeightGrams: 100,
    energyKcal: 219,
    carbohydratesG: 0.0,
    proteinG: 35.9,
    lipidsG: 7.3,
    fiberG: 0.0,
    sodiumMg: 60,
    allergens: [],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: false,
    isVegan: false,
    householdMeasures: [
      { name: 'Bife médio', grams: 100 },
      { name: 'Carne moída (colher de sopa)', grams: 30 }
    ]
  },
  {
    foodId: 'FOOD_009',
    name: 'Filé de Tilápia grelhado',
    source: 'TBCA',
    category: 'Pescados e frutos do mar',
    referenceWeightGrams: 100,
    energyKcal: 128,
    carbohydratesG: 0.0,
    proteinG: 26.1,
    lipidsG: 2.7,
    fiberG: 0.0,
    sodiumMg: 55,
    allergens: ['fish'],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: false,
    isVegan: false,
    householdMeasures: [
      { name: 'Filé médio', grams: 120 }
    ]
  },
  {
    foodId: 'FOOD_010',
    name: 'Filé de Salmão grelhado',
    source: 'TACO',
    category: 'Pescados e frutos do mar',
    referenceWeightGrams: 100,
    energyKcal: 229,
    carbohydratesG: 0.0,
    proteinG: 23.9,
    lipidsG: 14.0,
    fiberG: 0.0,
    sodiumMg: 62,
    allergens: ['fish'],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: false,
    isVegan: false,
    householdMeasures: [
      { name: 'Posta ou filé médio', grams: 120 }
    ]
  },
  {
    foodId: 'FOOD_011',
    name: 'Camarão cozido',
    source: 'TACO',
    category: 'Pescados e frutos do mar',
    referenceWeightGrams: 100,
    energyKcal: 91,
    carbohydratesG: 0.0,
    proteinG: 19.0,
    lipidsG: 1.1,
    fiberG: 0.0,
    sodiumMg: 280,
    allergens: ['crustaceans'],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: false,
    isVegan: false,
    householdMeasures: [
      { name: 'Porção média', grams: 100 }
    ]
  },
  {
    foodId: 'FOOD_012',
    name: 'Banana prata',
    source: 'TACO',
    category: 'Frutas e derivados',
    referenceWeightGrams: 100,
    energyKcal: 98,
    carbohydratesG: 26.0,
    proteinG: 1.3,
    lipidsG: 0.1,
    fiberG: 2.0,
    sodiumMg: 1,
    potassiumMg: 358,
    allergens: [],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Unidade média', grams: 85 },
      { name: 'Unidade grande', grams: 110 }
    ]
  },
  {
    foodId: 'FOOD_013',
    name: 'Maçã Fuji com casca',
    source: 'TACO',
    category: 'Frutas e derivados',
    referenceWeightGrams: 100,
    energyKcal: 56,
    carbohydratesG: 15.2,
    proteinG: 0.3,
    lipidsG: 0.2,
    fiberG: 1.3,
    sodiumMg: 1,
    allergens: [],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Unidade média', grams: 130 }
    ]
  },
  {
    foodId: 'FOOD_014',
    name: 'Mamão papaia',
    source: 'TACO',
    category: 'Frutas e derivados',
    referenceWeightGrams: 100,
    energyKcal: 40,
    carbohydratesG: 10.4,
    proteinG: 0.5,
    lipidsG: 0.1,
    fiberG: 1.0,
    sodiumMg: 2,
    allergens: [],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Metade de unidade pequena', grams: 140 },
      { name: 'Fatia média', grams: 100 }
    ]
  },
  {
    foodId: 'FOOD_015',
    name: 'Abacate',
    source: 'TACO',
    category: 'Frutas e derivados',
    referenceWeightGrams: 100,
    energyKcal: 96,
    carbohydratesG: 6.0,
    proteinG: 1.2,
    lipidsG: 8.4,
    fiberG: 6.3,
    sodiumMg: 1,
    allergens: [],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Colher de sopa cheia', grams: 40 },
      { name: 'Fatia média', grams: 100 }
    ]
  },
  {
    foodId: 'FOOD_016',
    name: 'Aveia em flocos',
    source: 'TACO',
    category: 'Cereais e derivados',
    referenceWeightGrams: 100,
    energyKcal: 394,
    carbohydratesG: 66.6,
    proteinG: 13.9,
    lipidsG: 8.5,
    fiberG: 9.1,
    sodiumMg: 4,
    allergens: ['wheat_gluten'], // Pode conter glúten por contaminação cruzada
    containsGluten: true,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Colher de sopa rasa', grams: 15 },
      { name: 'Colher de sopa cheia', grams: 30 }
    ]
  },
  {
    foodId: 'FOOD_017',
    name: 'Aveia sem glúten em flocos',
    source: 'CLINIC_CUSTOM',
    category: 'Cereais e derivados',
    referenceWeightGrams: 100,
    energyKcal: 389,
    carbohydratesG: 66.0,
    proteinG: 13.5,
    lipidsG: 7.0,
    fiberG: 10.0,
    sodiumMg: 2,
    allergens: [],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Colher de sopa cheia', grams: 30 }
    ]
  },
  {
    foodId: 'FOOD_018',
    name: 'Pão de forma integral',
    source: 'TACO',
    category: 'Panificados',
    referenceWeightGrams: 100,
    energyKcal: 253,
    carbohydratesG: 49.9,
    proteinG: 9.4,
    lipidsG: 3.7,
    fiberG: 6.9,
    sodiumMg: 450,
    allergens: ['wheat_gluten'],
    containsGluten: true,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Fatia', grams: 25 },
      { name: '2 Fatias (Sanduíche)', grams: 50 }
    ]
  },
  {
    foodId: 'FOOD_019',
    name: 'Pão de forma sem glúten',
    source: 'CLINIC_CUSTOM',
    category: 'Panificados',
    referenceWeightGrams: 100,
    energyKcal: 240,
    carbohydratesG: 48.0,
    proteinG: 4.5,
    lipidsG: 4.0,
    fiberG: 5.0,
    sodiumMg: 380,
    allergens: [],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Fatia', grams: 30 }
    ]
  },
  {
    foodId: 'FOOD_020',
    name: 'Tapioca (goma hidratada)',
    source: 'TACO',
    category: 'Tubérculos e derivados',
    referenceWeightGrams: 100,
    energyKcal: 240,
    carbohydratesG: 60.0,
    proteinG: 0.4,
    lipidsG: 0.2,
    fiberG: 0.5,
    sodiumMg: 1,
    allergens: [],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Colher de sopa cheia', grams: 20 },
      { name: 'Disco médio', grams: 80 }
    ]
  },
  {
    foodId: 'FOOD_021',
    name: 'Batata doce cozida',
    source: 'TACO',
    category: 'Tubérculos e derivados',
    referenceWeightGrams: 100,
    energyKcal: 77,
    carbohydratesG: 18.4,
    proteinG: 0.6,
    lipidsG: 0.1,
    fiberG: 2.2,
    sodiumMg: 3,
    potassiumMg: 148,
    allergens: [],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Fatia média', grams: 80 },
      { name: 'Unidade pequena', grams: 120 }
    ]
  },
  {
    foodId: 'FOOD_022',
    name: 'Mandioca / Aipim cozido',
    source: 'TACO',
    category: 'Tubérculos e derivados',
    referenceWeightGrams: 100,
    energyKcal: 125,
    carbohydratesG: 30.1,
    proteinG: 0.6,
    lipidsG: 0.3,
    fiberG: 1.6,
    sodiumMg: 2,
    allergens: [],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Pedaço médio', grams: 90 }
    ]
  },
  {
    foodId: 'FOOD_023',
    name: 'Leite desnatado UHT',
    source: 'TACO',
    category: 'Leite e derivados',
    referenceWeightGrams: 100,
    energyKcal: 35,
    carbohydratesG: 4.7,
    proteinG: 3.4,
    lipidsG: 0.2,
    fiberG: 0.0,
    sodiumMg: 52,
    calciumMg: 123,
    allergens: ['milk'],
    containsGluten: false,
    containsLactose: true,
    isVegetarian: true,
    isVegan: false,
    householdMeasures: [
      { name: 'Copo americano (150ml)', grams: 150 },
      { name: 'Xícara de chá (200ml)', grams: 200 }
    ]
  },
  {
    foodId: 'FOOD_024',
    name: 'Leite desnatado sem lactose',
    source: 'CLINIC_CUSTOM',
    category: 'Leite e derivados',
    referenceWeightGrams: 100,
    energyKcal: 35,
    carbohydratesG: 4.7,
    proteinG: 3.4,
    lipidsG: 0.2,
    fiberG: 0.0,
    sodiumMg: 50,
    calciumMg: 120,
    allergens: ['milk'], // Proteína do leite continua presente!
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: false,
    householdMeasures: [
      { name: 'Copo americano (150ml)', grams: 150 },
      { name: 'Xícara de chá (200ml)', grams: 200 }
    ]
  },
  {
    foodId: 'FOOD_025',
    name: 'Bebida vegetal de amêndoa (sem açúcar)',
    source: 'USDA',
    category: 'Substitutos vegetais de leite',
    referenceWeightGrams: 100,
    energyKcal: 15,
    carbohydratesG: 0.3,
    proteinG: 0.5,
    lipidsG: 1.1,
    fiberG: 0.2,
    sodiumMg: 70,
    calciumMg: 180,
    allergens: ['tree_nuts'],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Copo (200ml)', grams: 200 }
    ]
  },
  {
    foodId: 'FOOD_026',
    name: 'Bebida vegetal de soja',
    source: 'TBCA',
    category: 'Substitutos vegetais de leite',
    referenceWeightGrams: 100,
    energyKcal: 38,
    carbohydratesG: 2.1,
    proteinG: 3.0,
    lipidsG: 1.8,
    fiberG: 0.4,
    sodiumMg: 45,
    allergens: ['soy'],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Copo (200ml)', grams: 200 }
    ]
  },
  {
    foodId: 'FOOD_027',
    name: 'Iogurte natural desnatado',
    source: 'TACO',
    category: 'Leite e derivados',
    referenceWeightGrams: 100,
    energyKcal: 41,
    carbohydratesG: 5.8,
    proteinG: 3.8,
    lipidsG: 0.3,
    fiberG: 0.0,
    sodiumMg: 56,
    calciumMg: 135,
    allergens: ['milk'],
    containsGluten: false,
    containsLactose: true,
    isVegetarian: true,
    isVegan: false,
    householdMeasures: [
      { name: 'Pote individual', grams: 160 },
      { name: 'Colher de sopa cheia', grams: 30 }
    ]
  },
  {
    foodId: 'FOOD_028',
    name: 'Queijo minas frescal',
    source: 'TACO',
    category: 'Leite e derivados',
    referenceWeightGrams: 100,
    energyKcal: 264,
    carbohydratesG: 3.2,
    proteinG: 17.4,
    lipidsG: 20.2,
    fiberG: 0.0,
    sodiumMg: 310,
    calciumMg: 579,
    allergens: ['milk'],
    containsGluten: false,
    containsLactose: true,
    isVegetarian: true,
    isVegan: false,
    householdMeasures: [
      { name: 'Fatia média', grams: 30 }
    ]
  },
  {
    foodId: 'FOOD_029',
    name: 'Queijo cottage',
    source: 'TBCA',
    category: 'Leite e derivados',
    referenceWeightGrams: 100,
    energyKcal: 98,
    carbohydratesG: 3.4,
    proteinG: 11.1,
    lipidsG: 4.3,
    fiberG: 0.0,
    sodiumMg: 360,
    allergens: ['milk'],
    containsGluten: false,
    containsLactose: true,
    isVegetarian: true,
    isVegan: false,
    householdMeasures: [
      { name: 'Colher de sopa cheia', grams: 30 }
    ]
  },
  {
    foodId: 'FOOD_030',
    name: 'Tofu firme',
    source: 'TBCA',
    category: 'Leguminosas e derivados',
    referenceWeightGrams: 100,
    energyKcal: 76,
    carbohydratesG: 1.9,
    proteinG: 8.1,
    lipidsG: 4.8,
    fiberG: 0.3,
    sodiumMg: 7,
    calciumMg: 350,
    allergens: ['soy'],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Fatia média', grams: 60 },
      { name: 'Bloco pequeno', grams: 100 }
    ]
  },
  {
    foodId: 'FOOD_031',
    name: 'Azeite de oliva extra virgem',
    source: 'TACO',
    category: 'Óleos e gorduras',
    referenceWeightGrams: 100,
    energyKcal: 884,
    carbohydratesG: 0.0,
    proteinG: 0.0,
    lipidsG: 100.0,
    fiberG: 0.0,
    sodiumMg: 0,
    allergens: [],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Colher de chá', grams: 5 },
      { name: 'Colher de sopa', grams: 12 }
    ]
  },
  {
    foodId: 'FOOD_032',
    name: 'Castanha-do-Pará / Castanha-do-Brasil',
    source: 'TACO',
    category: 'Nozes e sementes',
    referenceWeightGrams: 100,
    energyKcal: 643,
    carbohydratesG: 15.1,
    proteinG: 14.5,
    lipidsG: 63.5,
    fiberG: 7.9,
    sodiumMg: 2,
    allergens: ['tree_nuts'],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Unidade média', grams: 5 }
    ]
  },
  {
    foodId: 'FOOD_033',
    name: 'Amendoim torrado sem sal',
    source: 'TACO',
    category: 'Nozes e sementes',
    referenceWeightGrams: 100,
    energyKcal: 544,
    carbohydratesG: 20.3,
    proteinG: 27.2,
    lipidsG: 43.9,
    fiberG: 8.0,
    sodiumMg: 6,
    allergens: ['peanut'],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Colher de sopa cheia', grams: 15 }
    ]
  },
  {
    foodId: 'FOOD_034',
    name: 'Pasta de amendoim integral',
    source: 'TBCA',
    category: 'Nozes e sementes',
    referenceWeightGrams: 100,
    energyKcal: 588,
    carbohydratesG: 20.0,
    proteinG: 25.0,
    lipidsG: 50.0,
    fiberG: 6.0,
    sodiumMg: 10,
    allergens: ['peanut'],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Colher de sopa', grams: 15 },
      { name: 'Colher de sobremesa', grams: 10 }
    ]
  },
  {
    foodId: 'FOOD_035',
    name: 'Whey Protein Isolado (Pó)',
    source: 'CLINIC_CUSTOM',
    category: 'Suplementos',
    referenceWeightGrams: 100,
    energyKcal: 370,
    carbohydratesG: 3.3,
    proteinG: 87.0,
    lipidsG: 1.0,
    fiberG: 0.0,
    sodiumMg: 160,
    allergens: ['milk'], // Proteína do soro do leite!
    containsGluten: false,
    containsLactose: false, // Isolado tem vestígios desprezíveis de lactose, mas allergen 'milk' é SIM
    isVegetarian: true,
    isVegan: false,
    householdMeasures: [
      { name: 'Dosador / Scoop (30g)', grams: 30 }
    ]
  },
  {
    foodId: 'FOOD_036',
    name: 'Proteína Isolada de Ervilha e Arroz (Pó Vegano)',
    source: 'CLINIC_CUSTOM',
    category: 'Suplementos',
    referenceWeightGrams: 100,
    energyKcal: 380,
    carbohydratesG: 6.0,
    proteinG: 80.0,
    lipidsG: 4.0,
    fiberG: 2.0,
    sodiumMg: 320,
    allergens: [],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Dosador / Scoop (30g)', grams: 30 }
    ]
  },
  {
    foodId: 'FOOD_037',
    name: 'Brócolis cozido',
    source: 'TACO',
    category: 'Hortaliças e verduras',
    referenceWeightGrams: 100,
    energyKcal: 25,
    carbohydratesG: 4.4,
    proteinG: 2.1,
    lipidsG: 0.5,
    fiberG: 3.4,
    sodiumMg: 3,
    allergens: [],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Xícara de chá', grams: 100 },
      { name: 'Ramo médio', grams: 40 }
    ]
  },
  {
    foodId: 'FOOD_038',
    name: 'Cenoura crua ralada',
    source: 'TACO',
    category: 'Hortaliças e verduras',
    referenceWeightGrams: 100,
    energyKcal: 34,
    carbohydratesG: 7.7,
    proteinG: 1.3,
    lipidsG: 0.2,
    fiberG: 3.2,
    sodiumMg: 3,
    allergens: [],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Colher de sopa cheia', grams: 15 },
      { name: 'Xícara de chá', grams: 70 }
    ]
  },
  {
    foodId: 'FOOD_039',
    name: 'Tomate salada',
    source: 'TACO',
    category: 'Hortaliças e verduras',
    referenceWeightGrams: 100,
    energyKcal: 15,
    carbohydratesG: 3.1,
    proteinG: 1.1,
    lipidsG: 0.2,
    fiberG: 1.2,
    sodiumMg: 1,
    allergens: [],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Fatia média', grams: 20 },
      { name: 'Unidade média', grams: 120 }
    ]
  },
  {
    foodId: 'FOOD_040',
    name: 'Alface crespa crua',
    source: 'TACO',
    category: 'Hortaliças e verduras',
    referenceWeightGrams: 100,
    energyKcal: 11,
    carbohydratesG: 1.7,
    proteinG: 1.3,
    lipidsG: 0.2,
    fiberG: 1.8,
    sodiumMg: 4,
    allergens: [],
    containsGluten: false,
    containsLactose: false,
    isVegetarian: true,
    isVegan: true,
    householdMeasures: [
      { name: 'Folha média', grams: 15 },
      { name: 'Prato de mesa cheio', grams: 80 }
    ]
  }
];

// Helper search & filter functions
export function getFoodById(foodId: string, catalog: FoodItem[] = INITIAL_FOOD_CATALOG): FoodItem | undefined {
  return catalog.find(item => item.foodId === foodId);
}

export function searchFoods(
  query: string,
  catalog: FoodItem[] = INITIAL_FOOD_CATALOG
): FoodItem[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return catalog;
  return catalog.filter(
    food =>
      food.name.toLowerCase().includes(normalized) ||
      food.category.toLowerCase().includes(normalized) ||
      food.source.toLowerCase().includes(normalized)
  );
}
