require('dotenv').config();
const mongoose = require('mongoose');
const User         = require('../models/User');
const Recipe       = require('../models/Recipe');
const NutritionPlan= require('../models/NutritionPlan');
const RefreshToken = require('../models/RefreshToken');
const Bookmark     = require('../models/Bookmark');
const MealPlan     = require('../models/MealPlan');
const ShoppingList = require('../models/ShoppingList');
const Review       = require('../models/Review');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB...');

  await Promise.all([User,Recipe,NutritionPlan,RefreshToken,Bookmark,MealPlan,ShoppingList,Review]
    .map((M) => M.deleteMany({})));
  console.log('Cleared existing data.');

  const admin = await User.create({ username:'admin', email:'admin@nutrinest.app',
    password:'Admin1234', role:'admin', isVerified:true, isActive:true });

  const nutritionist = await User.create({ username:'dr_sara', email:'sara@nutrinest.app',
    password:'Admin1234', role:'nutritionist', isVerified:true, isActive:true,
    nutritionistProfile: { bio:'Registered dietitian with 10 years of experience.',
      credentials:'MSc Nutrition, RD', specializations:['weight-loss','diabetic diet','sports nutrition'] } });

  const user = await User.create({ username:'aisha_noor', email:'aisha@nutrinest.app',
    password:'Admin1234', role:'user', isVerified:true, isActive:true });

  console.log('Users created.');

  const r1 = await Recipe.create({
    title:'Grilled Chicken Salad', author:user._id, isPublished:true, isVerified:true,
    description:'A light and healthy grilled chicken salad with fresh vegetables.',
    ingredients:[{name:'Chicken breast',quantity:200,unit:'g'},{name:'Romaine lettuce',quantity:100,unit:'g'},
      {name:'Cherry tomatoes',quantity:50,unit:'g'},{name:'Olive oil',quantity:2,unit:'tbsp'},{name:'Lemon juice',quantity:1,unit:'tbsp'}],
    steps:['Season chicken with salt, pepper, garlic powder.','Grill 6-7 min per side.',
           'Rest 5 min then slice.','Toss veggies with olive oil and lemon.','Top with chicken.'],
    tags:['salad','chicken','healthy'], dietLabels:['gluten-free','dairy-free'],
    prepMinutes:10, cookMinutes:15, servings:2, difficulty:'easy',
    nutritionInfo:{ calories:320,protein:38,carbs:8,fat:14,fiber:3,verifiedBy:nutritionist._id,verifiedAt:new Date() },
  });

  const r2 = await Recipe.create({
    title:'Overnight Oats', author:nutritionist._id, isPublished:true, isVerified:true,
    description:'Quick and nutritious no-cook breakfast prepared the night before.',
    ingredients:[{name:'Rolled oats',quantity:80,unit:'g'},{name:'Milk',quantity:200,unit:'ml'},
      {name:'Greek yogurt',quantity:50,unit:'g'},{name:'Honey',quantity:1,unit:'tbsp'},{name:'Banana',quantity:1,unit:'pieces'}],
    steps:['Combine oats, milk, and yogurt in a jar.','Stir in honey.','Seal and refrigerate overnight.','Top with banana in the morning.'],
    tags:['breakfast','oats','meal-prep'], dietLabels:['vegetarian','high-protein'],
    prepMinutes:5, cookMinutes:0, servings:1, difficulty:'easy',
    nutritionInfo:{ calories:410,protein:18,carbs:62,fat:9,fiber:7,verifiedBy:nutritionist._id,verifiedAt:new Date() },
  });

  const r3 = await Recipe.create({
    title:'Red Lentil Soup', author:user._id, isPublished:true, isVerified:false,
    description:'A hearty and filling vegan lentil soup perfect for winter.',
    ingredients:[{name:'Red lentils',quantity:200,unit:'g'},{name:'Onion',quantity:1,unit:'pieces'},
      {name:'Garlic',quantity:3,unit:'pieces'},{name:'Carrot',quantity:1,unit:'pieces'},
      {name:'Cumin powder',quantity:1,unit:'tsp'},{name:'Vegetable broth',quantity:800,unit:'ml'}],
    steps:['Saute onion and garlic until translucent.','Add carrot and cumin, cook 2 min.',
           'Add rinsed lentils and broth.','Simmer 25 min until soft.','Blend partially. Season and serve.'],
    tags:['soup','vegan','lentil'], dietLabels:['vegan','gluten-free','dairy-free'],
    prepMinutes:10, cookMinutes:30, servings:4, difficulty:'easy',
  });

  console.log('Recipes created.');

  await NutritionPlan.create({
    title:'Balanced 7-Day Weight Loss Plan', createdBy:nutritionist._id,
    description:'A nutritionist-curated weekly plan for healthy, sustainable weight loss.',
    targetAudience:'weight-loss', dietType:'balanced', durationWeeks:1,
    dailyCalorieTarget:1600, isPublished:true,
    weeklyPlan:[{ day:'Monday', breakfast:r2._id, lunch:r1._id, dinner:r3._id,
      notes:'Drink at least 2L of water today.' }],
  });

  console.log('Nutrition plan created.');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Seed complete! Demo credentials:');
  console.log('  Admin:        admin@nutrinest.app / Admin1234');
  console.log('  Nutritionist: sara@nutrinest.app  / Admin1234');
  console.log('  User:         aisha@nutrinest.app / Admin1234');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
